/* =========================================================
   LIBRARY PAGE SCRIPT  (library.js)
   Mobile menu, scroll reveal, sample book shelf with search and
   filters (Section 4), digital library status (Section 6),
   photo carousel (Section 11), FAQ accordion (Section 12),
   newsletter and footer year.
   ========================================================= */

/* ---------- 0. SETTINGS YOU CAN EDIT ---------- */
// Digital library: paste the real web address here ONLY when the school has one.
// While this is empty, the page says honestly that no digital library is set up yet.
const DIGITAL_LIBRARY_URL = '';

// Newsletter (footer): paste the URL of your form service here. While empty, nothing is claimed as sent.
const NEWSLETTER_ENDPOINT = '';

// SAMPLE BOOKS (Section 4). These are invented placeholders so the search and filters can be tried.
// Replace this list with the library's real catalogue. "cover" picks a colour (blue, navy, green, teal, purple, rust).
const BOOK_CATEGORIES = ['Nursery Reading', 'Primary Reading', 'Secondary Reading', 'Science and Technology', 'History and Culture', 'Fiction and Literature'];
const BOOKS = [
  { title: 'The Little Lantern',        author: 'Sample Author A', category: 'Nursery Reading',        cover: 'rust',   icon: 'heart' },
  { title: 'Moon and the Sleepy Fox',   author: 'Sample Author B', category: 'Nursery Reading',        cover: 'purple', icon: 'star' },
  { title: 'Adventures at Riverside',   author: 'Sample Author C', category: 'Primary Reading',        cover: 'green',  icon: 'book' },
  { title: 'The Clever Tortoise',       author: 'Sample Author D', category: 'Primary Reading',        cover: 'blue',   icon: 'bulb' },
  { title: 'Voices of the Future',      author: 'Sample Author E', category: 'Secondary Reading',      cover: 'navy',   icon: 'cap' },
  { title: 'A Guide to Better Essays',  author: 'Sample Author F', category: 'Secondary Reading',      cover: 'teal',   icon: 'pencil' },
  { title: 'How Machines Work',         author: 'Sample Author G', category: 'Science and Technology', cover: 'teal',   icon: 'atom' },
  { title: 'The Curious Chemist',       author: 'Sample Author H', category: 'Science and Technology', cover: 'green',  icon: 'flask' },
  { title: 'Journeys Through Time',     author: 'Sample Author I', category: 'History and Culture',    cover: 'rust',   icon: 'globe' },
  { title: 'Stories of Our Heritage',   author: 'Sample Author J', category: 'History and Culture',    cover: 'navy',   icon: 'building' },
  { title: 'The Midnight Garden',       author: 'Sample Author K', category: 'Fiction and Literature', cover: 'purple', icon: 'leaf' },
  { title: 'Poems for Every Season',    author: 'Sample Author L', category: 'Fiction and Literature', cover: 'blue',   icon: 'sun' }
];

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

/* ---------- 4. SAMPLE BOOK SHELF (SECTION 4) ----------
   Builds the book cards and category chips from BOOKS, then filters as the
   visitor types or picks a category. Announces the result count for screen readers. */
function initCatalogue() {
  const grid = $('#book-grid');
  const chipRow = $('#chip-row');
  const input = $('#book-search');
  const clear = $('#book-search-clear');
  const count = $('#book-count');
  const empty = $('#book-empty');
  const form = $('#book-search-form');
  if (!grid || !chipRow || !input) return;

  let activeCategory = 'All';
  const SVG = 'http://www.w3.org/2000/svg';

  function makeIcon(name) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG, 'use');
    use.setAttribute('href', '#icon-' + name);
    svg.appendChild(use);
    return svg;
  }

  function makeCard(book) {
    const li = document.createElement('li');
    li.className = 'book';
    li.dataset.category = book.category;
    li.dataset.search = (book.title + ' ' + book.author + ' ' + book.category).toLowerCase();

    const cover = document.createElement('div');
    cover.className = 'book__cover cover--' + book.cover;
    cover.setAttribute('aria-hidden', 'true');
    cover.appendChild(makeIcon(book.icon));
    const coverTitle = document.createElement('span');
    coverTitle.className = 'book__cover-title';
    coverTitle.textContent = book.title;
    cover.appendChild(coverTitle);
    const ribbon = document.createElement('span');
    ribbon.className = 'book__ribbon';
    ribbon.textContent = 'SAMPLE';
    cover.appendChild(ribbon);

    const meta = document.createElement('div');
    meta.className = 'book__meta';
    const title = document.createElement('h3');
    title.className = 'book__title';
    title.textContent = book.title;
    const author = document.createElement('p');
    author.className = 'book__author';
    author.textContent = 'by ' + book.author + ' (sample)';
    const tag = document.createElement('span');
    tag.className = 'book__tag';
    tag.textContent = book.category;
    meta.append(title, author, tag);

    li.append(cover, meta);
    return li;
  }

  const cards = BOOKS.map(makeCard);
  cards.forEach((card) => grid.appendChild(card));

  // Category chips
  ['All'].concat(BOOK_CATEGORIES).forEach((name) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (name === 'All' ? ' is-active' : '');
    chip.textContent = name;
    chip.setAttribute('aria-pressed', String(name === 'All'));
    chip.addEventListener('click', () => {
      activeCategory = name;
      $$('.chip', chipRow).forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      apply();
    });
    chipRow.appendChild(chip);
  });

  function apply() {
    const query = input.value.trim().toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const inCategory = activeCategory === 'All' || card.dataset.category === activeCategory;
      const matches = words.every((w) => card.dataset.search.includes(w));
      const visible = inCategory && matches;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    clear.hidden = input.value === '';
    empty.hidden = shown !== 0;
    grid.hidden = shown === 0;
    count.textContent = shown === 0
      ? 'No sample books found.'
      : 'Showing ' + shown + ' of ' + cards.length + ' sample book' + (cards.length === 1 ? '' : 's') + '.';
  }

  input.addEventListener('input', apply);
  clear.addEventListener('click', () => { input.value = ''; apply(); input.focus(); });
  form.addEventListener('submit', (event) => event.preventDefault());
  input.addEventListener('keydown', (event) => { if (event.key === 'Escape' && input.value) { input.value = ''; apply(); } });
  apply();
}

/* ---------- 6. DIGITAL LIBRARY (SECTION 6) ----------
   Only shows the "Explore Digital Resources" button when DIGITAL_LIBRARY_URL is a real web address.
   Otherwise it keeps the honest "not set up yet" notice. */
function initDigital() {
  const button = $('#digital-btn');
  const status = $('#digital-status');
  if (!button || !status) return;
  let ok = false;
  try { ok = /^https?:$/.test(new URL(DIGITAL_LIBRARY_URL).protocol); } catch (e) { ok = false; }
  if (ok) {
    button.href = DIGITAL_LIBRARY_URL;
    button.hidden = false;
    status.hidden = true;
  }
}

/* ---------- 4. PHOTO CAROUSEL (SECTION 11) ----------
   Shows 1, 2 or 3 photos at a time depending on screen width.
   Arrows, dots, keyboard (left/right), swipe, and an optional slideshow
   that pauses on hover/focus and never starts for reduced-motion users. */
function initCarousel() {
  const root = $('#library-carousel');
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

/* ---------- 8. NEWSLETTER FORM (FOOTER) ----------
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
  initCatalogue();
  initDigital();
  initCarousel();
  initFaq();
  initNewsletter();
  initFooterYear();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
