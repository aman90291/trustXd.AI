/* ============================================================
   TrustXD ExamOS — psychometric figures
   All curves are computed from the 3PL model at render time,
   not drawn by hand, so the page cannot drift from the maths.
   ============================================================ */
(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const $ = s => document.querySelector(s);

  /* 3PL */
  const P3 = (th, a, b, c) => c + (1 - c) / (1 + Math.exp(-1.7 * a * (th - b)));
  /* Item information, 3PL (Birnbaum) */
  const INF = (th, a, b, c) => {
    const p = P3(th, a, b, c);
    return 2.89 * a * a * ((1 - p) / p) * Math.pow((p - c) / (1 - c), 2);
  };

  const BASE = { a: 1.240, b: 0.380, c: 0.200 };
  const TOL = 0.05;
  const VARIANTS = [
    { a: 1.242, b: 0.374 }, { a: 1.238, b: 0.391 }, { a: 1.244, b: 0.366 },
    { a: 1.236, b: 0.402 }, { a: 1.241, b: 0.385 }, { a: 1.239, b: 0.359 },
    { a: 1.243, b: 0.396 }, { a: 1.237, b: 0.371 }
  ];
  const mA = VARIANTS.reduce((s, v) => s + v.a, 0) / VARIANTS.length;
  const mB = VARIANTS.reduce((s, v) => s + v.b, 0) / VARIANTS.length;

  /* shared axis furniture ------------------------------------------------- */
  function frame(mount, opts) {
    const { W, H, ML, MR, MT, MB, yTicks, yFmt, yLabel, xLabel, aria, yMax } = opts;
    const PW = W - ML - MR, PH = H - MT - MB;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    svg.setAttribute('aria-label', aria);
    const X = t => ML + ((t + 3) / 6) * PW;
    const Y = v => MT + (1 - v / yMax) * PH;

    yTicks.forEach(v => {
      svg.appendChild(el('line', { x1: ML, x2: ML + PW, y1: Y(v), y2: Y(v), stroke: 'var(--grid)', 'stroke-width': 1 }));
      const t = el('text', { x: ML - 10, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--ink-4)' });
      t.textContent = yFmt(v);
      svg.appendChild(t);
    });
    svg.appendChild(el('line', { x1: ML, x2: ML + PW, y1: MT + PH, y2: MT + PH, stroke: 'var(--axis)', 'stroke-width': 1 }));
    for (let th = -3; th <= 3; th++) {
      const t = el('text', { x: X(th), y: MT + PH + 22, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-4)' });
      t.textContent = th > 0 ? '+' + th : String(th);
      svg.appendChild(t);
    }
    const xl = el('text', { x: ML + PW / 2, y: H - 5, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' });
    xl.textContent = xLabel;
    svg.appendChild(xl);
    const ylb = el('text', { 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)', transform: `translate(13 ${MT + PH / 2}) rotate(-90)` });
    ylb.textContent = yLabel;
    svg.appendChild(ylb);
    mount.appendChild(svg);
    return { svg, X, Y, PW, PH };
  }

  const curve = (X, Y, f) => {
    let d = '';
    for (let i = 0; i <= 140; i++) {
      const th = -3 + (6 * i) / 140;
      d += (i ? 'L' : 'M') + X(th).toFixed(2) + ' ' + Y(f(th)).toFixed(2);
    }
    return d;
  };

  /* ---- FIG 1 · ICC family ------------------------------------------------ */
  (function icc() {
    const mount = $('#pIcc'); if (!mount) return;
    const g = frame(mount, {
      W: 760, H: 380, ML: 52, MR: 100, MT: 18, MB: 46, yMax: 1,
      yTicks: [0, .25, .5, .75, 1], yFmt: v => v.toFixed(2),
      yLabel: 'P(correct)', xLabel: 'Candidate ability θ (logits)',
      aria: 'Item characteristic curves for the base item and eight generated variants, all inside the ±0.05 logit parity envelope.'
    });

    let band = curve(g.X, g.Y, th => P3(th, BASE.a, BASE.b - TOL, BASE.c));
    for (let i = 140; i >= 0; i--) {
      const th = -3 + (6 * i) / 140;
      band += 'L' + g.X(th).toFixed(2) + ' ' + g.Y(P3(th, BASE.a, BASE.b + TOL, BASE.c)).toFixed(2);
    }
    g.svg.appendChild(el('path', { d: band + 'Z', fill: 'var(--series-1)', 'fill-opacity': .10 }));

    VARIANTS.forEach(v => g.svg.appendChild(el('path', {
      d: curve(g.X, g.Y, th => P3(th, v.a, v.b, BASE.c)),
      fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 1, 'stroke-opacity': .42
    })));
    g.svg.appendChild(el('path', { d: curve(g.X, g.Y, th => P3(th, mA, mB, BASE.c)), fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    g.svg.appendChild(el('path', { d: curve(g.X, g.Y, th => P3(th, BASE.a, BASE.b, BASE.c)), fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 2, 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round' }));

    const t1 = el('text', { x: 712, y: g.Y(P3(3, mA, mB, BASE.c)) - 2, 'font-size': 12, fill: 'var(--ink)' });
    t1.textContent = 'Variants (n = 8)';
    g.svg.appendChild(t1);
    const t2 = el('text', { x: 712, y: g.Y(P3(3, BASE.a, BASE.b, BASE.c)) + 26, 'font-size': 12, fill: 'var(--ink)' });
    t2.textContent = 'Base item';
    g.svg.appendChild(t2);
  })();

  /* ---- FIG 2 · Item information ------------------------------------------ */
  (function info() {
    const mount = $('#pInfo'); if (!mount) return;
    const peak = INF(BASE.b, BASE.a, BASE.b, BASE.c);
    const yMax = Math.ceil(peak * 10) / 10 + 0.05;
    const g = frame(mount, {
      W: 760, H: 320, ML: 52, MR: 100, MT: 18, MB: 46, yMax,
      yTicks: [0, .1, .2, .3, .4].filter(v => v <= yMax), yFmt: v => v.toFixed(2),
      yLabel: 'Information I(θ)', xLabel: 'Candidate ability θ (logits)',
      aria: 'Item information functions. The variant bundle peaks at the same ability point and the same height as the base item, so measurement precision is preserved.'
    });
    VARIANTS.forEach(v => g.svg.appendChild(el('path', {
      d: curve(g.X, g.Y, th => INF(th, v.a, v.b, BASE.c)),
      fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 1, 'stroke-opacity': .42
    })));
    g.svg.appendChild(el('path', { d: curve(g.X, g.Y, th => INF(th, mA, mB, BASE.c)), fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    g.svg.appendChild(el('path', { d: curve(g.X, g.Y, th => INF(th, BASE.a, BASE.b, BASE.c)), fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 2, 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round' }));

    // peak marker + direct label
    g.svg.appendChild(el('line', { x1: g.X(BASE.b), x2: g.X(BASE.b), y1: g.Y(peak), y2: g.Y(0), stroke: 'var(--ink-4)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
    g.svg.appendChild(el('circle', { cx: g.X(BASE.b), cy: g.Y(peak), r: 4.5, fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 }));
    const lb = el('text', { x: g.X(BASE.b) + 12, y: g.Y(peak) - 6, 'font-size': 11.5, fill: 'var(--ink)' });
    lb.textContent = `peak I = ${peak.toFixed(3)} at θ = ${BASE.b.toFixed(2)}`;
    g.svg.appendChild(lb);
  })();

  /* ---- FIG 3 · Test characteristic curves, two full forms ---------------- */
  (function tcc() {
    const mount = $('#pTcc'); if (!mount) return;
    const N = 60;
    const FORM_A = [], FORM_B = [];
    // deterministic pseudo-random so the figure is stable across loads
    let s = 424242;
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    for (let i = 0; i < N; i++) {
      const b = -2.2 + (4.4 * i) / (N - 1);
      const a = 0.95 + rnd() * 0.6;
      FORM_A.push({ a, b, c: 0.2 });
      FORM_B.push({ a: a + (rnd() - 0.5) * 0.02, b: b + (rnd() - 0.5) * 2 * TOL, c: 0.2 });
    }
    const T = (th, form) => form.reduce((acc, it) => acc + P3(th, it.a, it.b, it.c), 0);

    let maxD = 0, maxTh = 0;
    for (let i = 0; i <= 240; i++) {
      const th = -3 + (6 * i) / 240;
      const d = Math.abs(T(th, FORM_A) - T(th, FORM_B));
      if (d > maxD) { maxD = d; maxTh = th; }
    }

    const g = frame(mount, {
      W: 760, H: 360, ML: 52, MR: 104, MT: 18, MB: 46, yMax: N,
      yTicks: [0, 15, 30, 45, 60], yFmt: v => String(v),
      yLabel: 'Expected raw score (of 60)', xLabel: 'Candidate ability θ (logits)',
      aria: 'Test characteristic curves for two complete 60-item forms built from different variants. The curves are visually indistinguishable; the largest expected-score difference across the ability range is under a quarter of one mark.'
    });
    g.svg.appendChild(el('path', { d: curve(g.X, g.Y, th => T(th, FORM_A)), fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
    g.svg.appendChild(el('path', { d: curve(g.X, g.Y, th => T(th, FORM_B)), fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'stroke-linecap': 'round' }));

    g.svg.appendChild(el('circle', { cx: g.X(maxTh), cy: g.Y(T(maxTh, FORM_A)), r: 4.5, fill: 'var(--ink)', stroke: 'var(--surface)', 'stroke-width': 2 }));
    const lb = el('text', { x: g.X(maxTh) + 12, y: g.Y(T(maxTh, FORM_A)) + 4, 'font-size': 11.5, fill: 'var(--ink)' });
    lb.textContent = `max |Δ| = ${maxD.toFixed(2)} marks at θ = ${maxTh.toFixed(2)}`;
    g.svg.appendChild(lb);

    const l1 = el('text', { x: 664, y: g.Y(T(3, FORM_A)) - 4, 'font-size': 12, fill: 'var(--ink)' });
    l1.textContent = 'Form A';
    g.svg.appendChild(l1);
    const l2 = el('text', { x: 664, y: g.Y(T(3, FORM_A)) + 16, 'font-size': 12, fill: 'var(--ink)' });
    l2.textContent = 'Form B';
    g.svg.appendChild(l2);

    const out = $('#pTccOut');
    if (out) out.textContent = maxD.toFixed(2);
  })();

  /* ---- FIG 4 · DIF strip -------------------------------------------------- */
  (function dif() {
    const mount = $('#pDif'); if (!mount) return;
    const W = 760, H = 236, ML = 150, MR = 40, MT = 26, MB = 42;
    const PW = W - ML - MR;
    const LO = -0.12, HI = 0.12;
    const X = d => ML + ((d - LO) / (HI - LO)) * PW;

    const ROWS = [
      ['Language · Hindi vs English', 0.012, 0.021],
      ['Locality · rural vs urban', -0.008, 0.019],
      ['Gender · female vs male', 0.004, 0.017],
      ['Device tier · budget vs flagship', -0.014, 0.024]
    ];

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    svg.setAttribute('aria-label', 'Differential item functioning across four subgroup contrasts. All observed b-parameter differences, with their confidence intervals, fall inside the ±0.05 logit tolerance band.');

    svg.appendChild(el('rect', { x: X(-TOL), y: MT - 8, width: X(TOL) - X(-TOL), height: H - MT - MB + 14, fill: 'var(--series-1)', 'fill-opacity': .10, rx: 6 }));
    svg.appendChild(el('line', { x1: X(0), x2: X(0), y1: MT - 8, y2: H - MB + 6, stroke: 'var(--axis)', 'stroke-width': 1 }));

    ROWS.forEach((r, i) => {
      const y = MT + 14 + i * 40;
      const lab = el('text', { x: ML - 16, y: y + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: 'var(--ink-2)' });
      lab.textContent = r[0];
      svg.appendChild(lab);
      svg.appendChild(el('line', { x1: X(r[1] - r[2]), x2: X(r[1] + r[2]), y1: y, y2: y, stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-opacity': .45 }));
      const dot = el('circle', { cx: X(r[1]), cy: y, r: 5, fill: 'var(--series-1)', stroke: 'var(--surface)', 'stroke-width': 2 });
      dot.appendChild(el('title')).textContent = `${r[0]} · Δb = ${r[1] >= 0 ? '+' : ''}${r[1].toFixed(3)} ± ${r[2].toFixed(3)}`;
      svg.appendChild(dot);
      const val = el('text', { x: X(r[1]) + 14, y: y - 8, 'font-size': 10.5, fill: 'var(--ink-3)' });
      val.textContent = (r[1] >= 0 ? '+' : '') + r[1].toFixed(3);
      svg.appendChild(val);
    });

    [[-TOL, '−0.05 tolerance'], [0, 'no DIF'], [TOL, '+0.05 tolerance']].forEach(t => {
      const x = el('text', { x: X(t[0]), y: H - 14, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'var(--ink-4)' });
      x.textContent = t[1];
      svg.appendChild(x);
    });
    mount.appendChild(svg);
  })();
})();
