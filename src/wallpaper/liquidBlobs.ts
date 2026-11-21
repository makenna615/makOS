import {
  bindFullScreenTriangle,
  createProgram,
  getWebGL,
  isEmptySpace,
  releaseWebGL,
  runLoop,
  trackPointer,
  trackSize,
  type Wallpaper,
} from './runtime';

/**
 * Modern: soft pastel blobs that drift and melt together like a lava lamp. One follows the
 * mouse (or wanders on its own when the mouse is still); clicking empty desktop drops in a new one.
 * Drawn per-pixel on the GPU so the edges stay smooth at any size.
 */

const MAX_BLOBS = 14;
const COLORS: [number, number, number][] = [
  [0.48, 0.64, 1],
  [0.75, 0.59, 1],
  [0.47, 0.86, 0.78],
  [1, 0.67, 0.8],
  [0.55, 0.78, 1],
];

const SHADER = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes;
uniform float uScale;
uniform vec3 uB[${MAX_BLOBS}];
uniform vec3 uC[${MAX_BLOBS}];
uniform int uN;
void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  float f = 0.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${MAX_BLOBS}; i++) {
    if (i >= uN) break;
    vec2 d = px - uB[i].xy;
    float v = uB[i].z * uB[i].z / (dot(d, d) + 1.0);
    f += v;
    col += uC[i] * v;
  }
  col /= max(f, 1e-4);
  // Measure the edge on a capped field: at a blob center f is huge and fwidth would overflow into a dot.
  float edge = fwidth(min(f, 3.0));
  float a = smoothstep(1.0 - edge * 1.5 - 0.02, 1.0 + edge * 1.5 + 0.02, f);
  vec2 q = px / (uRes / uScale);
  vec3 bg = mix(vec3(0.933, 0.949, 1.0), vec3(0.973, 0.933, 0.984), (q.x + q.y) * 0.5);
  gl_FragColor = vec4(mix(bg, col, a * 0.92), 1.0);
}`;

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: [number, number, number];
}

export const liquidBlobs: Wallpaper = async (canvas, { reducedMotion }) => {
  const gl = getWebGL(canvas);
  if (!gl || !gl.getExtension('OES_standard_derivatives')) {
    if (gl) releaseWebGL(gl);
    return null;
  }
  let program: WebGLProgram;
  try {
    program = createProgram(gl, SHADER);
  } catch {
    releaseWebGL(gl);
    return null;
  }
  gl.useProgram(program);
  bindFullScreenTriangle(gl, program);
  const uRes = gl.getUniformLocation(program, 'uRes');
  const uScale = gl.getUniformLocation(program, 'uScale');
  const uB = gl.getUniformLocation(program, 'uB');
  const uC = gl.getUniformLocation(program, 'uC');
  const uN = gl.getUniformLocation(program, 'uN');

  let cssW = canvas.clientWidth || 1280;
  let cssH = canvas.clientHeight || 800;
  const unit = () => Math.min(cssW, cssH) / 800; // blob sizes follow the screen size
  const blobs: Blob[] = [];
  for (let i = 0; i < 7; i++) {
    blobs.push({
      x: Math.random() * cssW,
      y: Math.random() * cssH,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      r: 55 + Math.random() * 45,
      color: COLORS[i % COLORS.length]!,
    });
  }
  const follower: Blob = { x: cssW / 2, y: cssH / 2, vx: 0, vy: 0, r: 75, color: [0.4, 0.55, 1] };
  const bufB = new Float32Array(MAX_BLOBS * 3);
  const bufC = new Float32Array(MAX_BLOBS * 3);

  let w = canvas.width;
  let h = canvas.height;
  const draw = () => {
    if (gl.isContextLost()) return;
    const all = [...blobs, follower];
    const k = unit();
    all.forEach((b, i) => {
      bufB.set([b.x, b.y, b.r * k], i * 3);
      bufC.set(b.color, i * 3);
    });
    gl.viewport(0, 0, w, h);
    gl.uniform3fv(uB, bufB);
    gl.uniform3fv(uC, bufC);
    gl.uniform1i(uN, all.length);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const stopSize = trackSize(canvas, { maxRatio: 1.5, maxWidth: 2400 }, (pw, ph, cw, ch) => {
    w = pw;
    h = ph;
    cssW = cw;
    cssH = ch;
    gl.uniform2f(uRes, pw, ph);
    gl.uniform1f(uScale, pw / cw);
    if (reducedMotion) draw();
  });

  const pointer = trackPointer(canvas);
  // Clicking or tapping empty space (not a window, icon, menu or the taskbar) drops in a new blob.
  const onPointerDown = (event: PointerEvent) => {
    if (reducedMotion || !isEmptySpace(event.target)) return;
    const rect = canvas.getBoundingClientRect();
    if (blobs.length >= MAX_BLOBS - 1) blobs.splice(7, 1); // drop the oldest added blob
    blobs.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: 50 + Math.random() * 35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    });
  };
  window.addEventListener('pointerdown', onPointerDown);

  const stopLoop = runLoop((elapsed, dt) => {
    // Follow the mouse; after a few idle seconds (or on touch screens) wander on a slow figure-eight.
    const idle = !pointer.state.pos || performance.now() - pointer.state.lastMove > 4000;
    const goal = idle
      ? {
          x: cssW / 2 + Math.sin(elapsed / 2300) * cssW * 0.33 + Math.sin(elapsed / 900) * 50,
          y: cssH / 2 + Math.sin(elapsed / 1700 + 1) * cssH * 0.28,
        }
      : pointer.state.pos!;
    follower.x += (goal.x - follower.x) * 0.06;
    follower.y += (goal.y - follower.y) * 0.06;
    for (const b of blobs) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if ((b.x < 0 && b.vx < 0) || (b.x > cssW && b.vx > 0)) b.vx *= -1;
      if ((b.y < 0 && b.vy < 0) || (b.y > cssH && b.vy > 0)) b.vy *= -1;
    }
    draw();
  }, reducedMotion);
  canvas.classList.add('is-ready');

  return () => {
    stopLoop();
    stopSize();
    pointer.stop();
    window.removeEventListener('pointerdown', onPointerDown);
    releaseWebGL(gl);
  };
};
