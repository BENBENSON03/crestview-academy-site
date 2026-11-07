/* =========================================================
   ABOUT PAGE SCRIPT  (about.js)
   Sections:
   0. Settings you can edit      5. Gallery filter (Section 8)
   1. Small helpers              6. Newsletter form (Section 10)
   2. Mobile menu                7. Footer year
   3. Scroll reveal              8. Start everything
   4. Achievement counters (Section 6)
   ========================================================= */

/* ---------- 0. SETTINGS YOU CAN EDIT ---------- */
// Newsletter: paste the URL of your newsletter/form service here (a link that accepts a POST request).
// While this is empty, the form will NOT pretend to subscribe anyone.
const NEWSLETTER_ENDPOINT = '';

// How long (in milliseconds) the number counters take to count up.
const COUNTER_DURATION = 1800;

// Lets the CSS know scripts are running (so reveal animations only hide things when they can reveal them)
document.documentElement.classList.add('js');

/* ---------- 1. SMALL HELPERS ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 2. MOBILE MENU ----------
   Opens and closes the menu, keeps aria-expanded up to date,
   closes with the Escape key or after choosing a link. */
function initMobileMenu() {
  const toggle = $('#nav-toggle');
  const nav = $('#site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  // If the window grows to desktop size, reset the menu.
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

/* ---------- 3. SCROLL REVEAL ----------
   Elements with class "reveal" fade in once when they scroll into view. */
function initScrollReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // only animate once
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
}

/* ---------- 4. ACHIEVEMENT COUNTERS (SECTION 6) ----------
   Counts each number up from 0 to its data-count value, one time only. */
function initCounters() {
  const counters = $$('[data-count]');
  const section = $('#achievements');
  if (!counters.length || !section) return;

  const finalise = () => counters.forEach((el) => { el.textContent = el.dataset.count; });

  // No animation for reduced-motion users or very old browsers.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return finalise();

  let hasRun = false;

  const run = () => {
    hasRun = true;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / COUNTER_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // starts fast, slows near the end
      counters.forEach((el) => {
        el.textContent = Math.round(Number(el.dataset.count) * eased);
      });
      if (progress < 1) requestAnimationFrame(tick);
      else finalise();
    };

    counters.forEach((el) => { el.textContent = '0'; });
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    if (!hasRun && entries.some((entry) => entry.isIntersecting)) {
      run();
      observer.disconnect();
    }
  }, { threshold: 0.35 });

  observer.observe(section);
}

/* ---------- 5. GALLERY FILTER (SECTION 8) ----------
   Filter buttons show or hide photos by their data-category value. */
function initGalleryFilter() {
  const buttons = $$('.filter-btn');
  const items = $$('.gallery__item');
  const status = $('#gallery-status');
  if (!buttons.length || !items.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;

      buttons.forEach((b) => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      let visible = 0;
      items.forEach((item) => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.hidden = !show;
        if (show) {
          visible += 1;
          // Restart the small fade-in animation
          item.style.animation = 'none';
          void item.offsetWidth;
          item.style.animation = '';
        }
      });

      // Tell screen-reader users what changed
      if (status) status.textContent = `Showing ${visible} photo${visible === 1 ? '' : 's'}${filter === 'all' ? '' : ' in ' + button.textContent}.`;
    });
  });
}

/* ---------- 6. NEWSLETTER FORM (SECTION 10) ----------
   Checks the email address. It only says "subscribed" if a real
   endpoint is set above AND the service answers successfully. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function initNewsletter() {
  const form = $('#newsletter-form');
  const input = $('#newsletter-email');
  const status = $('#newsletter-status');
  if (!form || !input || !status) return;

  const show = (message, type) => {
    status.textContent = message;
    status.className = 'newsletter__status' + (type ? ' is-' + type : '');
  };

  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    show('', '');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = input.value.trim();

    if (!email) {
      input.setAttribute('aria-invalid', 'true');
      show('Please enter your email address.', 'error');
      input.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      input.setAttribute('aria-invalid', 'true');
      show('That email address does not look right. Please check it and try again.', 'error');
      input.focus();
      return;
    }

    // No service connected yet: be honest, do not claim success.
    if (!NEWSLETTER_ENDPOINT) {
      show('Thanks, but the newsletter is not connected yet, so nothing was sent. The site owner needs to add a newsletter service.', 'info');
      return;
    }

    const button = $('button[type="submit"]', form);
    button.disabled = true;
    show('Sending…', 'info');
    try {
      const response = await fetch(NEWSLETTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error('Request failed');
      show('You are subscribed. Thank you!', '');
      form.reset();
    } catch (error) {
      show('Sorry, we could not subscribe you right now. Please try again later.', 'error');
    } finally {
      button.disabled = false;
    }
  });
}

/* ---------- 7. FOOTER YEAR ---------- */
function initFooterYear() {
  const year = $('#footer-year');
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- 8. START EVERYTHING ---------- */
function init() {
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initGalleryFilter();
  initNewsletter();
  initFooterYear();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
