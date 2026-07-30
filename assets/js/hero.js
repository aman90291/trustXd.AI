/* ============================================================
   TrustXD ExamOS — hero particle field
   A single point-cloud morphing across four states:
     0 Identity    — facial mesh
     1 Attestation — sealed silicon die
     2 Paper       — JIT answer grid
     3 Scale       — national delivery shell
   WebGL1 (max compatibility) with a canvas-2D fallback.
   ============================================================ */
(() => {
  'use strict';

  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = window.innerWidth < 800 ? 9000 : (REDUCED ? 13000 : 17000);
  // Under reduced motion the field is drawn once per state and then left alone,
  // so density costs nothing per frame.
  let needsRedraw = true;

  const INK = [0.043, 0.047, 0.055];
  const ACC = [0.145, 0.251, 1.0];

  /* ---------- shape generators ------------------------------------------- */
  const TAU = Math.PI * 2;
  const GA = Math.PI * (1 + Math.sqrt(5));

  // Deterministic PRNG so every load is identical.
  let seed = 20260730;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

  function fibSphere(i, n) {
    const t = (i + 0.5) / n;
    const phi = Math.acos(1 - 2 * t);
    const th = GA * i;
    return [Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)];
  }

  /* 0 — Facial mesh. Sampled as a *front surface* rather than a full sphere:
        a depth field over the face oval, sculpted with brow, orbital sockets,
        nose ridge, lips and jaw, plus a shallow rim shell for volume. Some
        points are laid on horizontal contour rows so the cloud reads as a
        capture mesh rather than as fog. */
  const G = (v, s) => Math.exp(-(v / s) * (v / s));

  function shapeFace(n) {
    const a = new Float32Array(n * 3);
    const RX = 0.76, RY = 1.02, RZ = 0.42, ROWS = 40;

    // head silhouette: rounded crown, cheekbone width, tapered jaw
    const taperOf = uy => uy < 0
      ? 1 - 0.56 * Math.pow(-uy, 1.55)
      : (uy > 0.55 ? 1 - 0.42 * Math.pow((uy - 0.55) / 0.45, 2) : 1);

    // sculpted depth field over the face plane
    const relief = (x, y) => (
        0.30 * G(x, 0.10) * G(y + 0.02, 0.24)                            // nose ridge
      + 0.09 * G(Math.abs(x) - 0.105, 0.045) * G(y + 0.21, 0.055)        // nostril flare
      - 0.14 * (G(x - 0.275, 0.135) + G(x + 0.275, 0.135)) * G(y - 0.215, 0.10) // orbits
      + 0.08 * G(x, 0.40) * G(y - 0.365, 0.05)                           // brow ridge
      + 0.08 * G(x, 0.20) * G(y + 0.365, 0.048)                          // lips
      + 0.06 * G(x, 0.17) * G(y + 0.63, 0.10)                            // chin
      - 0.07 * G(Math.abs(x) - 0.36, 0.12) * G(y + 0.04, 0.20)           // cheek hollow
    );

    for (let i = 0; i < n; i++) {
      const kind = rnd();

      /* rim shell — wraps the silhouette back so the head has volume */
      if (kind < 0.13) {
        const t = rnd() * TAU;
        const ux = Math.cos(t), uy = Math.sin(t);
        const depth = rnd();
        const shrink = Math.sqrt(Math.max(0, 1 - depth * depth * 0.82));
        a[i * 3]     = ux * RX * taperOf(uy) * shrink;
        a[i * 3 + 1] = uy * RY * shrink + 0.02;
        a[i * 3 + 2] = -depth * 0.40;
        continue;
      }

      /* landmark clusters — the points a capture mesh actually anchors on */
      if (kind < 0.185) {
        const w = rnd();
        let lx, ly;
        if (w < 0.5) {                                   // irises
          const side = rnd() < 0.5 ? -1 : 1;
          const t = rnd() * TAU, r = Math.sqrt(rnd()) * 0.055;
          lx = side * 0.275 + Math.cos(t) * r;
          ly = 0.215 + Math.sin(t) * r * 0.78;
        } else if (w < 0.82) {                           // mouth line
          const t = rnd() * 2 - 1;
          lx = t * 0.20;
          ly = -0.365 + Math.abs(t) * 0.045 + (rnd() - 0.5) * 0.018;
        } else {                                         // nose tip + nostrils
          const t = rnd() * TAU, r = Math.sqrt(rnd()) * 0.075;
          lx = Math.cos(t) * r;
          ly = -0.12 + Math.sin(t) * r * 1.1;
        }
        const q = (lx / (RX * taperOf(ly / RY))) ** 2 + (ly / RY) ** 2;
        a[i * 3] = lx;
        a[i * 3 + 1] = ly + 0.02;
        a[i * 3 + 2] = Math.sqrt(Math.max(0, 1 - Math.min(1, q))) * RZ + relief(lx, ly) + 0.012;
        continue;
      }

      /* face surface */
      let ux = 0, uy = 0, q = 2, tries = 0;
      while (q > 1 && tries < 10) {
        if (kind < 0.62) {                       // contour rows — capture-mesh read
          uy = (Math.floor(rnd() * ROWS) / (ROWS - 1)) * 2 - 1;
          ux = rnd() * 2 - 1;
        } else {                                 // scatter fill
          uy = rnd() * 2 - 1;
          ux = rnd() * 2 - 1;
        }
        q = ux * ux + uy * uy;
        tries++;
      }
      if (q > 1) { const s = 1 / Math.sqrt(q); ux *= s; uy *= s; q = 1; }

      const x = ux * RX * taperOf(uy);
      const y = uy * RY;
      a[i * 3] = x;
      a[i * 3 + 1] = y + 0.02;
      a[i * 3 + 2] = Math.sqrt(Math.max(0, 1 - q)) * RZ + relief(x, y);
    }
    return a;
  }

  /* 1 — Sealed silicon die: plate + bond pads + radial traces. */
  function shapeChip(n) {
    const a = new Float32Array(n * 3);
    const S = 0.86, T = 0.055;
    for (let i = 0; i < n; i++) {
      const r = rnd();
      let x, y, z;
      if (r < 0.44) {                       // plate face (rounded square)
        x = (rnd() * 2 - 1) * S; y = (rnd() * 2 - 1) * S;
        const c = Math.max(Math.abs(x), Math.abs(y)) - S * 0.80;
        if (c > 0 && (Math.abs(x) - S * 0.80) > 0 && (Math.abs(y) - S * 0.80) > 0) {
          const d = Math.hypot(Math.abs(x) - S * 0.80, Math.abs(y) - S * 0.80);
          if (d > S * 0.20) { x *= 0.86; y *= 0.86; }
        }
        z = (rnd() < 0.5 ? 1 : -1) * T;
      } else if (r < 0.66) {                // die core (inner square, raised)
        const s2 = S * 0.42;
        x = (rnd() * 2 - 1) * s2; y = (rnd() * 2 - 1) * s2;
        z = T + 0.045 + rnd() * 0.02;
      } else if (r < 0.86) {                // radial traces
        const arm = Math.floor(rnd() * 4);
        const t = 0.30 + rnd() * 0.66;
        const off = (Math.floor(rnd() * 5) - 2) * 0.115;
        if (arm === 0) { x = off; y = t * S; }
        else if (arm === 1) { x = off; y = -t * S; }
        else if (arm === 2) { x = t * S; y = off; }
        else { x = -t * S; y = off; }
        z = T + 0.004;
      } else {                              // edge pins
        const side = Math.floor(rnd() * 4);
        const k = (Math.floor(rnd() * 9) - 4) * 0.19;
        const out = S + 0.06 + rnd() * 0.14;
        if (side === 0) { x = k; y = out; }
        else if (side === 1) { x = k; y = -out; }
        else if (side === 2) { x = out; y = k; }
        else { x = -out; y = k; }
        z = (rnd() * 2 - 1) * T * 0.6;
      }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }

  /* 2 — JIT answer grid: rows of option bubbles on a gently curved sheet. */
  function shapeSheet(n) {
    const a = new Float32Array(n * 3);
    const COLS = 4, ROWS = 11, W = 1.55, H = 1.65;
    for (let i = 0; i < n; i++) {
      const r = rnd();
      let x, y;
      if (r < 0.82) {
        const c = Math.floor(rnd() * COLS), ro = Math.floor(rnd() * ROWS);
        const cx = -W / 2 + (c + 0.5) * (W / COLS) + 0.09;
        const cy = H / 2 - (ro + 0.5) * (H / ROWS);
        const ang = rnd() * TAU;
        const rad = 0.052 * (rnd() < 0.30 ? rnd() * 0.9 : 1);   // ring, some filled
        x = cx + Math.cos(ang) * rad;
        y = cy + Math.sin(ang) * rad * 1.0;
      } else if (r < 0.92) {                                     // row rules
        const ro = Math.floor(rnd() * ROWS);
        x = -W / 2 - 0.16 + rnd() * 0.14;
        y = H / 2 - (ro + 0.5) * (H / ROWS) + (rnd() - 0.5) * 0.03;
      } else {                                                   // sheet border
        const e = Math.floor(rnd() * 4), t = rnd();
        const bw = W / 2 + 0.24, bh = H / 2 + 0.14;
        if (e === 0) { x = -bw + t * bw * 2; y = bh; }
        else if (e === 1) { x = -bw + t * bw * 2; y = -bh; }
        else if (e === 2) { x = -bw; y = -bh + t * bh * 2; }
        else { x = bw; y = -bh + t * bh * 2; }
      }
      const z = Math.sin(x * 1.5) * 0.055 + Math.cos(y * 1.2) * 0.035;
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }

  /* 3 — Delivery shell: sphere with latitude bands + orbital session arcs. */
  function shapeGlobe(n) {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = rnd();
      if (r < 0.72) {
        const [x, y, z] = fibSphere(i, n);
        const band = 0.86 + 0.14 * Math.abs(Math.sin(Math.acos(y) * 9));
        a[i * 3] = x * 1.02 * band; a[i * 3 + 1] = y * 1.02 * band; a[i * 3 + 2] = z * 1.02 * band;
      } else if (r < 0.90) {                 // orbital rings
        const ring = Math.floor(rnd() * 3);
        const t = rnd() * TAU, rr = 1.22 + ring * 0.10;
        const tilt = (ring - 1) * 0.55;
        const x = Math.cos(t) * rr, z0 = Math.sin(t) * rr;
        a[i * 3] = x;
        a[i * 3 + 1] = z0 * Math.sin(tilt) + (rnd() - 0.5) * 0.012;
        a[i * 3 + 2] = z0 * Math.cos(tilt);
      } else {                               // uplink motes
        const [x, y, z] = fibSphere(Math.floor(rnd() * n), n);
        const k = 1.05 + rnd() * 0.5;
        a[i * 3] = x * k; a[i * 3 + 1] = y * k; a[i * 3 + 2] = z * k;
      }
    }
    return a;
  }

  const SHAPES = [shapeFace(N), shapeChip(N), shapeSheet(N), shapeGlobe(N)];
  const RAND = new Float32Array(N);
  for (let i = 0; i < N; i++) RAND[i] = rnd();

  /* ---------- state ------------------------------------------------------- */
  let from = 0, to = 0, prog = 1;
  let userTouched = false;
  const buttons = Array.from(document.querySelectorAll('.morph-btn'));

  function setShape(i, byUser) {
    if (i === to) return;
    from = to; to = i; prog = REDUCED ? 1 : 0;
    needsRedraw = true;
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    if (byUser) userTouched = true;
  }
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => setShape(i, true));
    b.setAttribute('aria-pressed', String(i === 0));
  });

  let autoAt = performance.now() + 7000;
  function autoAdvance(now) {
    if (userTouched || now < autoAt) return;
    setShape((to + 1) % 4, false);
    autoAt = now + 7000;
  }

  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (!REDUCED) {
    window.addEventListener('mousemove', e => {
      tmx = (e.clientX / window.innerWidth) * 2 - 1;
      tmy = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- WebGL path -------------------------------------------------- */
  const VS = `
    precision highp float;
    attribute vec3 p0; attribute vec3 p1; attribute vec3 p2; attribute vec3 p3;
    attribute float aRand;
    uniform vec4 uW;
    uniform float uTime, uTurb, uAspect, uDpr, uScale;
    uniform vec2 uMouse;
    varying float vDepth; varying float vY; varying float vRand;
    void main() {
      vec3 p = p0 * uW.x + p1 * uW.y + p2 * uW.z + p3 * uW.w;
      float t = uTime * 0.55 + aRand * 6.2831;
      vec3 n = vec3(sin(t + p.y * 3.1), cos(t * 1.13 + p.z * 2.7), sin(t * 0.87 + p.x * 3.4));
      p += n * (uTurb * (0.22 + 0.78 * aRand) + 0.008);
      float ay = sin(uTime * 0.21) * 0.46 + uMouse.x * 0.55;
      float ax = sin(uTime * 0.16) * 0.09 + uMouse.y * 0.26;
      mat3 ry = mat3(cos(ay), 0.0, -sin(ay), 0.0, 1.0, 0.0, sin(ay), 0.0, cos(ay));
      mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(ax), sin(ax), 0.0, -sin(ax), cos(ax));
      p = rx * ry * p;
      vDepth = p.z; vY = p.y; vRand = aRand;
      float persp = 1.0 / (3.05 - p.z * 0.55);
      vec2 s = p.xy * persp * 1.95 * uScale;
      s.x /= uAspect;
      gl_Position = vec4(s, 0.0, 1.0);
      gl_PointSize = (1.15 + 3.1 * persp) * uDpr * (0.55 + 0.9 * aRand);
    }`;

  const FS = `
    precision mediump float;
    uniform vec3 uInk, uAcc;
    uniform float uScan;
    varying float vDepth; varying float vY; varying float vRand;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = dot(c, c);
      if (d > 0.25) discard;
      float a = smoothstep(0.25, 0.045, d);
      float dep = clamp(vDepth * 0.55 + 0.5, 0.0, 1.0);
      float band = exp(-pow((vY - uScan) * 3.2, 2.0));
      vec3 col = mix(uInk, uAcc, smoothstep(0.74, 0.97, dep) * 0.95);
      col = mix(col, uAcc, band * 0.95);
      a *= (0.20 + 0.80 * dep * dep) + band * 0.32;
      gl_FragColor = vec4(col, min(a, 1.0));
    }`;

  function initGL() {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true })
            || canvas.getContext('experimental-webgl', { alpha: true, antialias: true });
    if (!gl) return false;

    function sh(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    const prog2 = gl.createProgram();
    gl.attachShader(prog2, vs); gl.attachShader(prog2, fs); gl.linkProgram(prog2);
    if (!gl.getProgramParameter(prog2, gl.LINK_STATUS)) return false;
    gl.useProgram(prog2);

    ['p0', 'p1', 'p2', 'p3'].forEach((name, i) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, SHAPES[i], gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog2, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    });
    const rbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rbuf);
    gl.bufferData(gl.ARRAY_BUFFER, RAND, gl.STATIC_DRAW);
    const rloc = gl.getAttribLocation(prog2, 'aRand');
    gl.enableVertexAttribArray(rloc);
    gl.vertexAttribPointer(rloc, 1, gl.FLOAT, false, 0, 0);

    const U = n => gl.getUniformLocation(prog2, n);
    const uW = U('uW'), uTime = U('uTime'), uTurb = U('uTurb'), uAspect = U('uAspect'),
          uDpr = U('uDpr'), uMouse = U('uMouse'), uScan = U('uScan'), uScale = U('uScale');
    gl.uniform3fv(U('uInk'), INK);
    gl.uniform3fv(U('uAcc'), ACC);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    let dpr = 1, W = 0, H = 0;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform1f(uAspect, r.width / Math.max(1, r.height));
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uScale, r.width < 620 ? 0.72 : 1.0);
      needsRedraw = true;
    }
    resize();
    window.addEventListener('resize', resize);

    const w = [0, 0, 0, 0];
    let t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) { t0 = now; return; }
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      autoAdvance(now);
      if (REDUCED && !needsRedraw) return;   // static field: draw once per state
      needsRedraw = false;

      if (prog < 1) prog = Math.min(1, prog + dt / 1.45);
      const e = easeInOut(prog);
      w.fill(0);
      w[from] += 1 - e;
      w[to] += e;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      const time = now / 1000;
      gl.uniform4fv(uW, w);
      gl.uniform1f(uTime, REDUCED ? 0 : time);
      gl.uniform1f(uTurb, Math.sin(e * Math.PI) * 0.42);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uScan, ((time * 0.16) % 1) * 3.0 - 1.5);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, N);
    }
    requestAnimationFrame(frame);
    canvas.classList.add('is-ready');
    return true;
  }

  /* ---------- 2D fallback -------------------------------------------------- */
  function init2D() {
    let cv = canvas;
    let ctx = cv.getContext('2d');
    if (!ctx && cv.parentNode) {           // a GL context was already bound — swap in a clean node
      const fresh = cv.cloneNode(false);
      cv.parentNode.replaceChild(fresh, cv);
      cv = fresh;
      ctx = cv.getContext('2d');
    }
    if (!ctx) return;
    const M = Math.min(N, 3200);
    let dpr = 1, w = 0, h = 0;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsRedraw = true;
    }
    resize();
    window.addEventListener('resize', resize);

    let t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) { t0 = now; return; }
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      autoAdvance(now);
      if (REDUCED && !needsRedraw) return;
      needsRedraw = false;
      if (prog < 1) prog = Math.min(1, prog + dt / 1.45);
      const e = easeInOut(prog);
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;

      const ang = (REDUCED ? 0 : Math.sin(now / 1000 * 0.21) * 0.46) + mx * 0.55;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const scale = Math.min(w, h) * (w < 620 ? 0.30 : 0.42);
      const cx = w / 2, cy = h / 2;
      const A = SHAPES[from], B = SHAPES[to];

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < M; i++) {
        const j = ((i * 5) % N) * 3;
        let x = A[j] * (1 - e) + B[j] * e;
        let y = A[j + 1] * (1 - e) + B[j + 1] * e;
        let z = A[j + 2] * (1 - e) + B[j + 2] * e;
        const xr = x * ca - z * sa, zr = x * sa + z * ca;
        const persp = 1 / (3.05 - zr * 0.55);
        const px = cx + xr * persp * 1.95 * scale;
        const py = cy - y * persp * 1.95 * scale;
        const dep = Math.max(0, Math.min(1, zr * 0.55 + 0.5));
        ctx.globalAlpha = 0.2 + 0.8 * dep * dep;
        ctx.fillStyle = dep > 0.80 ? '#2540FF' : '#0B0C0E';
        const s = (1.0 + 2.0 * persp);
        ctx.fillRect(px, py, s, s);
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
    cv.classList.add('is-ready');
  }

  try {
    if (!initGL()) init2D();
  } catch (err) {
    console.warn('hero: GL unavailable, using 2D', err);
    try { init2D(); } catch (e2) { canvas.style.display = 'none'; }
  }
})();
