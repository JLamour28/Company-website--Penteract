/* ─── MAIN.JS ─── */

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ── Navbar scroll shadow ──
const navPill = document.querySelector('.nav-pill');
if (navPill) {
  window.addEventListener('scroll', () => {
    navPill.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}


// ── Mobile nav toggle ──
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle?.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) {
    navToggle?.classList.remove('open');
    navLinks?.classList.remove('open');
  }
});

// Close nav on link click (mobile)
navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle?.classList.remove('open');
    navLinks?.classList.remove('open');
  });
});


// ── Hero solution cards carousel ──
(function initHeroCarousel() {
  const track    = document.getElementById('heroTrack');
  const carousel = document.getElementById('heroCarousel');
  const dots     = document.querySelectorAll('#heroDots .carousel-dot');
  const prevBtn  = document.getElementById('heroPrev');
  const nextBtn  = document.getElementById('heroNext');
  if (!track || !dots.length) return;

  const cards  = track.querySelectorAll('.hero-card');
  let current  = 0;
  let autoplay;

  function goTo(index) {
    current = (index + cards.length) % cards.length;
    // Pixel-based offset — each card fills the exact carousel container width
    const slotW = carousel.offsetWidth;
    track.style.transform = `translateX(-${current * slotW}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  // Recalculate on resize so offset stays accurate at any viewport width
  window.addEventListener('resize', () => goTo(current), { passive: true });

  function startAutoplay() {
    autoplay = setInterval(() => goTo(current + 1), 3500);
  }

  function stopAutoplay() {
    clearInterval(autoplay);
  }

  // Dot navigation
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      goTo(parseInt(dot.dataset.index));
      startAutoplay();
    });
  });

  // Prev / Next buttons
  prevBtn?.addEventListener('click', () => {
    stopAutoplay();
    goTo(current - 1);
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    stopAutoplay();
    goTo(current + 1);
    startAutoplay();
  });

  // Pause autoplay on hover
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  // Touch swipe
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) {
      stopAutoplay();
      goTo(dx < 0 ? current + 1 : current - 1);
      startAutoplay();
    }
  });

  goTo(0);
  startAutoplay();
})();


// ── Testimonials carousel ──
(function initTestiCarousel() {
  const track  = document.getElementById('testiTrack');
  const dots   = document.querySelectorAll('#testiDots .carousel-dot');
  const prev   = document.getElementById('testiPrev');
  const next   = document.getElementById('testiNext');
  if (!track) return;

  const cards  = track.querySelectorAll('.testimonial-card');
  let current  = 0;
  let autoplay;

  function getVisible() {
    return window.innerWidth < 768 ? 1 : 2;
  }

  function goTo(index) {
    current = (index + cards.length) % cards.length;
    const cardW = cards[0].offsetWidth + 24; // gap
    track.style.transform = `translateX(-${current * cardW}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function start() { autoplay = setInterval(() => goTo(current + 1), 5000); }
  function stop()  { clearInterval(autoplay); }

  prev?.addEventListener('click', () => { stop(); goTo(current - 1); start(); });
  next?.addEventListener('click', () => { stop(); goTo(current + 1); start(); });
  dots.forEach(d => d.addEventListener('click', () => { stop(); goTo(parseInt(d.dataset.index)); start(); }));

  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    start();
  });

  goTo(0);
  start();
})();


// ── Animated counters ──
function animateCounter(el) {
  const target   = parseFloat(el.dataset.count);
  const suffix   = el.dataset.suffix || '';
  const duration = 1800;
  const start    = performance.now();
  const isFloat  = target % 1 !== 0;

  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = (isFloat ? (target * ease).toFixed(1) : Math.round(target * ease)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));


// ── Smooth anchor scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// ── Cursor glow (desktop only) ──
(function () {
  if (window.innerWidth < 1024 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const glow = Object.assign(document.createElement('div'), { id: 'cursorGlow' });
  Object.assign(glow.style, {
    position: 'fixed', pointerEvents: 'none', zIndex: '0',
    width: '380px', height: '380px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(10,173,173,0.06) 0%, transparent 70%)',
    transform: 'translate(-50%, -50%)',
    top: '0', left: '0', transition: 'opacity .3s',
  });
  document.body.appendChild(glow);

  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  (function animate() {
    gx += (mx - gx) * 0.07;
    gy += (my - gy) * 0.07;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(animate);
  })();
})();
