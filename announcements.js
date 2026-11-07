/* =========================================================
   ANNOUNCEMENTS PAGE SCRIPT  (announcements.js)
   Needs announcements-data.js (loaded first).
   Search, category filters, sorting, pagination, month archive,
   featured notice, events, key dates, newsletter, FAQ, menu.
   ========================================================= */

/* ---------- 0. SETTINGS YOU CAN EDIT ---------- */
// Newsletter: paste the URL of your form service here. While empty, nothing is claimed as sent.
const NEWSLETTER_ENDPOINT = '';
// How many announcements appear on each page of "Latest Announcements"
const PAGE_SIZE = 6;

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

/* ---------- 4. ANNOUNCEMENTS: STATE, FILTERING, RENDERING ----------
   One state object drives everything: category, search text, sort order, month (from the archive) and page.
   The state is kept in the address (?cat=...&q=...) and in sessionStorage so that the
   "back to all announcements" button on the details page returns to the same filters. */
const DEFAULT_STATE = { cat: 'All', q: '', sort: 'newest', month: '', page: 1 };
let state = Object.assign({}, DEFAULT_STATE);

function readState() {
  let params = new URLSearchParams();
  try { params = new URLSearchParams(window.location.search); } catch (e) { /* ignore */ }
  if (![...params.keys()].length) {
    try { params = new URLSearchParams(sessionStorage.getItem(STATE_KEY) || ''); } catch (e) { /* ignore */ }
  }
  const cat = params.get('cat');
  if (cat && ANNOUNCEMENT_CATEGORIES.indexOf(cat) !== -1) state.cat = cat;
  state.q = (params.get('q') || '').slice(0, 100);
  if (params.get('sort') === 'oldest') state.sort = 'oldest';
  if (/^\d{4}-\d{2}$/.test(params.get('month') || '')) state.month = params.get('month');
  const page = parseInt(params.get('page') || '1', 10);
  state.page = page > 0 ? page : 1;
}

function saveState() {
  const params = new URLSearchParams();
  if (state.cat !== 'All') params.set('cat', state.cat);
  if (state.q) params.set('q', state.q);
  if (state.sort !== 'newest') params.set('sort', state.sort);
  if (state.month) params.set('month', state.month);
  if (state.page > 1) params.set('page', String(state.page));
  const text = params.toString();
  try { sessionStorage.setItem(STATE_KEY, text); } catch (e) { /* ignore */ }
  try { window.history.replaceState(null, '', text ? '?' + text : window.location.pathname); } catch (e) { /* ignore: not allowed in some previews */ }
}

// Announcements that match the category and search (ignores month and page; used by the archive)
function matchingAnnouncements(includeMonth) {
  const words = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return ANNOUNCEMENTS.filter((a) => {
    if (state.cat !== 'All' && a.category !== state.cat) return false;
    if (includeMonth && state.month && monthKey(a.date) !== state.month) return false;
    const haystack = (a.title + ' ' + a.summary + ' ' + a.category).toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}
function sortedResults() {
  const list = matchingAnnouncements(true).sort(byNewest);
  return state.sort === 'oldest' ? list.reverse() : list;
}

function buildCard(a) {
  const li = el('li', 'ann-card ' + categoryClass(a.category));
  const media = el('div', 'ann-card__media');
  if (a.image) {
    const img = el('img');
    img.src = announcementImage(a.image, 700);
    img.alt = a.imageAlt || '';
    img.width = 700; img.height = 438; img.loading = 'lazy';
    media.appendChild(img);
  } else {
    const none = el('div', 'ann-card__noimg');
    none.setAttribute('aria-hidden', 'true');
    none.appendChild(icon(categoryIcon[a.category] || 'bell'));
    media.appendChild(none);
  }
  if (a.sample) media.appendChild(el('span', 'sample-badge', 'Sample'));
  if (a.important) { const f = el('span', 'flag'); f.append(icon('alert'), document.createTextNode('Important')); media.appendChild(f); }

  const body = el('div', 'ann-card__body');
  const meta = el('div', 'ann-card__meta');
  meta.appendChild(categoryPill(a.category));
  const time = el('time', '', formatDate(a.date));
  time.setAttribute('datetime', a.date);
  meta.appendChild(time);
  const title = el('h3', 'ann-card__title');
  const link = el('a', '', a.title);
  link.href = detailUrl(a.id);
  title.appendChild(link);
  const more = el('a', 'ann-more');
  more.href = detailUrl(a.id);
  more.append(document.createTextNode('Read More'), icon('arrow-right'));
  more.setAttribute('aria-label', 'Read more: ' + a.title);
  body.append(meta, title, el('p', 'ann-card__summary', a.summary), more);
  li.append(media, body);
  return li;
}

function renderFeatured() {
  const slot = $('#featured-slot');
  if (!slot) return;
  slot.textContent = '';
  const sorted = ANNOUNCEMENTS.slice().sort(byNewest);
  const important = sorted.find((a) => a.important);
  const a = important || sorted[0];
  if (!a) { slot.appendChild(el('p', 'ann-empty', 'No announcements have been added yet.')); return; }

  const card = el('article', 'featured' + (important ? '' : ' featured--plain'));
  card.setAttribute('aria-labelledby', 'featured-card-title');
  const media = el('div', 'featured__media');
  if (a.image) {
    const img = el('img'); img.src = announcementImage(a.image, 900); img.alt = a.imageAlt || ''; img.width = 900; img.height = 600;
    media.appendChild(img);
  }
  const body = el('div', 'featured__body');
  const flag = el('span', 'flag');
  flag.append(icon(important ? 'alert' : 'bell'), document.createTextNode(important ? 'Important Notice' : 'Latest Announcement'));
  body.appendChild(flag);
  if (important && a.importantReason) body.appendChild(el('p', 'featured__reason', a.importantReason));
  const meta = el('div', 'featured__meta');
  meta.appendChild(categoryPill(a.category));
  const time = el('time', '', formatDate(a.date)); time.setAttribute('datetime', a.date);
  meta.appendChild(time);
  if (a.sample) meta.appendChild(el('span', 'sample-badge', 'Sample'));
  const h = el('h3', 'featured__title', a.title); h.id = 'featured-card-title';
  const more = el('a', 'btn btn--blue');
  more.href = detailUrl(a.id);
  more.append(document.createTextNode('Read More'), icon('arrow-right'));
  more.setAttribute('aria-label', 'Read more: ' + a.title);
  body.append(meta, h, el('p', 'featured__summary', a.summary), more);
  card.append(media, body);
  slot.appendChild(card);
}

function renderChips() {
  const row = $('#chip-row');
  row.textContent = '';
  ['All'].concat(ANNOUNCEMENT_CATEGORIES).forEach((name) => {
    const chip = el('button', 'chip' + (state.cat === name ? ' is-active' : ''), name === 'All' ? 'All Announcements' : name);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(state.cat === name));
    chip.addEventListener('click', () => { state.cat = name; state.page = 1; update(); });
    row.appendChild(chip);
  });
}

function pageNumbers(total, current) {
  const pages = [];
  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '\u2026') pages.push('\u2026');
  }
  return pages;
}

function renderPager(totalPages) {
  const nav = $('#ann-pager');
  nav.textContent = '';
  if (totalPages <= 1) { nav.hidden = true; return; }
  nav.hidden = false;
  const make = (label, page, opts = {}) => {
    const b = el('button', '', label);
    b.type = 'button';
    if (opts.aria) b.setAttribute('aria-label', opts.aria);
    if (opts.current) b.setAttribute('aria-current', 'page');
    if (opts.disabled) b.disabled = true;
    b.addEventListener('click', () => { state.page = page; update(true); });
    return b;
  };
  nav.appendChild(make('\u2039 Prev', state.page - 1, { disabled: state.page === 1, aria: 'Previous page' }));
  pageNumbers(totalPages, state.page).forEach((p) => {
    if (p === '\u2026') nav.appendChild(el('span', '', '\u2026'));
    else nav.appendChild(make(String(p), p, { current: p === state.page, aria: 'Page ' + p }));
  });
  nav.appendChild(make('Next \u203a', state.page + 1, { disabled: state.page === totalPages, aria: 'Next page' }));
}

function renderList() {
  const results = sortedResults();
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * PAGE_SIZE;
  const grid = $('#ann-grid');
  grid.textContent = '';
  results.slice(start, start + PAGE_SIZE).forEach((a) => grid.appendChild(buildCard(a)));

  const empty = results.length === 0;
  grid.hidden = empty;
  $('#ann-empty').hidden = !empty;
  renderPager(empty ? 0 : totalPages);

  const count = $('#ann-count');
  count.textContent = '';
  if (empty) count.textContent = 'No announcements found.';
  else {
    const from = start + 1, to = Math.min(start + PAGE_SIZE, results.length);
    count.textContent = 'Showing ' + from + '\u2013' + to + ' of ' + results.length + ' announcement' + (results.length === 1 ? '' : 's') + (totalPages > 1 ? ' (page ' + state.page + ' of ' + totalPages + ')' : '') + '.';
  }
  if (state.month) {
    const tag = el('span', 'month-tag');
    tag.appendChild(document.createTextNode(monthLabel(state.month)));
    const x = el('button', '', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Remove month filter ' + monthLabel(state.month));
    x.addEventListener('click', () => { state.month = ''; state.page = 1; update(); });
    tag.appendChild(x);
    count.appendChild(tag);
  }
}

// SECTION 9: archive grouped by month. Follows the category and search, ignores sorting and page.
function renderArchive() {
  const wrap = $('#archive-list');
  wrap.textContent = '';
  const items = matchingAnnouncements(false).sort(byNewest);
  if (!items.length) { wrap.appendChild(el('p', 'ann-empty', 'No announcements found. Try another search or category.')); return; }
  const groups = {};
  items.forEach((a) => { (groups[monthKey(a.date)] = groups[monthKey(a.date)] || []).push(a); });
  Object.keys(groups).sort().reverse().forEach((key, i) => {
    const details = el('details', 'archive__group');
    if (i === 0 || state.month === key) details.open = true;
    const summary = el('summary');
    summary.appendChild(el('span', '', monthLabel(key)));
    summary.appendChild(el('span', 'archive__count', groups[key].length + (groups[key].length === 1 ? ' notice' : ' notices')));
    details.appendChild(summary);
    const list = el('div', 'archive__list');
    groups[key].forEach((a) => {
      const row = el('div', 'archive__row');
      const t = el('time', '', formatDate(a.date)); t.setAttribute('datetime', a.date);
      const link = el('a', '', a.title); link.href = detailUrl(a.id);
      row.append(t, categoryPill(a.category), link);
      list.appendChild(row);
    });
    const foot = el('div', 'archive__row');
    const show = el('button', 'archive__filter', 'Show ' + monthLabel(key) + ' in the list above');
    show.type = 'button';
    show.addEventListener('click', () => { state.month = key; state.page = 1; update(); const s = $('#latest'); if (s) s.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); });
    foot.appendChild(show);
    list.appendChild(foot);
    details.appendChild(list);
    wrap.appendChild(details);
  });
}

// SECTION 7: events (placeholders until the school confirms them)
function renderEvents() {
  const grid = $('#event-grid');
  if (!grid) return;
  grid.textContent = '';
  EVENTS.forEach((ev) => {
    const li = el('li', 'event');
    const date = el('div', 'event__date');
    date.appendChild(icon('calendar'));
    date.appendChild(el('span', '', ev.confirmed ? 'Date' : 'TBC'));
    const body = el('div');
    body.appendChild(categoryPill(ev.category));
    body.appendChild(el('h3', 'event__title', ev.title));
    const meta = el('ul', 'event__meta');
    [['Date', ev.date], ['Time', ev.time], ['Where', ev.location]].forEach(([k, v]) => {
      if (!v) return;
      const row = el('li');
      row.appendChild(el('strong', '', k));
      row.appendChild(el('span', /^\[/.test(v) ? 'ph' : '', v));
      meta.appendChild(row);
    });
    body.append(meta, el('p', '', ev.summary));
    if (!ev.confirmed) body.appendChild(el('span', 'event__tbc', 'Sample. Details to be confirmed by the school'));
    li.append(date, body);
    grid.appendChild(li);
  });
  const link = $('#events-link');
  if (link && typeof EVENTS_PAGE_URL === 'string' && EVENTS_PAGE_URL) link.href = EVENTS_PAGE_URL;
}

// SECTION 8: key dates
function renderDates() {
  const grid = $('#date-grid');
  if (!grid) return;
  grid.textContent = '';
  KEY_DATES.forEach((d) => {
    const li = el('li', 'date-card reveal');
    const ic = el('span', 'date-card__icon'); ic.appendChild(icon(d.icon));
    const text = el('div');
    text.append(el('h3', '', d.label), el('p', '', d.note));
    const date = el('p', 'date-card__date');
    date.appendChild(el('span', /^\[/.test(d.date) ? 'ph' : '', d.date));
    text.appendChild(date);
    li.append(ic, text);
    grid.appendChild(li);
  });
}

function syncControls() {
  $('#ann-search').value = state.q;
  $('#hero-search').value = state.q;
  $('#ann-sort').value = state.sort;
}

function update(scrollToList) {
  saveState();
  renderChips();
  renderList();
  renderArchive();
  syncControls();
  if (scrollToList) { const s = $('#latest'); if (s) s.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); }
}

function resetAll() {
  state = Object.assign({}, DEFAULT_STATE);
  update();
}

function initAnnouncements() {
  if (!$('#ann-grid') || typeof ANNOUNCEMENTS === 'undefined') return;
  readState();
  renderFeatured();
  renderEvents();
  renderDates();

  const onSearch = (event) => { state.q = event.target.value; state.page = 1; update(); };
  $('#ann-search').addEventListener('input', onSearch);
  $('#hero-search').addEventListener('input', onSearch);
  $('#ann-sort').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; update(); });
  $('#ann-reset').addEventListener('click', resetAll);
  $('#ann-empty-reset').addEventListener('click', resetAll);
  $('#ann-tools').addEventListener('submit', (e) => e.preventDefault());
  $('#hero-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = $('#hero-search').value; state.page = 1; update(true);
  });
  if (!ANNOUNCEMENTS.some((a) => a.sample)) { const n = $('#sample-note'); if (n) n.hidden = true; }
  update();
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

/* ---------- 9. SECTION 10 NEWSLETTER ----------
   Checks the email address. It only says "subscribed" if NEWSLETTER_ENDPOINT is set
   AND the service answers successfully. */

function initAnnNewsletter() {
  const form = $('#ann-news-form');
  const input = $('#ann-news-email');
  const status = $('#ann-news-status');
  const hint = $('#ann-news-hint');
  if (!form || !input || !status) return;
  if (NEWSLETTER_ENDPOINT && hint) hint.hidden = true;

  const show = (message, type) => { status.textContent = message; status.className = 'ann-news__status' + (type ? ' is-' + type : ''); };
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); show('', ''); });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    if (!email) { input.setAttribute('aria-invalid', 'true'); show('Please enter your email address.', 'error'); input.focus(); return; }
    if (!EMAIL_PATTERN.test(email)) { input.setAttribute('aria-invalid', 'true'); show('That email address does not look right. Please check it and try again.', 'error'); input.focus(); return; }
    if (!NEWSLETTER_ENDPOINT) { show('Thanks, but email updates are not connected yet, so nothing was sent and you are not subscribed.', 'info'); return; }
    const button = $('button[type="submit"]', form);
    button.disabled = true; show('Sending\u2026', 'info');
    try {
      const response = await fetch(NEWSLETTER_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error('Request failed');
      show('You are subscribed. Thank you!', 'success'); form.reset();
    } catch (error) { show('Sorry, we could not subscribe you right now. Please try again later.', 'error'); }
    finally { button.disabled = false; }
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
  initAnnouncements();
  initScrollReveal();
  initFaq();
  initAnnNewsletter();
  initNewsletter();
  initFooterYear();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
