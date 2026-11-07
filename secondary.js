/* =========================================================
   SECONDARY PAGE SCRIPT  (secondary.js)
   Mobile menu, scroll reveal, photo carousel (Section 11),
   FAQ accordion (Section 13), enquiry form (Section 12),
   enquiry buttons, newsletter and footer year.
   ========================================================= */

/* ---------- 0. SETTINGS YOU CAN EDIT ---------- */
// Enquiry form: paste the URL of your form service here (a link that accepts a POST request).
// While this is empty, the form will NOT pretend that an enquiry was sent.
const ENQUIRY_ENDPOINT = '';

// Newsletter (footer): same idea. Leave empty until you connect a service.
const NEWSLETTER_ENDPOINT = '';

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

/* ---------- 4. PHOTO CAROUSEL (SECTION 7) ----------
   Shows 1, 2 or 3 photos at a time depending on screen width.
   Arrows, dots, keyboard (left/right), swipe, and an optional slideshow
   that pauses on hover/focus and never starts for reduced-motion users. */
function initCarousel() {
  const root = $('#secondary-carousel');
  if (!root) return;

  const track = $('.carousel__track', root);
  const slides = $$('.carousel__slide', root);
  const prev = $('.carousel__btn--prev', root);
  const next = $('.carousel__btn--next', root);
  const dotsWrap = $('.carousel__dots', root);
  const toggle = $('.carousel__toggle', root);
  const toggleText = $('.carousel__toggle-text', root);
  const toggleIcon = $('.carousel__toggle-icon use', root);
  const status = $('#carousel-status');
  if (!track || !slides.length) return;

  let index = 0;
  let perView = 1;
  let timer = null;
  let userPaused = prefersReducedMotion(); // reduced motion: slideshow starts paused
  let hoverPaused = false;

  const getPerView = () => (window.innerWidth >= 1000 ? 3 : window.innerWidth >= 640 ? 2 : 1);
  const maxIndex = () => Math.max(0, slides.length - perView);

  function buildDots() {
    dotsWrap.textContent = '';
    for (let i = 0; i <= maxIndex(); i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', perView === 1 ? `Go to photo ${i + 1}` : `Show photos ${i + 1} to ${i + perView}`);
      dot.addEventListener('click', () => { go(i, true); });
      dotsWrap.appendChild(dot);
    }
  }

  function render(announce) {
    const step = slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0;
    track.style.transform = `translateX(${-index * step}px)`;
    $$('.carousel__dot', root).forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', String(i < index || i >= index + perView));
    });
    if (announce && status) {
      status.textContent = perView === 1
        ? `Showing photo ${index + 1} of ${slides.length}.`
        : `Showing photos ${index + 1} to ${index + perView} of ${slides.length}.`;
    }
  }

  function go(target, announce) {
    const max = maxIndex();
    index = target > max ? 0 : target < 0 ? max : target; // wraps around
    render(announce);
    if (announce) restart();
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() {
    stop();
    if (userPaused || hoverPaused || slides.length <= perView) return;
    timer = setInterval(() => { if (document.visibilityState === 'visible') go(index + 1, false); }, 5000);
  }
  function restart() { start(); }

  function syncToggle() {
    const playing = !userPaused;
    toggle.setAttribute('aria-pressed', String(!playing));
    toggleText.textContent = playing ? 'Pause slideshow' : 'Play slideshow';
    if (toggleIcon) toggleIcon.setAttribute('href', playing ? '#icon-pause' : '#icon-play');
  }

  function layout() {
    const newPer = getPerView();
    if (newPer !== perView || !dotsWrap.children.length) {
      perView = newPer;
      root.style.setProperty('--per-view', String(perView));
      index = Math.min(index, maxIndex());
      buildDots();
    }
    render(false);
  }

  prev.addEventListener('click', () => go(index - 1, true));
  next.addEventListener('click', () => go(index + 1, true));

  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    syncToggle();
    if (status) status.textContent = userPaused ? 'Slideshow paused.' : 'Slideshow playing.';
    start();
  });

  root.addEventListener('mouseenter', () => { hoverPaused = true; stop(); });
  root.addEventListener('mouseleave', () => { hoverPaused = false; start(); });
  root.addEventListener('focusin', () => { hoverPaused = true; stop(); });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) { hoverPaused = false; start(); }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1, true); }
    if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1, true); }
  });

  // Swipe on touch screens
  let startX = null;
  track.addEventListener('pointerdown', (event) => { startX = event.clientX; });
  track.addEventListener('pointerup', (event) => {
    if (startX === null) return;
    const dx = event.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1), true);
  });
  track.addEventListener('pointercancel', () => { startX = null; });

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 120); });

  syncToggle();
  layout();
  start();
}

/* ---------- 5. ENQUIRY FORM (SECTION 8) ----------
   Checks every field and shows clear messages. It only says "sent" if
   ENQUIRY_ENDPOINT (top of this file) is set AND the service replies OK. */
const PHONE_PATTERN = /^[+()\d][\d\s().-]{5,}$/;

function initEnquiryForm() {
  const form = $('#enquiry-form');
  const status = $('#enquiry-status');
  if (!form || !status) return;

  const fields = {
    name: { el: $('#f-name'), err: $('#f-name-err') },
    email: { el: $('#f-email'), err: $('#f-email-err') },
    phone: { el: $('#f-phone'), err: $('#f-phone-err') },
    consent: { el: $('#f-consent'), err: $('#f-consent-err') }
  };

  const setStatus = (message, type) => {
    status.textContent = message;
    status.className = 'form-status' + (type ? ' is-' + type : '');
  };
  const setError = (key, message) => {
    const { el, err } = fields[key];
    err.textContent = message;
    if (message) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  };

  const validators = {
    name: () => (fields.name.el.value.trim().length < 2 ? 'Please enter your name.' : ''),
    email: () => {
      const v = fields.email.el.value.trim();
      if (!v) return 'Please enter your email address.';
      return EMAIL_PATTERN.test(v) ? '' : 'That email address does not look right.';
    },
    phone: () => {
      const v = fields.phone.el.value.trim();
      return !v || PHONE_PATTERN.test(v) ? '' : 'Please enter a valid phone number, or leave this blank.';
    },
    consent: () => (fields.consent.el.checked ? '' : 'Please tick the box so we can contact you.')
  };

  Object.keys(fields).forEach((key) => {
    const { el } = fields[key];
    el.addEventListener(key === 'consent' ? 'change' : 'input', () => {
      if (el.hasAttribute('aria-invalid')) setError(key, validators[key]());
    });
    el.addEventListener('blur', () => { if (key !== 'consent' && el.value.trim()) setError(key, validators[key]()); });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('', '');

    let firstBad = null;
    Object.keys(fields).forEach((key) => {
      const message = validators[key]();
      setError(key, message);
      if (message && !firstBad) firstBad = fields[key].el;
    });
    if (firstBad) {
      setStatus('Please fix the highlighted fields and try again.', 'error');
      firstBad.focus();
      return;
    }

    // No service connected yet: be honest, do not claim the enquiry was sent.
    if (!ENQUIRY_ENDPOINT) {
      setStatus('Thank you. Your details look complete, but this form is not connected to the school\'s inbox yet, so nothing was sent. Please call or email the school using the details below.', 'info');
      return;
    }

    const button = $('button[type="submit"]', form);
    button.disabled = true;
    setStatus('Sending…', 'info');
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(ENQUIRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Request failed');
      setStatus('Thank you! Your enquiry has been sent. The school will be in touch soon.', 'success');
      form.reset();
    } catch (error) {
      setStatus('Sorry, we could not send your enquiry right now. Please try again later or contact the school directly.', 'error');
    } finally {
      button.disabled = false;
    }
  });
}

/* ---------- 6. ENQUIRY BUTTONS ----------
   Buttons with data-intent jump to the form and pre-select what the visitor wants. */
function initIntentButtons() {
  const select = $('#f-intent');
  const firstField = $('#f-name');
  if (!select) return;
  const labels = { admission: 'Ask about admission', visit: 'Arrange a school visit' };

  $$('[data-intent]').forEach((link) => {
    link.addEventListener('click', () => {
      const label = labels[link.dataset.intent];
      if (label) select.value = label;
      if (link.dataset.class) { const cls = $('#f-class'); if (cls) cls.value = link.dataset.class; }
      if (firstField) setTimeout(() => firstField.focus({ preventScroll: true }), prefersReducedMotion() ? 50 : 700);
    });
  });
}

/* ---------- 7. FAQ ACCORDION (SECTION 12) ----------
   Each question is a real <button> with aria-expanded / aria-controls.
   Enter and Space work natively; Up/Down/Home/End move between questions.
   One answer opens at a time. */
function initFaq() {
  const list = $('#faq-list');
  if (!list) return;
  const buttons = $$('.faq-item__btn', list);

  function setOpen(btn, open) {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      buttons.forEach((other) => setOpen(other, false));
      setOpen(btn, willOpen);
    });
    btn.addEventListener('keydown', (event) => {
      const i = buttons.indexOf(btn);
      let target = null;
      if (event.key === 'ArrowDown') target = buttons[(i + 1) % buttons.length];
      else if (event.key === 'ArrowUp') target = buttons[(i - 1 + buttons.length) % buttons.length];
      else if (event.key === 'Home') target = buttons[0];
      else if (event.key === 'End') target = buttons[buttons.length - 1];
      if (target) { event.preventDefault(); target.focus(); }
    });
  });
}

/* ---------- 7. NEWSLETTER FORM (SECTION 10) ----------
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

/* ---------- FOOTER YEAR ---------- */
function initFooterYear() {
  const year = $('#footer-year');
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- START EVERYTHING ---------- */
function init() {
  initMobileMenu();
  initScrollReveal();
  initCarousel();
  initFaq();
  initEnquiryForm();
  initIntentButtons();
  initNewsletter();
  initFooterYear();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
