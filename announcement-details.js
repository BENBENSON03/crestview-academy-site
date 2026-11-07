/* =========================================================
   ANNOUNCEMENT DETAILS SCRIPT  (announcement-details.js)
   One page for every announcement. Reads  ?id=...  from the address and shows
   the matching item from announcements-data.js (loaded first).
   ========================================================= */

/* ---------- 0. SETTINGS YOU CAN EDIT ---------- */
// Footer newsletter: paste the URL of your form service here. While empty, nothing is claimed as sent.
const NEWSLETTER_ENDPOINT = '';

/* ---------- 1. SMALL HELPERS ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG_NS = 'http://www.w3.org/2000/svg';

// Lets the CSS know scripts are running (so reveal animations only hide things when they can reveal them)
document.documentElement.classList.add('js');

// Small helper that builds an element: el('p', 'class-name', 'text')
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#icon-' + name);
  svg.appendChild(use);
  return svg;
}

/* ---------- DATA HELPERS (shared by both announcement pages) ---------- */
const STATE_KEY = 'crestview-announcement-query';
const formatDate = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthKey = (iso) => iso.slice(0, 7);
const monthLabel = (key) => new Date(key + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const categoryClass = (name) => 'cat--' + (ANNOUNCEMENT_CATEGORIES.indexOf(name) + 1);
const detailUrl = (id) => 'announcement-details.html?id=' + encodeURIComponent(id);
const byNewest = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1));
const categoryIcon = { 'General Notices': 'bell', 'Academic Updates': 'book', 'Examinations': 'pencil', 'Admissions': 'cap', 'Events and Activities': 'star', 'Holidays and School Closures': 'sun', 'Parent Information': 'users' };
function categoryPill(name) { return el('span', 'cat ' + categoryClass(name), name); }

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

/* ---------- 4. DETAILS VIEW ---------- */
function backUrl() {
  let query = '';
  try { query = sessionStorage.getItem(STATE_KEY) || ''; } catch (e) { /* ignore */ }
  return 'announcements.html' + (query ? '?' + query : '');
}

function currentId() {
  try { return new URLSearchParams(window.location.search).get('id') || ''; } catch (e) { return ''; }
}

function backButton() {
  const a = el('a', 'btn btn--blue');
  a.href = backUrl();
  a.setAttribute('data-back', '');
  a.append(icon('chevron-left'), document.createTextNode('Back to All Announcements'));
  return a;
}

function showAnnouncement(id) {
  const a = ANNOUNCEMENTS.find((x) => x.id === id);
  const title = $('#detail-title');
  const article = $('#detail-article');
  const meta = $('#detail-meta');
  const flagSlot = $('#detail-flag');
  const related = $('#related');
  article.textContent = ''; meta.textContent = ''; flagSlot.textContent = '';
  $$('a[data-back]').forEach((link) => { link.href = backUrl(); });

  if (!a) {
    title.textContent = 'Announcement not found';
    $('#crumb-current').textContent = 'Not found';
    document.title = 'Announcement not found | Crestview Academy';
    related.hidden = true;
    const box = el('div', 'detail-missing');
    box.append(el('h2', '', 'We could not find that announcement.'), el('p', '', 'It may have been removed, or the link may be incorrect.'));
    const actions = el('div', 'detail__actions'); actions.appendChild(backButton()); box.appendChild(actions);
    article.appendChild(box);
    return;
  }

  document.title = a.title + ' | Crestview Academy';
  title.textContent = a.title;
  $('#crumb-current').textContent = a.title;
  if (a.important) { const f = el('span', 'flag'); f.append(icon('alert'), document.createTextNode('Important Notice')); flagSlot.appendChild(f); }
  meta.appendChild(categoryPill(a.category));
  const time = el('time', '', formatDate(a.date)); time.setAttribute('datetime', a.date);
  meta.appendChild(time);
  if (a.sample) meta.appendChild(el('span', 'sample-badge', 'Sample'));
  if (a.important && a.importantReason) meta.appendChild(el('span', '', a.importantReason));

  if (a.image) {
    const img = el('img', 'detail__img');
    img.src = announcementImage(a.image, 1200); img.alt = a.imageAlt || ''; img.width = 1200; img.height = 675;
    article.appendChild(img);
  }
  if (a.sample) {
    const note = el('p', 'detail__notice');
    note.append(icon('alert'), el('span', '', SAMPLE_NOTE));
    article.appendChild(note);
  }
  const body = el('div', 'detail__body');
  a.content.forEach((text) => body.appendChild(el('p', '', text)));
  article.appendChild(body);

  const docs = (a.documents || []).filter((d) => d && d.url);
  if (docs.length) {
    const box = el('div', 'detail__docs');
    box.appendChild(el('h2', '', 'Documents'));
    docs.forEach((d) => {
      const link = el('a'); link.href = d.url; link.setAttribute('download', '');
      link.append(icon('file'), document.createTextNode(d.label || 'Download'));
      box.appendChild(link);
    });
    article.appendChild(box);
  }
  const actions = el('div', 'detail__actions'); actions.appendChild(backButton());
  article.appendChild(actions);

  // Related: same category first, then the newest others (max 3)
  const others = ANNOUNCEMENTS.filter((x) => x.id !== a.id).sort(byNewest);
  const picks = others.filter((x) => x.category === a.category).concat(others.filter((x) => x.category !== a.category)).slice(0, 3);
  const list = $('#related-list');
  list.textContent = '';
  picks.forEach((x) => {
    const li = el('li');
    const link = el('a', 'related__item'); link.href = detailUrl(x.id);
    const t = el('time', '', formatDate(x.date)); t.setAttribute('datetime', x.date);
    link.append(categoryPill(x.category), t, el('strong', '', x.title));
    li.appendChild(link);
    list.appendChild(li);
  });
  related.hidden = picks.length === 0;
}

function initDetails() {
  if (!$('#detail-article') || typeof ANNOUNCEMENTS === 'undefined') return;
  showAnnouncement(currentId());
  // When this page is shown inside the single-file build, the id arrives as a message instead of an address.
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'ann-show') { showAnnouncement(e.data.id || ''); window.scrollTo(0, 0); }
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
  initDetails();
  initScrollReveal();
  initNewsletter();
  initFooterYear();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
