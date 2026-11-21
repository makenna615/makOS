/** Shared plumbing for the animated wallpapers: an animation loop, canvas sizing and WebGL setup. */

export interface WallpaperOptions {
  /** Draw one still frame and never animate. */
  reducedMotion: boolean;
}

/** Starts a wallpaper on a canvas. Resolves to a cleanup function, or null if it can't run here (no WebGL…). */
export type Wallpaper = (canvas: HTMLCanvasElement, options: WallpaperOptions) => Promise<(() => void) | null>;

// Paused while the wallpaper can't be seen (a maximized window covers it). Set by the Wallpaper component.
let wallpaperPaused = false;
const pauseListeners = new Set<() => void>();
export function setWallpaperPaused(paused: boolean) {
  if (paused === wallpaperPaused) return;
  wallpaperPaused = paused;
  pauseListeners.forEach((listener) => listener());
}

/**
 * Calls draw(elapsedMs, deltaMs) every frame. Nothing renders (or drains battery) while the tab is
 * hidden or the wallpaper is covered, and the clock doesn't advance then. With reduced motion it draws
 * once. maxFps throttles slow-moving scenes to save battery.
 */
export function runLoop(draw: (elapsed: number, dt: number) => void, reducedMotion: boolean, maxFps = 60): () => void {
  if (reducedMotion) {
    draw(0, 16);
    return () => {};
  }
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  const minGap = 1000 / maxFps - 2;
  const frame = (now: number) => {
    if (last && now - last < minGap) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = last ? Math.min(50, now - last) : 16;
    last = now;
    elapsed += dt;
    draw(elapsed, dt);
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (!document.hidden && !wallpaperPaused) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('visibilitychange', sync);
  pauseListeners.add(sync);
  sync();
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', sync);
    pauseListeners.delete(sync);
  };
}

/**
 * Keeps the canvas's pixel size matched to its on-screen size (times a capped pixel ratio)
 * and calls onResize after each change. Returns a cleanup function.
 */
export function trackSize(
  canvas: HTMLCanvasElement,
  { maxRatio, maxWidth }: { maxRatio: number; maxWidth: number },
  onResize: (width: number, height: number, cssWidth: number, cssHeight: number) => void,
): () => void {
  const apply = () => {
    const cssWidth = Math.max(1, canvas.clientWidth);
    const cssHeight = Math.max(1, canvas.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio, maxWidth / cssWidth);
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    onResize(width, height, cssWidth, cssHeight);
  };
  apply();
  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }
  const observer = new ResizeObserver(apply);
  observer.observe(canvas);
  return () => observer.disconnect();
}

/** The pointer position relative to the canvas, in CSS pixels, or null when it isn't over the page. */
export function trackPointer(canvas: HTMLCanvasElement) {
  const state: { pos: { x: number; y: number } | null; lastMove: number } = { pos: null, lastMove: 0 };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return; // touch would just jump around
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    state.pos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    state.lastMove = performance.now();
  };
  const onLeave = () => {
    state.pos = null;
  };
  window.addEventListener('pointermove', onMove);
  document.documentElement.addEventListener('pointerleave', onLeave);
  return {
    state,
    stop: () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    },
  };
}

// ---- WebGL ----

const VERTEX = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

export function getWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  try {
    return canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  } catch {
    return null;
  }
}

/** Compiles a full-screen fragment shader. Throws with the compiler log on failure. */
export function createProgram(gl: WebGLRenderingContext, fragment: string): WebGLProgram {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Could not create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader error');
    return shader;
  };
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create program');
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Link error');
  return program;
}

/** One triangle that covers the whole screen, bound to the program's `p` attribute. */
export function bindFullScreenTriangle(gl: WebGLRenderingContext, program: WebGLProgram) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
}

export function createTexture(gl: WebGLRenderingContext, unit: number, source: TexImageSource | null, size?: [number, number]) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  else if (size) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size[0], size[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/** Frees the GPU context right away instead of waiting for garbage collection (browsers cap live contexts). */
export function releaseWebGL(gl: WebGLRenderingContext) {
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

/** Small value-noise library for shaders. */
export const GLSL_NOISE = `
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
const mat2 OCTAVE = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = OCTAVE * p; a *= 0.5; } return v; }
float fbm3(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p = OCTAVE * p; a *= 0.5; } return v; }
`;

/**
 * True when a pointer went down on empty desktop / home-screen space rather than on something
 * interactive or on top of the wallpaper (a window, icon, menu, card or the taskbar).
 */
export function isEmptySpace(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !target.closest(
    'button, a, input, textarea, select, label, [role="dialog"], [role="menu"], .taskbar, .theme-switch, .mobile-intro, .mobile-status, .mobile-sheet',
  );
}
