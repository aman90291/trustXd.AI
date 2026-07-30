/* ============================================================
   TrustXD ExamOS — live product demonstrations & charts
   Every widget here is a faithful *simulation* of the protocol
   described beside it. No network calls are made.
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const pad = (v, n = 2) => String(v).padStart(n, '0');
  const stamp = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;

  /* ==========================================================
     MODULE B — Cryptographic screen-binding
     Server issues a 3s token → phone reads it → server validates
     arrival inside a 2000 ms window against its own clock.
     ========================================================== */
  (function screenBind() {
    const root = $('[data-bind]');
    if (!root) return;

    const tokenEl = $('[data-bind-token]', root);
    const camEl   = $('[data-bind-cam]', root);
    const ringEl  = $('[data-bind-ring]', root);
    const latEl   = $('[data-bind-lat]', root);
    const latBar  = $('[data-bind-latbar]', root);
    const barFill = latBar ? latBar.querySelector('i') : null;
    const logEl   = $('[data-bind-log]', root);
    const seqEl   = $('[data-bind-seq]', root);
    const stateEl = $('[data-bind-state]', root);
    const decoy   = $('[data-bind-decoy]', root);

    const HEX = '0123456789ABCDEF';
    const mkToken = () => Array.from({ length: 8 }, (_, i) => HEX[(Math.random() * 16) | 0])
      .join('').replace(/^(.{4})/, '$1-');

    let seq = 1180, current = mkToken(), issuedAt = Date.now(), lastRead = null;
    const TTL = 3000, WINDOW = 2000;
    const C = 2 * Math.PI * 17;

    function log(ts, ev, detail, verdict, cls) {
      if (!logEl) return;
      const li = document.createElement('li');
      li.innerHTML =
        `<span class="ts">${ts}</span><span class="ev">${ev}</span>` +
        `<span class="dt">${detail}</span><span class="vr ${cls}">${verdict}</span>`;
      logEl.prepend(li);
      while (logEl.children.length > 7) logEl.lastChild.remove();
    }

    function issue() {
      seq++;
      current = mkToken();
      issuedAt = Date.now();
      if (tokenEl) {
        tokenEl.textContent = current;
        tokenEl.classList.remove('is-new');
        void tokenEl.offsetWidth;
        tokenEl.classList.add('is-new');
      }
      if (seqEl) seqEl.textContent = 'seq ' + seq;
      log(stamp(), 'TOKEN_ISSUE', `seq=${seq} ttl=${TTL}ms`, 'SIGNED', 'ok');

      const isDecoy = decoy && decoy.checked;
      const delay = isDecoy ? 2400 + Math.random() * 900 : 220 + Math.random() * 520;

      if (camEl) camEl.textContent = '· · · ·';
      setTimeout(() => {
        const observed = isDecoy ? lastRead || current : current;
        lastRead = current;
        const dt = Math.round(delay);
        if (camEl) camEl.textContent = observed;
        if (latEl) latEl.textContent = dt + ' ms';
        if (barFill) barFill.style.width = Math.min(100, (dt / (WINDOW * 1.35)) * 100) + '%';
        const ok = dt <= WINDOW && observed === current;
        if (latBar) latBar.classList.toggle('is-late', !ok);
        if (stateEl) {
          stateEl.className = 'verdict ' + (ok ? 'verdict--clear' : 'verdict--crit');
          stateEl.innerHTML = ok
            ? '<svg class="verdict__ico" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.2l2.6 2.6L10 3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Display bound'
            : '<svg class="verdict__ico" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.6l5 8.8H1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 5v2.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Binding lapse';
        }
        log(stamp(), 'TOKEN_OBSERVED',
          `seq=${ok ? seq : seq - 1} Δ${dt}ms`,
          ok ? 'WITHIN_WINDOW' : 'LAPSE_LOGGED',
          ok ? 'ok' : 'bad');
        if (!ok) log(stamp(), 'EVENT_RECORD', 'screen_binding.lapse', 'REVIEW_QUEUE', 'warnl');
      }, delay);
    }

    function tick() {
      if (!ringEl) return;
      const k = Math.min(1, (Date.now() - issuedAt) / TTL);
      ringEl.style.strokeDasharray = C;
      ringEl.style.strokeDashoffset = C * k;
    }

    let running = false;
    const io = new IntersectionObserver(es => {
      const on = es[0].isIntersecting;
      if (on && !running) {
        running = true;
        issue();
        root._iv = setInterval(issue, TTL);
        root._rf = setInterval(tick, 60);
      } else if (!on && running) {
        running = false;
        clearInterval(root._iv); clearInterval(root._rf);
      }
    }, { threshold: 0.15 });
    io.observe(root);

    if (decoy) decoy.addEventListener('change', () => {
      log(stamp(), decoy.checked ? 'SIM_DECOY_ON' : 'SIM_DECOY_OFF',
        'operator simulation', 'ACK', 'warnl');
    });
  })();

  /* ==========================================================
     MODULE A — Dual-angle spatial verification
     One yaw control drives both feeds. Temporal correlation of
     the two head vectors is what a proxy sitter cannot fake.
     ========================================================== */
  (function dualAngle() {
    const rig = $('[data-rig]');
    if (!rig) return;
    const range   = $('[data-rig-range]', rig);
    const front   = $('[data-rig-front]', rig);
    const side    = $('[data-rig-side]', rig);
    const yawOut  = $('[data-rig-yaw]', rig);
    const matchN  = $('[data-rig-match]', rig);
    const meter   = $('[data-rig-meter]', rig);
    const verdict = $('[data-rig-verdict]', rig);
    const proxy   = $('[data-rig-proxy]', rig);
    const offOut  = $('[data-rig-offset]', rig);

    function render() {
      const yaw = parseFloat(range.value);              // -35 … 35
      const isProxy = proxy && proxy.checked;
      // Primary camera: head rotates with yaw.
      front.setAttribute('transform', `rotate(${yaw * 0.55} 90 78) translate(${yaw * 0.28} 0)`);
      // Secondary camera at ~78°: the *same* physical motion, seen in profile.
      const lag = isProxy ? -yaw * 0.62 : yaw * 0.55;
      side.setAttribute('transform', `rotate(${lag * 0.35} 90 78) translate(${lag * 0.5} 0)`);

      const corr = isProxy
        ? 0.28 + Math.random() * 0.06
        : 0.958 + Math.min(0.038, Math.abs(yaw) * 0.0004);
      if (yawOut) yawOut.textContent = (yaw >= 0 ? '+' : '') + yaw.toFixed(0) + '°';
      if (offOut) offOut.textContent = isProxy ? '—' : (78 + Math.round(yaw * 0.2)) + '°';
      if (matchN) matchN.textContent = corr.toFixed(3);
      if (meter) meter.style.width = (corr * 100) + '%';
      rig.classList.toggle('is-proxy', !!isProxy);
      if (verdict) {
        verdict.className = 'verdict ' + (isProxy ? 'verdict--crit' : 'verdict--clear');
        verdict.textContent = isProxy ? 'Temporal mismatch' : 'Single subject';
      }
    }
    range.addEventListener('input', render);
    if (proxy) proxy.addEventListener('change', render);

    // gentle idle sweep until the visitor grabs the control
    let touched = false;
    range.addEventListener('pointerdown', () => { touched = true; });
    if (!REDUCED) {
      let t = 0;
      setInterval(() => {
        if (touched || !rig.getBoundingClientRect().height) return;
        t += 0.045;
        range.value = String(Math.round(Math.sin(t) * 28));
        render();
      }, 60);
    }
    render();
  })();

  /* ==========================================================
     MODULE C — JIT variant generation
     Same item template, re-parameterised per candidate. The IRT
     targets stay pinned; only the surface changes.
     ========================================================== */
  (function jit() {
    const root = $('[data-jit]');
    if (!root) return;
    const qEl = $('[data-jit-q]', root);
    const idEl = $('[data-jit-id]', root);
    const aEl = $('[data-jit-a]', root);
    const bEl = $('[data-jit-b]', root);
    const cEl = $('[data-jit-c]', root);
    const btn = $('[data-jit-new]', root);
    const steps = $$('[data-pipe-step]');

    const NAMES = ['Ananya', 'Ravi', 'Meera', 'Kabir', 'Ishaan', 'Diya', 'Arjun', 'Sana'];
    const CITY  = ['Kochi', 'Indore', 'Jaipur', 'Guwahati', 'Nagpur', 'Patna', 'Surat'];
    let n = 0;

    function variant() {
      n++;
      const name = NAMES[n % NAMES.length];
      const city = CITY[n % CITY.length];
      const m = 40 + ((n * 7) % 5) * 5;            // mass, kg
      const v = 6 + ((n * 3) % 4);                 // velocity, m/s
      const s = 2 + ((n * 5) % 3);                 // distance, m
      const ke = 0.5 * m * v * v;
      const f = Math.round(ke / s);

      qEl.innerHTML =
        `A cyclist in <mark>${city}</mark>, <mark>${name}</mark>, of combined mass ` +
        `<mark>${m} kg</mark> is moving at <mark>${v} m s⁻¹</mark>. Brakes bring the cycle ` +
        `uniformly to rest over <mark>${s} m</mark>. Find the magnitude of the average ` +
        `retarding force.`;

      idEl.textContent = `PHY-1104-V${String(n).padStart(3, '0')}`;
      aEl.textContent = (1.24 + (n % 3) * 0.004).toFixed(3);
      bEl.textContent = (0.380 + ((n % 5) - 2) * 0.006).toFixed(3);
      cEl.textContent = '0.200';
      root.dataset.answer = f;

      if (!REDUCED) {
        steps.forEach((s2, i) => {
          s2.classList.remove('is-lit');
          setTimeout(() => {
            s2.classList.add('is-lit');
            setTimeout(() => s2.classList.remove('is-lit'), 900);
          }, i * 170);
        });
      }
    }
    if (btn) btn.addEventListener('click', variant);
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { variant(); io.disconnect(); } }, { threshold: .3 });
    io.observe(root);
  })();

  /* ==========================================================
     MODULE D — Deterministic evidence trails
     ========================================================== */
  (function evidence() {
    const root = $('[data-evidence]');
    if (!root) return;
    const rows = $$('[data-case]', root);
    const out  = $('[data-trail]', root);
    const head = $('[data-trail-head]', root);
    const vd   = $('[data-trail-verdict]', root);

    const CASES = {
      'S-77401': {
        v: 'review', label: 'Review required',
        head: 'Session S-77401 · Level 3 · Physics 1104',
        trail: [
          ['11:42:06.114', 'secondary_stream.interrupt — RTT > 4000 ms for 11.4 s'],
          ['11:42:06.118', 'exam_client.paused — item timer halted, answers sealed'],
          ['11:42:17.502', 'secondary_stream.resume — device attestation re-verified'],
          ['11:42:17.505', 'screen_binding.rebind — seq=8841 Δ311 ms WITHIN_WINDOW'],
          ['11:42:17.940', 'exam_client.resumed — 11.4 s credited to candidate'],
          ['11:42:18.001', 'event_record.written — evidence.clip[11:41:55–11:42:25] sealed']
        ]
      },
      'S-77418': {
        v: 'clear', label: 'Clear',
        head: 'Session S-77418 · Level 3 · Chemistry 2201',
        trail: [
          ['09:15:00.002', 'identity.level3 — OCR ✓ liveness ✓ dual-angle corr 0.981'],
          ['09:15:00.140', 'attestation.verify — App Attest receipt valid, chain OK'],
          ['09:15:01.006', 'paper.release — variant CHE-2201-V072 decrypted client-side'],
          ['12:15:02.771', 'screen_binding — 1,141 tokens observed, 1,141 in window'],
          ['12:15:03.010', 'submission.sealed — SHA-256 f3a9…ce41 countersigned'],
          ['12:15:03.402', 'verdict.assigned — Clear (no flags raised)']
        ]
      },
      'S-77426': {
        v: 'null', label: 'Not assessable',
        head: 'Session S-77426 · Level 2 · Aptitude 0901',
        trail: [
          ['14:03:22.610', 'primary_camera.exposure — sustained backlight, face SNR low'],
          ['14:03:44.118', 'dual_angle.correlation — insufficient signal, not computed'],
          ['14:04:02.900', 'operator.notice — candidate asked to reposition lamp'],
          ['14:09:51.336', 'dual_angle.correlation — still insufficient signal'],
          ['14:41:10.004', 'verdict.assigned — Not assessable (evidence quality)'],
          ['14:41:10.006', 'remedy.issued — free re-sit slot booked, no penalty']
        ]
      }
    };

    function pick(id, btn) {
      const c = CASES[id];
      if (!c) return;
      rows.forEach(r => r.classList.toggle('is-sel', r === btn));
      head.textContent = c.head;
      vd.className = 'verdict verdict--' + c.v;
      vd.textContent = c.label;
      out.innerHTML = '';
      c.trail.forEach((t, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="ts">${t[0]}</span><span>${t[1]}</span>`;
        li.style.opacity = '0';
        li.style.transform = 'translateY(4px)';
        li.style.transition = 'opacity .4s ease, transform .4s ease';
        li.style.transitionDelay = (i * 0.05) + 's';
        out.appendChild(li);
        requestAnimationFrame(() => { li.style.opacity = '1'; li.style.transform = 'none'; });
      });
    }
    rows.forEach(r => r.addEventListener('click', () => pick(r.dataset.case, r)));
    if (rows[0]) pick(rows[0].dataset.case, rows[0]);
  })();

  /* ==========================================================
     MODULE E — Bilingual itemised consent
     ========================================================== */
  (function consent() {
    const root = $('[data-consent]');
    if (!root) return;
    const btns = $$('[data-lang]', root);
    const nodes = $$('[data-en]', root);
    function set(lang) {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
      nodes.forEach(n => { n.textContent = lang === 'hi' ? n.dataset.hi : n.dataset.en; });
      root.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    }
    btns.forEach(b => b.addEventListener('click', () => set(b.dataset.lang)));
    set('en');
  })();

  /* ==========================================================
     CHART 1 — Item characteristic curves
     3PL: P(θ) = c + (1 − c) / (1 + e^(−1.7·a·(θ − b)))
     Base item plus its AI-generated variants, inside the ±0.05
     logit parity envelope the calibrator enforces.
     ========================================================== */
  (function icc() {
    const mount = $('#iccChart');
    if (!mount) return;

    const W = 760, H = 400, ML = 52, MR = 104, MT = 20, MB = 46;
    const PW = W - ML - MR, PH = H - MT - MB;
    const X = t => ML + ((t + 3) / 6) * PW;
    const Y = p => MT + (1 - p) * PH;
    const P = (th, a, b, c) => c + (1 - c) / (1 + Math.exp(-1.7 * a * (th - b)));

    const BASE = { a: 1.240, b: 0.380, c: 0.200 };
    const TOL = 0.050;
    const VARIANTS = [
      { id: 'V001', a: 1.242, b: 0.374 }, { id: 'V014', a: 1.238, b: 0.391 },
      { id: 'V027', a: 1.244, b: 0.366 }, { id: 'V039', a: 1.236, b: 0.402 },
      { id: 'V051', a: 1.241, b: 0.385 }, { id: 'V063', a: 1.239, b: 0.359 },
      { id: 'V072', a: 1.243, b: 0.396 }, { id: 'V088', a: 1.237, b: 0.371 }
    ];

    const path = (a, b, c) => {
      let d = '';
      for (let i = 0; i <= 120; i++) {
        const th = -3 + (6 * i) / 120;
        d += (i ? 'L' : 'M') + X(th).toFixed(2) + ' ' + Y(P(th, a, b, c)).toFixed(2);
      }
      return d;
    };

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    svg.setAttribute('aria-label',
      'Item characteristic curves. Eight AI-generated variants lie inside the ±0.05 logit parity envelope around the calibrated base item.');

    // gridlines + y ticks
    [0, 0.25, 0.5, 0.75, 1].forEach(p => {
      svg.appendChild(el('line', { x1: ML, x2: ML + PW, y1: Y(p), y2: Y(p), stroke: 'var(--grid)', 'stroke-width': 1 }));
      const t = el('text', { x: ML - 12, y: Y(p) + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--ink-4)' });
      t.textContent = p.toFixed(2);
      svg.appendChild(t);
    });
    // x axis
    svg.appendChild(el('line', { x1: ML, x2: ML + PW, y1: Y(0), y2: Y(0), stroke: 'var(--axis)', 'stroke-width': 1 }));
    for (let th = -3; th <= 3; th++) {
      const t = el('text', { x: X(th), y: Y(0) + 22, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-4)' });
      t.textContent = th > 0 ? '+' + th : String(th);
      svg.appendChild(t);
    }
    const xl = el('text', { x: ML + PW / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' });
    xl.textContent = 'Candidate ability θ (logits)';
    svg.appendChild(xl);
    const yl = el('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)',
      transform: `translate(14 ${MT + PH / 2}) rotate(-90)` });
    yl.textContent = 'P(correct)';
    svg.appendChild(yl);

    // parity envelope: curve at b−tol down to curve at b+tol
    let band = '';
    for (let i = 0; i <= 120; i++) {
      const th = -3 + (6 * i) / 120;
      band += (i ? 'L' : 'M') + X(th).toFixed(2) + ' ' + Y(P(th, BASE.a, BASE.b - TOL, BASE.c)).toFixed(2);
    }
    for (let i = 120; i >= 0; i--) {
      const th = -3 + (6 * i) / 120;
      band += 'L' + X(th).toFixed(2) + ' ' + Y(P(th, BASE.a, BASE.b + TOL, BASE.c)).toFixed(2);
    }
    svg.appendChild(el('path', { d: band + 'Z', fill: 'var(--series-1)', 'fill-opacity': 0.10 }));

    // variant bundle (thin) + variant mean (2px)
    VARIANTS.forEach(v => svg.appendChild(el('path', {
      d: path(v.a, v.b, BASE.c), fill: 'none', stroke: 'var(--series-1)',
      'stroke-width': 1, 'stroke-opacity': 0.42, 'stroke-linecap': 'round'
    })));
    const mB = VARIANTS.reduce((s, v) => s + v.b, 0) / VARIANTS.length;
    const mA = VARIANTS.reduce((s, v) => s + v.a, 0) / VARIANTS.length;
    svg.appendChild(el('path', { d: path(mA, mB, BASE.c), fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    svg.appendChild(el('path', { d: path(BASE.a, BASE.b, BASE.c), fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 4', 'stroke-linejoin': 'round' }));

    // direct end labels (identity is never colour-alone: legend below repeats it)
    const lab = (y, txt, sub) => {
      const g = el('g');
      const t1 = el('text', { x: ML + PW + 12, y: y, 'font-size': 12, fill: 'var(--ink)' });
      t1.textContent = txt;
      const t2 = el('text', { x: ML + PW + 12, y: y + 15, 'font-size': 10.5, fill: 'var(--ink-3)' });
      t2.textContent = sub;
      g.appendChild(t1); g.appendChild(t2);
      return g;
    };
    svg.appendChild(lab(Y(P(3, mA, mB, BASE.c)) - 6, 'Variants', 'n = 8 · mean b ' + mB.toFixed(3)));
    svg.appendChild(lab(Y(P(3, BASE.a, BASE.b, BASE.c)) + 30, 'Base item', 'b = ' + BASE.b.toFixed(3)));

    // crosshair layer
    const cross = el('g', { opacity: 0 });
    const vline = el('line', { y1: MT, y2: MT + PH, stroke: 'var(--ink-4)', 'stroke-width': 1 });
    const dot1 = el('circle', { r: 4.5, fill: 'var(--series-1)', stroke: 'var(--surface)', 'stroke-width': 2 });
    const dot2 = el('circle', { r: 4.5, fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });
    cross.appendChild(vline); cross.appendChild(dot1); cross.appendChild(dot2);
    svg.appendChild(cross);

    const hit = el('rect', { x: ML, y: MT, width: PW, height: PH, fill: 'transparent', style: 'cursor:crosshair' });
    svg.appendChild(hit);
    mount.appendChild(svg);

    const tip = document.createElement('div');
    tip.className = 'tip';
    mount.appendChild(tip);

    function move(ev) {
      const r = svg.getBoundingClientRect();
      const cx = ('touches' in ev ? ev.touches[0].clientX : ev.clientX) - r.left;
      const th = Math.max(-3, Math.min(3, ((cx / r.width * W) - ML) / PW * 6 - 3));
      const pv = P(th, mA, mB, BASE.c), pb = P(th, BASE.a, BASE.b, BASE.c);
      cross.setAttribute('opacity', 1);
      vline.setAttribute('x1', X(th)); vline.setAttribute('x2', X(th));
      dot1.setAttribute('cx', X(th)); dot1.setAttribute('cy', Y(pv));
      dot2.setAttribute('cx', X(th)); dot2.setAttribute('cy', Y(pb));
      tip.classList.add('on');
      tip.style.left = (X(th) / W * r.width) + 'px';
      tip.style.top = (Y(Math.max(pv, pb)) / H * r.height) + 'px';
      tip.innerHTML =
        `<b>θ = ${th >= 0 ? '+' : ''}${th.toFixed(2)}</b><br>` +
        `<span class="tip__row"><i class="tip__dot" style="background:var(--series-1)"></i>Variants <b>${pv.toFixed(3)}</b></span>` +
        `<span class="tip__row"><i class="tip__dot" style="background:var(--series-2)"></i>Base <b>${pb.toFixed(3)}</b></span>` +
        `<span class="k">ΔP = ${(Math.abs(pv - pb)).toFixed(4)}</span>`;
    }
    hit.addEventListener('mousemove', move);
    hit.addEventListener('touchmove', e => { move(e); e.preventDefault(); }, { passive: false });
    hit.addEventListener('mouseleave', () => { cross.setAttribute('opacity', 0); tip.classList.remove('on'); });

    // table view
    const tv = $('#iccTable');
    if (tv) {
      const rows = [-2, -1, 0, 1, 2].map(th => {
        const pv = P(th, mA, mB, BASE.c), pb = P(th, BASE.a, BASE.b, BASE.c);
        return `<tr><td>${th >= 0 ? '+' : ''}${th.toFixed(1)}</td><td>${pb.toFixed(4)}</td><td>${pv.toFixed(4)}</td><td>${Math.abs(pv - pb).toFixed(4)}</td></tr>`;
      }).join('');
      tv.innerHTML =
        '<thead><tr><th>θ</th><th>Base P</th><th>Variant mean P</th><th>|ΔP|</th></tr></thead><tbody>' + rows + '</tbody>';
    }
  })();

  /* ==========================================================
     CHART 2 — Difficulty parity strip (b-parameter dot plot)
     ========================================================== */
  (function parity() {
    const mount = $('#parityChart');
    if (!mount) return;
    const W = 760, H = 132, ML = 20, MR = 20, MT = 34, MB = 34;
    const PW = W - ML - MR;
    const LO = 0.28, HI = 0.48;
    const X = b => ML + ((b - LO) / (HI - LO)) * PW;
    const BASE = 0.380, TOL = 0.05;
    const VS = [0.374, 0.391, 0.366, 0.402, 0.385, 0.359, 0.396, 0.371, 0.388, 0.377, 0.394, 0.368];

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    svg.setAttribute('aria-label',
      'Difficulty parity strip: twelve variant b-parameters, all inside the ±0.05 logit tolerance band around the base item at 0.380.');

    svg.appendChild(el('rect', {
      x: X(BASE - TOL), y: MT - 14, width: X(BASE + TOL) - X(BASE - TOL), height: 44,
      fill: 'var(--series-1)', 'fill-opacity': 0.10, rx: 6
    }));
    svg.appendChild(el('line', { x1: ML, x2: ML + PW, y1: MT + 8, y2: MT + 8, stroke: 'var(--grid)', 'stroke-width': 1 }));
    svg.appendChild(el('line', { x1: X(BASE), x2: X(BASE), y1: MT - 16, y2: MT + 32, stroke: 'var(--series-2)', 'stroke-width': 2, 'stroke-linecap': 'round' }));

    VS.forEach((b, i) => {
      const c = el('circle', {
        cx: X(b), cy: MT + 8 + (i % 2 ? 0 : 0), r: 5,
        fill: 'var(--series-1)', stroke: 'var(--surface)', 'stroke-width': 2
      });
      c.appendChild(el('title')).textContent = `Variant ${i + 1} · b = ${b.toFixed(3)} · Δ from base ${(b - BASE >= 0 ? '+' : '') + (b - BASE).toFixed(3)}`;
      svg.appendChild(c);
    });

    const tick = (v, txt, dy) => {
      const t = el('text', { x: X(v), y: MT + dy, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'var(--ink-4)' });
      t.textContent = txt;
      svg.appendChild(t);
    };
    tick(BASE - TOL, '−0.05', 52); tick(BASE, 'b = 0.380', -22); tick(BASE + TOL, '+0.05', 52);
    const cap = el('text', { x: ML, y: H - 6, 'font-size': 11, fill: 'var(--ink-3)' });
    cap.textContent = 'Observed spread 0.043 logits · tolerance ±0.050 · no variant outside band';
    svg.appendChild(cap);
    mount.appendChild(svg);
  })();

  /* ==========================================================
     COMMAND CENTRE — sparkline, verdict stack, live counters
     ========================================================== */
  (function commandCentre() {
    const spark = $('#ccSpark');
    if (spark) {
      const W = 300, H = 44;
      const D = [38, 41, 40, 44, 47, 45, 49, 52, 50, 55, 58, 57, 61, 60, 64, 68, 66, 71, 74, 72, 77, 81, 79, 84];
      const mx = Math.max(...D), mn = Math.min(...D);
      const X = i => (i / (D.length - 1)) * W;
      const Y = v => H - 4 - ((v - mn) / (mx - mn)) * (H - 12);
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img' });
      svg.setAttribute('aria-label', 'Sessions started per minute over the last 24 minutes, trending up.');
      let d = '', area = '';
      D.forEach((v, i) => { d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); });
      area = d + `L${W} ${H}L0 ${H}Z`;
      svg.appendChild(el('path', { d: area, fill: 'var(--series-1)', 'fill-opacity': 0.10 }));
      svg.appendChild(el('path', { d, fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
      svg.appendChild(el('circle', { cx: X(D.length - 1), cy: Y(D[D.length - 1]), r: 4, fill: 'var(--series-1)', stroke: 'var(--surface)', 'stroke-width': 2 }));
      spark.appendChild(svg);
    }

    // Live session counter — drifts to look alive without pretending precision.
    const live = $('[data-live-count]');
    if (live && !REDUCED) {
      let v = 214806;
      setInterval(() => {
        v += Math.round((Math.random() - 0.35) * 26);
        live.textContent = v.toLocaleString('en-IN');
      }, 2200);
    }

    // Rolling flag feed
    const feed = $('[data-flagfeed]');
    if (feed && !REDUCED) {
      const POOL = [
        ['S-77431', 'secondary_stream.interrupt 8.2 s', 'review'],
        ['S-77433', 'identity.level3 corr 0.976', 'clear'],
        ['S-77436', 'screen_binding.lapse Δ2412 ms', 'review'],
        ['S-77438', 'attestation.verify chain OK', 'clear'],
        ['S-77441', 'primary_camera.exposure low SNR', 'null'],
        ['S-77444', 'submission.sealed 4c9d…10ab', 'clear'],
        ['S-77447', 'network.reconnect 3.1 s credited', 'clear']
      ];
      const LB = { clear: 'Clear', review: 'Review', null: 'Not assessable' };
      const ICO = {
        clear: '<svg class="verdict__ico" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.2l2.6 2.6L10 3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        review: '<svg class="verdict__ico" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.6l5 8.8H1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 5v2.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
        null: '<svg class="verdict__ico" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.6 6h4.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
      };
      let i = 0;
      setInterval(() => {
        const p = POOL[i++ % POOL.length];
        const li = document.createElement('li');
        li.innerHTML = `<span class="fid">${p[0]}</span><span class="fwhat">${p[1]}</span>` +
          `<span class="verdict verdict--${p[2]}">${ICO[p[2]]}${LB[p[2]]}</span>`;
        li.style.opacity = '0';
        feed.prepend(li);
        requestAnimationFrame(() => { li.style.transition = 'opacity .5s ease'; li.style.opacity = '1'; });
        while (feed.children.length > 5) feed.lastChild.remove();
      }, 3400);
    }
  })();
})();
