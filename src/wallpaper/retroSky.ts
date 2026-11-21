import {
  GLSL_NOISE,
  bindFullScreenTriangle,
  createProgram,
  createTexture,
  getWebGL,
  releaseWebGL,
  runLoop,
  trackSize,
  type Wallpaper,
} from './runtime';

/**
 * Retro: the real wallpaper photo, softly blurred, with its own clouds slowly drifting across the sky.
 *
 * Once per page load the photo is analysed: where the land meets the sky in each column, and the
 * clear-sky color of each row. Each frame then (1) lifts the photo's clouds off the sky, slides
 * them sideways (looping with a cross-fade so there's no seam) and lets cloud shadows drift over the
 * hills, and (2) blurs the result.
 */

const PHOTO_URL = '/wallpaper.jpg';
/** How far the clouds drift per second, as a fraction of the photo's width (~4 minutes to cross). */
const DRIFT_SPEED = 0.0035;
/** Width the photo is analysed at. */
const ANALYSIS_WIDTH = 840;

interface SkyAnalysis {
  photo: HTMLImageElement;
  /** R: 1 where there is land. G: the horizon height of that column (0–1). */
  mask: HTMLCanvasElement;
  /** 1px-wide strip: the clear-sky color of each row. */
  sky: HTMLCanvasElement;
  aspect: number;
}

let analysis: Promise<SkyAnalysis> | null = null;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/** Lets the browser handle input between analysis steps, so a slow phone doesn't freeze. */
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function analyse(photo: HTMLImageElement): Promise<SkyAnalysis> {
  // Work on a reduced copy: the masks are blurred anyway, and this is ~4x less work on slow phones.
  const scale = Math.min(1, ANALYSIS_WIDTH / photo.naturalWidth);
  const W = Math.round(photo.naturalWidth * scale);
  const H = Math.round(photo.naturalHeight * scale);
  const RUN = Math.max(3, Math.round(6 * scale)); // sky pixels in a row that count as the horizon
  const SMOOTH = Math.max(4, Math.round(12 * scale)); // rows averaged for the clear-sky color
  const work = document.createElement('canvas');
  work.width = W;
  work.height = H;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D canvas');
  ctx.drawImage(photo, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const at = (x: number, y: number) => (y * W + x) * 4;
  const isBlue = (i: number) => d[i + 2]! > d[i + 1]! + 22 && d[i + 2]! > d[i]! + 55 && d[i + 2]! > 130;
  // Near the horizon, the distant blue mountains have very little red; the hazy sky there has plenty.
  const isMountain = (i: number, y: number) => y > H * 0.56 && d[i]! < 70;
  const isSky = (x: number, y: number) => {
    const i = at(x, y);
    if (isMountain(i, y)) return false;
    const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return isBlue(i) || (min > 175 && max - min < 60 && b >= g - 5); // blue sky or white cloud
  };

  await yieldToBrowser();
  // Horizon of each column: scanning up from the bottom, the first run of RUN sky pixels.
  const raw = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    let y = H - 1;
    while (y > 6) {
      let run = true;
      for (let k = 0; k < RUN; k++) {
        if (!isSky(x, y - k)) {
          run = false;
          break;
        }
      }
      if (run) break;
      y--;
    }
    raw[x] = y + 1;
  }
  const horizon = new Float32Array(W); // median of 7 neighbours smooths out single-column noise
  for (let x = 0; x < W; x++) {
    const near: number[] = [];
    for (let j = -3; j <= 3; j++) near.push(raw[Math.max(0, Math.min(W - 1, x + j))]!);
    near.sort((a, b) => a - b);
    horizon[x] = near[3]!;
  }

  await yieldToBrowser();
  const maskData = ctx.createImageData(W, H);
  const m = maskData.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = at(x, y);
      const h = horizon[x]!;
      // Bits of cloud just below the horizon line count as sky too, so they drift with the rest.
      const land = y >= h && !(y < h + 45 * scale && isSky(x, y)) ? 255 : 0;
      m[o] = land;
      m[o + 1] = (h / H) * 255;
      m[o + 2] = 0;
      m[o + 3] = 255;
    }
  }
  const sharpMask = document.createElement('canvas');
  sharpMask.width = W;
  sharpMask.height = H;
  sharpMask.getContext('2d')!.putImageData(maskData, 0, 0);
  const mask = document.createElement('canvas');
  mask.width = W;
  mask.height = H;
  const maskCtx = mask.getContext('2d')!;
  maskCtx.filter = `blur(${(1.2 * scale).toFixed(2)}px)`; // soft edge; browsers without canvas filters just get a sharp one
  maskCtx.drawImage(sharpMask, 0, 0);

  await yieldToBrowser();
  // Clear-sky color per row: the darkest quarter of that row's blue pixels (sky with nothing in front).
  const rows: ([number, number, number] | null)[] = [];
  for (let y = 0; y < H; y++) {
    const blues: [number, number, number][] = [];
    for (let x = 0; x < W; x++) {
      if (y >= horizon[x]!) continue;
      const i = at(x, y);
      if (isBlue(i) && !isMountain(i, y)) blues.push([d[i]!, d[i + 1]!, d[i + 2]!]);
    }
    if (blues.length < 12) {
      rows.push(null);
      continue;
    }
    blues.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    const n = Math.max(4, Math.floor(blues.length * 0.25));
    const sum = [0, 0, 0];
    for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) sum[c]! += blues[k]![c]!;
    rows.push([sum[0]! / n, sum[1]! / n, sum[2]! / n]);
  }
  for (let y = 0; y < H; y++) {
    if (rows[y]) continue;
    let up = y;
    while (up > 0 && !rows[up]) up--;
    rows[y] = rows[up] ?? [40, 110, 230];
  }
  const sky = document.createElement('canvas');
  sky.width = 1;
  sky.height = H;
  const skyCtx = sky.getContext('2d')!;
  const strip = skyCtx.createImageData(1, H);
  for (let y = 0; y < H; y++) {
    const acc = [0, 0, 0];
    for (let w = -SMOOTH; w <= SMOOTH; w++) {
      const row = rows[Math.max(0, Math.min(H - 1, y + w))]!;
      for (let c = 0; c < 3; c++) acc[c]! += row[c]!;
    }
    for (let c = 0; c < 3; c++) strip.data[y * 4 + c] = acc[c]! / (SMOOTH * 2 + 1);
    strip.data[y * 4 + 3] = 255;
  }
  skyCtx.putImageData(strip, 0, 0);

  return { photo, mask, sky, aspect: W / H };
}

function getAnalysis() {
  analysis ??= loadImage(PHOTO_URL).then(analyse);
  analysis.catch(() => {
    analysis = null; // allow a retry next time
  });
  return analysis;
}

const SCENE_SHADER = `
precision highp float;
uniform vec2 uRes;
uniform float uT, uAspect, uFocusX;
uniform sampler2D uPhoto, uMask, uSky;
${GLSL_NOISE}
vec3 P(vec2 u) { return texture2D(uPhoto, vec2(u.x, 1.0 - u.y)).rgb; }
vec2 Mk(vec2 u) { return texture2D(uMask, vec2(u.x, 1.0 - u.y)).rg; }
vec3 K(float y) { return texture2D(uSky, vec2(0.5, 1.0 - y)).rgb; }
// How much of a photo pixel is cloud: its brightness above the clear sky of its row,
// faded out near where the hill cut the cloud off (so no flat-bottomed clouds drift into view).
vec4 cloudAt(vec2 u) {
  vec3 p = P(u), k = K(u.y);
  vec2 m = Mk(u);
  float a = clamp(dot(p - k, vec3(1.0)) / max(dot(vec3(1.0) - k, vec3(1.0)), 0.05) * 1.15, 0.0, 1.0);
  a *= (1.0 - m.r) * smoothstep(0.0, 0.035, m.g - u.y);
  return vec4(p, a);
}
void main() {
  vec2 s = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  // Cover-fit the photo, keeping uFocusX in view when the screen is narrower than the photo.
  float A = uRes.x / uRes.y;
  vec2 puv;
  if (A < uAspect) { float f = A / uAspect; puv = vec2((1.0 - f) * uFocusX + s.x * f, s.y); }
  else { float f = uAspect / A; puv = vec2(s.x, (1.0 - f) * 0.5 + s.y * f); }
  vec3 photo = P(puv);
  float land = Mk(puv).r;
  float t = uT;

  // Drift: slide the photo's real clouds sideways and loop them with a soft cross-fade.
  float period = 0.80, overlap = 0.20;
  vec2 warp = (vec2(fbm3(puv * 3.0 + vec2(t * 0.015, 0.0)), fbm3(puv * 3.0 + vec2(7.1, t * 0.012))) - 0.5) * 0.008;
  float x = mod(puv.x - t * ${DRIFT_SPEED}, period);
  vec4 c = cloudAt(vec2(x, puv.y) + warp);
  if (x < overlap) c = mix(cloudAt(vec2(x + period, puv.y) + warp), c, smoothstep(0.0, 1.0, x / overlap));
  vec3 skyColor = mix(K(puv.y), c.rgb, c.a);

  // Faint cloud shadows drifting over the hills, and a light breeze in the near grass.
  vec2 lp = vec2((puv.x - t * ${DRIFT_SPEED}) * 2.4, puv.y * 5.0);
  float shade = smoothstep(0.55, 0.75, fbm(lp)) * 0.22;
  float wind = sin(puv.x * 9.0 + puv.y * 26.0 - t * 1.1 + fbm3(puv * 5.0 + t * 0.05) * 5.0);
  vec3 ground = photo * (1.0 - shade) * (1.0 + wind * 0.04 * smoothstep(0.62, 0.95, puv.y));

  gl_FragColor = vec4(mix(skyColor, ground, land), 1.0);
}`;

const BLUR_SHADER = `
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uScale;
vec3 disc(vec2 uv, float radius) {
  vec3 sum = texture2D(uSrc, uv).rgb;
  for (int k = 0; k < 24; k++) {
    float f = float(k);
    float r = sqrt((f + 0.5) / 24.0) * radius * uScale;
    sum += texture2D(uSrc, uv + vec2(cos(f * 2.39996), sin(f * 2.39996)) * r / uRes).rgb;
  }
  return sum / 25.0;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 soft = mix(disc(uv, 3.5), disc(uv, 7.5), 0.5);
  gl_FragColor = vec4(mix(texture2D(uSrc, uv).rgb, soft, 0.92), 1.0);
}`;

export const retroSky: Wallpaper = async (canvas, { reducedMotion }) => {
  const gl = getWebGL(canvas);
  if (!gl) return null;
  let data: SkyAnalysis;
  try {
    data = await getAnalysis();
  } catch {
    releaseWebGL(gl);
    return null;
  }
  if (!canvas.isConnected || gl.isContextLost()) return null;

  let scene: WebGLProgram, blur: WebGLProgram;
  try {
    scene = createProgram(gl, SCENE_SHADER);
    blur = createProgram(gl, BLUR_SHADER);
  } catch {
    releaseWebGL(gl);
    return null;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  createTexture(gl, 0, data.photo);
  createTexture(gl, 1, data.mask);
  createTexture(gl, 2, data.sky);
  gl.useProgram(scene);
  bindFullScreenTriangle(gl, scene);
  gl.uniform1i(gl.getUniformLocation(scene, 'uPhoto'), 0);
  gl.uniform1i(gl.getUniformLocation(scene, 'uMask'), 1);
  gl.uniform1i(gl.getUniformLocation(scene, 'uSky'), 2);
  gl.uniform1f(gl.getUniformLocation(scene, 'uAspect'), data.aspect);
  const sceneRes = gl.getUniformLocation(scene, 'uRes');
  const sceneFocus = gl.getUniformLocation(scene, 'uFocusX');
  const sceneTime = gl.getUniformLocation(scene, 'uT');

  gl.useProgram(blur);
  bindFullScreenTriangle(gl, blur);
  gl.uniform1i(gl.getUniformLocation(blur, 'uSrc'), 3);
  const blurRes = gl.getUniformLocation(blur, 'uRes');
  const blurScale = gl.getUniformLocation(blur, 'uScale');

  // The scene renders into a texture, which the blur pass then draws to the screen.
  const target = createTexture(gl, 3, null, [canvas.width, canvas.height]);
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);

  let size = [canvas.width, canvas.height] as [number, number];
  let time = 0;
  const draw = () => {
    if (gl.isContextLost()) return;
    gl.viewport(0, 0, size[0], size[1]);
    gl.useProgram(scene);
    gl.uniform1f(sceneTime, time);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(blur);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // It's blurred, so it doesn't need full resolution: render at most 800px wide and let CSS scale it up.
  const stopSize = trackSize(canvas, { maxRatio: 1, maxWidth: 800 }, (w, h) => {
    size = [w, h];
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.useProgram(scene);
    gl.uniform2f(sceneRes, w, h);
    gl.uniform1f(sceneFocus, w / h < 1 ? 0.75 : 0.5); // portrait phones: keep the big hill in view
    gl.useProgram(blur);
    gl.uniform2f(blurRes, w, h);
    gl.uniform1f(blurScale, w / 1280);
    if (reducedMotion) draw();
  });

  const stopLoop = runLoop((elapsed) => {
    time = elapsed / 1000;
    draw();
  }, reducedMotion, 30); // the clouds move slowly; 30fps looks the same and halves the GPU work
  canvas.classList.add('is-ready');

  return () => {
    stopLoop();
    stopSize();
    releaseWebGL(gl);
  };
};
