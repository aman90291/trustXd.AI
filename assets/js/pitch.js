/* ============================================================
   TrustXD ExamOS — deck controller
   Keyboard, rail, progress, reveal-on-enter.
   ============================================================ */
(() => {
  'use strict';

  const deck = document.querySelector('.deck');
  if (!deck) return;
  const slides = Array.from(deck.querySelectorAll('.slide'));
  const rail = document.querySelector('.deck__rail');
  const bar = document.querySelector('.deck__bar i');
  const num = document.querySelector('[data-deck-num]');
  const total = slides.length;
  let index = 0;

  // rail dots
  slides.forEach((s, i) => {
    const a = document.createElement('a');
    a.className = 'deck__dot';
    a.href = '#' + (s.id || 's' + (i + 1));
    a.setAttribute('aria-label', `Go to slide ${i + 1} of ${total}`);
    a.addEventListener('click', e => { e.preventDefault(); go(i); });
    rail && rail.appendChild(a);
  });
  const dots = rail ? Array.from(rail.children) : [];

  const top = document.querySelector('.deck__top');

  function setIndex(i) {
    index = Math.max(0, Math.min(total - 1, i));
    dots.forEach((d, k) => d.classList.toggle('is-on', k === index));
    if (bar) bar.style.width = ((index + 1) / total * 100) + '%';
    if (num) num.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    slides[index].classList.add('is-live');
    // chrome inverts on dark slides so it never disappears into the background
    const dark = slides[index].classList.contains('slide--ink');
    if (top) top.classList.toggle('on-dark', dark);
    if (rail) rail.classList.toggle('on-dark', dark);
  }

  function go(i) {
    setIndex(i);
    slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Observe which slide is centred
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio > 0.55) {
        setIndex(slides.indexOf(e.target));
      }
    });
  }, { threshold: [0.55] });
  slides.forEach(s => io.observe(s));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
        e.preventDefault(); go(index + 1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); go(index - 1); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(total - 1); break;
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        break;
    }
  });

  document.querySelectorAll('[data-deck-next]').forEach(b =>
    b.addEventListener('click', () => go(index + 1)));
  document.querySelectorAll('[data-deck-full]').forEach(b =>
    b.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    }));

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  setIndex(0);
})();
