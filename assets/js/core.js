/* ============================================================
   TrustXD ExamOS — core interactions
   nav · menu · cursor · reveals · split lines · counters
   marquee velocity · scroll progress · sticky rails
   ============================================================ */
(() => {
  'use strict';

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 1. Split headings into clip-revealed lines ------------------ */
  function splitLines(el) {
    if (el.dataset.split === 'done') return;
    if (!el.dataset.orig) el.dataset.orig = el.innerHTML;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    // Preserve inline <em class="ital"> markup by walking child nodes.
    const parts = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(w => { if (w.trim()) parts.push({ t: w, tag: null }); });
      } else if (n.nodeType === 1) {
        parts.push({ t: n.textContent, tag: n.cloneNode(true) });
      }
    });
    if (!parts.length) return;

    el.textContent = '';
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline';
    el.appendChild(probe);

    // Lay words out, measure wraps, then group into lines.
    const spans = parts.map(p => {
      const s = document.createElement('span');
      if (p.tag) { s.appendChild(p.tag); } else { s.textContent = p.t; }
      s.style.display = 'inline-block';
      probe.appendChild(s);
      probe.appendChild(document.createTextNode(' '));
      return s;
    });

    const lines = [];
    let top = null, cur = [];
    spans.forEach(s => {
      const t = Math.round(s.offsetTop);
      if (top === null || Math.abs(t - top) < 4) { cur.push(s); top = top === null ? t : top; }
      else { lines.push(cur); cur = [s]; top = t; }
    });
    if (cur.length) lines.push(cur);

    el.textContent = '';
    lines.forEach((ln, i) => {
      const outer = document.createElement('span');
      outer.className = 'ln';
      const inner = document.createElement('span');
      inner.className = 'ln__i';
      inner.style.transitionDelay = (i * 0.075) + 's';
      ln.forEach((s, j) => {
        inner.appendChild(s.firstChild ? s.firstChild.cloneNode(true) : document.createTextNode(''));
        if (j < ln.length - 1) inner.appendChild(document.createTextNode(' '));
      });
      outer.appendChild(inner);
      el.appendChild(outer);
    });
    el.dataset.split = 'done';
    el.setAttribute('aria-label', text);
  }

  function initSplit() {
    $$('[data-split]').forEach(el => {
      if (reduced()) { el.classList.add('reveal-on'); return; }
      splitLines(el);
    });
  }

  /* ---------- 2. Reveal on scroll ---------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      if (e.target.dataset.split !== undefined) e.target.classList.add('reveal-on');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  function observeAll() {
    $$('[data-rise], [data-wipe], [data-draw], [data-split]').forEach(el => {
      // stagger children of a group
      io.observe(el);
    });
    $$('[data-stagger]').forEach(group => {
      const kids = Array.from(group.children);
      kids.forEach((k, i) => {
        if (!k.hasAttribute('data-rise')) k.setAttribute('data-rise', '');
        k.style.setProperty('--d', (i * (parseFloat(group.dataset.stagger) || 0.07)) + 's');
        io.observe(k);
      });
    });
  }

  /* ---------- 3. Nav: stuck + hide-on-scroll-down ------------------------- */
  const nav = $('.nav');
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-stuck', y > 20);
      if (!document.body.classList.contains('menu-open')) {
        nav.classList.toggle('is-hidden', y > lastY && y > 420);
      }
    }
    const p = $('.progress');
    if (p) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      p.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- 4. Mobile menu --------------------------------------------- */
  const burger = $('.nav__burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    $$('.menu a').forEach(a => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
    }));
  }

  /* ---------- 5. Cursor + magnetic --------------------------------------- */
  const cursor = $('.cursor');
  if (cursor && !reduced() && window.matchMedia('(hover: hover)').matches) {
    let cx = -60, cy = -60, tx = -60, ty = -60;
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx - 5}px, ${cy - 5}px, 0)`;
      requestAnimationFrame(loop);
    })();

    const label = $('.cursor__label');
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-lg');
        if (label) label.textContent = el.dataset.cursor;
      });
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-lg'));
    });

    // magnetic buttons
    $$('[data-magnet]').forEach(el => {
      const strength = parseFloat(el.dataset.magnet) || 0.28;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 6. Counters ------------------------------------------------- */
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const dur = parseInt(el.dataset.dur || '1500', 10);
      if (reduced()) { el.textContent = to.toFixed(dec); cio.unobserve(el); return; }
      const t0 = performance.now();
      (function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        const e2 = 1 - Math.pow(1 - k, 4);
        el.textContent = (to * e2).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (k < 1) requestAnimationFrame(step);
      })(t0);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- 7. Marquee: duplicate track + scroll-velocity skew ---------- */
  $$('.marquee').forEach(m => {
    const track = m.querySelector('.marquee__track');
    if (!track) return;
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.appendChild(clone);
  });

  if (!reduced()) {
    let vLast = window.scrollY, vel = 0;
    const tracks = $$('.marquee__track');
    (function velLoop() {
      const y = window.scrollY;
      vel += ((y - vLast) - vel) * 0.12;
      vLast = y;
      const skew = Math.max(-7, Math.min(7, vel * 0.22));
      tracks.forEach(t => { t.style.transform = `skewX(${skew}deg)`; });
      requestAnimationFrame(velLoop);
    })();
  }

  /* ---------- 8. Scrollspy for the module rail ---------------------------- */
  function scrollspy(sel, navSel) {
    const secs = $$(sel);
    const btns = $$(navSel);
    if (!secs.length || !btns.length) return;
    const map = new Map(btns.map(b => [b.getAttribute('href') || b.dataset.target, b]));
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        btns.forEach(b => b.classList.remove('is-active'));
        const b = map.get('#' + e.target.id);
        if (b) b.classList.add('is-active');
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    secs.forEach(s => so.observe(s));
  }
  scrollspy('.mod', '.mods__navbtn');
  scrollspy('[data-doc-sec]', '.toc__link');

  /* ---------- 9. Runtime timeline ----------------------------------------- */
  (function runtime() {
    const wrap = $('[data-runtime]');
    if (!wrap) return;
    const steps = $$('.step', wrap);
    const clock = $('[data-runtime-clock]');
    const phase = $('[data-runtime-phase]');
    const bar = $('[data-runtime-bar]');
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        steps.forEach(s => s.classList.remove('is-active'));
        e.target.classList.add('is-active');
        if (clock) clock.textContent = e.target.dataset.clock || '';
        if (phase) phase.textContent = e.target.dataset.phase || '';
        if (bar) {
          const i = steps.indexOf(e.target);
          bar.style.width = ((i + 1) / steps.length * 100) + '%';
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => ro.observe(s));
  })();

  /* ---------- 10. Simple accordions / tabs -------------------------------- */
  $$('[data-tabs]').forEach(group => {
    const btns = $$('[data-tab]', group);
    const panes = $$('[data-pane]', group);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      panes.forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
    }));
  });

  /* ---------- 11. Year stamp + form guard --------------------------------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  $$('form[data-demo-form]').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      const note = f.querySelector('[data-form-note]');
      if (note) {
        note.textContent = 'Demo site — no data was transmitted. Wire this form to your CRM endpoint before launch.';
        note.style.color = 'var(--st-review)';
      }
    });
  });

  /* ---------- boot -------------------------------------------------------- */
  function boot() {
    initSplit();
    observeAll();
    onScroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      $$('[data-split]').forEach(el => {
        if (el.dataset.split === 'done' && el.dataset.orig) {
          el.dataset.split = '';
          el.innerHTML = el.dataset.orig;
          splitLines(el);
          el.classList.add('reveal-on');
        }
      });
    }, 240);
  });
})();
