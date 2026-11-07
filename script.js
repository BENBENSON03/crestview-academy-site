/* ==========================================================================
   CRESTVIEW ACADEMY – HOMEPAGE SCRIPT
   Blocks (search for these headings):
     1. SETTINGS YOU MAY WANT TO EDIT
     2. NAVBAR AND MOBILE NAVIGATION
     3. MEGA MENU INTERACTIONS
     4. HERO VIDEO MODAL
     5. CAROUSEL NAVIGATION
     6. CAROUSEL AUTOPLAY
     7. ACCESSIBILITY AND INTERACTION HELPERS (includes the scroll-reveal animation for Sections 5–11)
   Also below: SECTION 12: CONTACT FORM FUNCTIONALITY and SECTION 13: NEWSLETTER SUBSCRIPTION.
   Everything starts from one place: the init() call at the bottom.
   ========================================================================== */
'use strict';

// Tells the CSS that JavaScript is running, so scroll-reveal elements may start hidden
document.documentElement.classList.add('js');


/* ==========================================================================
   1. SETTINGS YOU MAY WANT TO EDIT
   ========================================================================== */

// Paste your school video's EMBED link here (for example a YouTube link that looks like
// "https://www.youtube.com/embed/VIDEO_ID"). Leave it empty to show the placeholder.
const VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/MlNNGeusB7M?rel=0';

// How long each carousel slide stays on screen (milliseconds).
const CAROUSEL_AUTOPLAY_DELAY = 5000;

// How long the carousel slide animation takes. Keep in sync with the CSS (0.65s).
const CAROUSEL_TRANSITION_MS = 650;

// WHERE THE FORMS SEND THEIR DATA ---------------------------------------------------
// This page has no backend, so nothing can be delivered until you connect a service.
// Paste the web address your service gives you (for example a Formspree, Getform or
// your own server URL) between the quotes. While these are empty, the forms still
// check the input, but they will honestly say that nothing was sent.
const CONTACT_FORM_ENDPOINT = '';      // e.g. 'https://formspree.io/f/your-form-id'
const NEWSLETTER_ENDPOINT = '';        // e.g. 'https://formspree.io/f/your-newsletter-id'


/* ==========================================================================
   Tiny helpers (shorter versions of document.querySelector)
   ========================================================================== */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

// True when the visitor asked their device for less motion
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Elements that can receive keyboard focus (used by the focus traps below)
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

// Shared by the mega menu and the video modal: lock/unlock page scrolling
function lockPageScroll(shouldLock) {
  document.documentElement.classList.toggle('is-locked', shouldLock);
}


/* ==========================================================================
   2. NAVBAR AND MOBILE NAVIGATION
   ========================================================================== */

// Adds a soft shadow under the navbar once the page has been scrolled
function initNavbarScrollShadow() {
  const navbar = $('.navbar');
  if (!navbar) return;

  const update = () => navbar.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}


/* ==========================================================================
   3. MEGA MENU INTERACTIONS
   ========================================================================== */
function initMegaMenu() {
  const toggleButton = $('#menu-toggle');
  const menuLayer = $('#mega');
  const panel = $('#mega-menu');
  const overlay = $('#mega-overlay');
  const closeButton = $('#mega-close');
  const tabs = $$('.mega-tab');
  const tabPanels = $$('.mega-panel');
  if (!toggleButton || !menuLayer || !panel) return;

  let isOpen = false;

  // --- Open / close -------------------------------------------------------
  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    menuLayer.classList.add('is-open');
    panel.removeAttribute('inert');           // makes the panel focusable again
    panel.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
    toggleButton.setAttribute('aria-label', 'Close menu');
    lockPageScroll(true);
    closeButton.focus({ preventScroll: true }); // keyboard users land inside the panel
  }

  function closeMenu({ returnFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    menuLayer.classList.remove('is-open');
    panel.setAttribute('inert', '');          // hides it from Tab and screen readers while parked off-screen
    panel.setAttribute('aria-hidden', 'true');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-label', 'Open menu');
    lockPageScroll(false);
    if (returnFocus) toggleButton.focus({ preventScroll: true });
  }

  toggleButton.addEventListener('click', () => (isOpen ? closeMenu() : openMenu()));
  closeButton.addEventListener('click', () => closeMenu());
  overlay.addEventListener('click', () => closeMenu());

  // Clicking any link inside the panel closes it (the page then jumps to that link's target)
  $$('a', panel).forEach((link) => link.addEventListener('click', () => closeMenu({ returnFocus: false })));

  // Closing with the Escape key + keeping Tab focus inside the open panel
  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      closeMenu();
      return;
    }
    if (event.key === 'Tab') trapFocus(event, panel);
  });

  // If the window grows past the mobile layout, nothing needs resetting – but make sure scroll is never left locked
  window.addEventListener('resize', () => { if (!isOpen) lockPageScroll(false); });

  // --- Category tabs ------------------------------------------------------
  function selectTab(tab, { moveFocus = false } = {}) {
    tabs.forEach((item) => {
      const isSelected = item === tab;
      item.classList.toggle('is-active', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
      item.tabIndex = isSelected ? 0 : -1;   // only the selected tab is in the Tab order (arrow keys move between them)
    });

    // Show the matching panel (the CSS animation replays because the panel is re-displayed)
    tabPanels.forEach((tabPanel) => {
      tabPanel.hidden = tabPanel.id !== tab.getAttribute('aria-controls');
    });

    if (moveFocus) tab.focus();
    // Keep the chosen pill visible in the horizontally scrolling strip on small screens
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));

    // Arrow-key navigation, the standard pattern for tab lists
    tab.addEventListener('keydown', (event) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      let nextIndex = null;

      if (event.key in keys) nextIndex = (index + keys[event.key] + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        selectTab(tabs[nextIndex], { moveFocus: true });
      }
    });
  });
}

// Keeps keyboard focus cycling inside `container` (used while a dialog-like layer is open)
function trapFocus(event, container) {
  const focusable = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}


/* ==========================================================================
   4. HERO VIDEO MODAL
   Uses the browser's built-in <dialog>: it already handles the Escape key,
   focus trapping and the dimmed backdrop for us.
   ========================================================================== */
function initVideoModal() {
  const openButton = $('#video-open');
  const modal = $('#video-modal');
  const closeButton = $('#video-close');
  const stage = $('#video-stage');
  if (!openButton || !modal || !stage) return;

  const placeholderMarkup = stage.innerHTML;   // remember the placeholder so we can restore it

  function openModal() {
    // Only add a real video when a link has been provided
    if (VIDEO_EMBED_URL) {
      const frame = document.createElement('iframe');
      frame.src = VIDEO_EMBED_URL + (VIDEO_EMBED_URL.includes('?') ? '&' : '?') + 'autoplay=1';
      frame.title = 'Crestview Academy introduction video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';  // YouTube needs this to play embedded videos
      stage.replaceChildren(frame);
    }
    modal.showModal();
    lockPageScroll(true);
  }

  function closeModal() {
    modal.close();
  }

  // Runs for every way of closing (button, Escape key, backdrop click)
  modal.addEventListener('close', () => {
    stage.innerHTML = placeholderMarkup;   // removing the iframe also stops the video playing
    lockPageScroll(false);
    openButton.focus({ preventScroll: true });
  });

  openButton.addEventListener('click', openModal);
  closeButton.addEventListener('click', closeModal);

  // A click on the dimmed backdrop lands on the <dialog> element itself, so close then
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
}


/* ==========================================================================
   5. CAROUSEL NAVIGATION
   How it works:
   - The slides sit in a row. We add a copy of the LAST slide before the first one
     and a copy of the FIRST slide after the last one.
   - Going "next" from the last slide slides onto the copy of the first slide,
     then (after the animation) we silently jump to the real first slide.
     Nobody sees the jump, so the loop looks endless.
   - `position` counts the copies too (1 = first real slide), while
     `currentIndex` is the human-friendly 0-4 index used by the dots.
   ========================================================================== */
function initCarousel() {
  const root = $('[data-carousel]');
  if (!root) return;

  const track = $('.carousel__track', root);
  const dots = $$('.carousel__dot', root);
  const prevButton = $('#carousel-prev', root);
  const nextButton = $('#carousel-next', root);
  const viewport = $('.carousel__viewport', root);
  const realSlides = Array.from(track.children);
  const slideCount = realSlides.length;

  // Build the two loop copies and hide them from assistive technology
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[slideCount - 1].cloneNode(true);
  [firstClone, lastClone].forEach((clone) => {
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelector('img').loading = 'eager';
  });
  track.append(firstClone);
  track.prepend(lastClone);

  let position = 1;          // index including the clones
  let isAnimating = false;   // blocks clicks while a slide is mid-animation
  let finishTimer = null;

  const currentIndex = () => (position - 1 + slideCount) % slideCount;

  function render({ animate }) {
    track.classList.toggle('is-instant', !animate);
    root.style.setProperty('--slide-index', position);
    updateDots();
  }

  function updateDots() {
    dots.forEach((dot, i) => {
      const active = i === currentIndex();
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  // Called when a slide animation ends: if we are standing on a copy, jump to the real slide
  function finishMove() {
    clearTimeout(finishTimer);
    if (position === slideCount + 1) position = 1;
    if (position === 0) position = slideCount;
    render({ animate: false });
    void track.offsetWidth;            // forces the browser to apply the instant jump before animations return
    track.classList.remove('is-instant');
    isAnimating = false;
  }

  function moveTo(newPosition) {
    if (isAnimating) return;
    isAnimating = true;
    position = newPosition;
    render({ animate: true });

    // Fallback timer: also covers reduced-motion where no transition event fires
    clearTimeout(finishTimer);
    finishTimer = setTimeout(finishMove, prefersReducedMotion() ? 20 : CAROUSEL_TRANSITION_MS + 60);
  }

  const goNext = () => moveTo(position + 1);
  const goPrev = () => moveTo(position - 1);
  const goToIndex = (index) => {
    if (index === currentIndex()) return;
    moveTo(index + 1);
  };

  // Buttons and dots (a manual click restarts the autoplay timer)
  nextButton.addEventListener('click', () => { goNext(); autoplay.restart(); });
  prevButton.addEventListener('click', () => { goPrev(); autoplay.restart(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goToIndex(i); autoplay.restart(); }));

  // Keyboard: left/right arrows while focus is anywhere in the carousel
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { goNext(); autoplay.restart(); }
    if (event.key === 'ArrowLeft') { goPrev(); autoplay.restart(); }
  });

  // Touch / mouse swipe
  let swipeStartX = null;
  viewport.addEventListener('pointerdown', (event) => { swipeStartX = event.clientX; });
  viewport.addEventListener('pointerup', (event) => {
    if (swipeStartX === null) return;
    const distance = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(distance) < 50) return;     // too small = just a tap
    if (distance < 0) goNext(); else goPrev();
    autoplay.restart();
  });
  viewport.addEventListener('pointercancel', () => { swipeStartX = null; });

  // Start in the right place without animating, then hook up autoplay
  render({ animate: false });
  void track.offsetWidth;
  track.classList.remove('is-instant');

  const autoplay = createCarouselAutoplay(root, goNext);
  autoplay.start();
}


/* ==========================================================================
   6. CAROUSEL AUTOPLAY
   Plays automatically, but politely:
   - pauses while the mouse is over the carousel (only on devices that hover)
   - pauses while keyboard focus is inside it
   - pauses when the browser tab is hidden
   - the pause/play button lets people stop it for good
   - never starts for people who prefer reduced motion
   ========================================================================== */
function createCarouselAutoplay(root, onTick) {
  const toggleButton = $('#carousel-toggle', root);
  const track = $('.carousel__track', root);
  const canHover = window.matchMedia('(hover: hover)').matches;

  let timerId = null;
  let userPaused = prefersReducedMotion();   // reduced motion = start paused
  let hoverPaused = false;
  let focusPaused = false;
  let hiddenPaused = false;

  const shouldRun = () => !userPaused && !hoverPaused && !focusPaused && !hiddenPaused;

  function clear() {
    clearInterval(timerId);
    timerId = null;
  }

  function sync() {
    clear();
    if (shouldRun()) timerId = setInterval(onTick, CAROUSEL_AUTOPLAY_DELAY);
    // While sliding by itself the slides are not announced; when paused they are
    track.setAttribute('aria-live', shouldRun() ? 'off' : 'polite');
  }

  function updateToggleButton() {
    toggleButton.classList.toggle('is-paused', userPaused);
    toggleButton.setAttribute('aria-label', userPaused ? 'Start automatic slide show' : 'Pause automatic slide show');
  }

  if (canHover) {
    root.addEventListener('mouseenter', () => { hoverPaused = true; sync(); });
    root.addEventListener('mouseleave', () => { hoverPaused = false; sync(); });
  }
  root.addEventListener('focusin', () => { focusPaused = true; sync(); });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) { focusPaused = false; sync(); }
  });
  document.addEventListener('visibilitychange', () => { hiddenPaused = document.hidden; sync(); });

  toggleButton.addEventListener('click', () => {
    userPaused = !userPaused;
    updateToggleButton();
    sync();
  });

  updateToggleButton();

  return {
    start: sync,
    restart: sync,   // sync() clears the old interval and starts a fresh countdown
  };
}


/* ==========================================================================
   7. ACCESSIBILITY AND INTERACTION HELPERS
   ========================================================================== */

// Small message bar at the bottom of the screen
let toastTimer = null;
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

// Links that point to pages/sections which are not built yet (for example #about)
// would do nothing when clicked. Instead we tell the visitor, so nothing feels broken.
// Once you add a section with a matching id, the link scrolls to it automatically.
function initInternalLinks() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (hash === '#') { event.preventDefault(); return; }

    if (!document.getElementById(hash.slice(1))) {
      event.preventDefault();
      showToast(`“${link.textContent.trim()}” will open in the next stage of the build.`);
    }
  });
}

// Marks the matching main-menu item as active when a section with that id is on screen.
// Only "Home" exists for now, so it stays active; this is ready for the next sections.
function initActiveNavHighlight() {
  const links = $$('.main-nav__link[href]');
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (sections.length < 2 || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('is-active', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));
}


// Fades sections in as they scroll into view (Sections 5–11).
// Elements with the class "reveal" start hidden (see the CSS); we add "is-visible" once on screen.
function initScrollReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  // Older browsers or reduced motion: just show everything straight away
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);   // animate only once
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((item) => observer.observe(item));
}

// ==========================================================================
// SECTION 12: CONTACT FORM FUNCTIONALITY
// ==========================================================================

// Shared validation rules. Each returns an error message, or '' when the value is fine.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validators = {
  name: (value) => {
    if (!value) return 'Please enter your full name.';
    if (value.length < 2) return 'Your name looks too short.';
    return '';
  },
  email: (value) => {
    if (!value) return 'Please enter your email address.';
    if (!EMAIL_PATTERN.test(value)) return 'Please enter a valid email address, like name@example.com.';
    return '';
  },
  phone: (value) => {
    if (!value) return '';   // optional field
    if (!/^\+?[\d\s()\-]{7,20}$/.test(value)) return 'Please enter a valid phone number, or leave it empty.';
    return '';
  },
  subject: (value) => (value ? '' : 'Please choose what your enquiry is about.'),
  message: (value) => {
    if (!value) return 'Please write your message.';
    if (value.length < 10) return 'Please write a little more (at least 10 characters).';
    return '';
  },
};

// Shows or clears the error under one field and tells assistive technology about it
function setFieldError(field, message) {
  const error = document.getElementById(field.getAttribute('aria-describedby'));
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message;
}

// Validates a single field; returns true when it is valid
function validateField(field) {
  const rule = validators[field.name];
  const message = rule ? rule(field.value.trim()) : '';
  setFieldError(field, message);
  return !message;
}

// Shows a message box under a form. type = 'info' | 'success' | 'error'
function showFormStatus(box, type, message) {
  const dark = box.classList.contains('form-status--dark');
  box.className = `form-status form-status--${type}${dark ? ' form-status--dark' : ''}`;
  box.textContent = message;
  box.hidden = false;
}

// Sends the form data to the configured address. Resolves true only when the server says OK.
async function sendToEndpoint(url, form) {
  const response = await fetch(url, {
    method: 'POST',
    body: new FormData(form),
    headers: { Accept: 'application/json' },
  });
  return response.ok;
}

// Turns a button into a "busy" state while a request is running
function setButtonBusy(button, isBusy) {
  button.disabled = isBusy;
  button.classList.toggle('is-loading', isBusy);
  button.setAttribute('aria-busy', String(isBusy));
}

function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const fields = $$('.form-field__control', form);
  const submitButton = $('#contact-submit');
  const statusBox = $('#contact-status');

  // Check a field when the visitor leaves it; clear its error as soon as it becomes valid
  fields.forEach((field) => {
    field.addEventListener('blur', () => { if (field.value || field.getAttribute('aria-invalid') === 'true') validateField(field); });
    const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(eventName, () => { if (field.getAttribute('aria-invalid') === 'true') validateField(field); });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();             // we handle sending ourselves
    statusBox.hidden = true;

    // Validate every field (map + filter so ALL errors show, not just the first)
    const invalidFields = fields.filter((field) => !validateField(field));
    if (invalidFields.length) {
      invalidFields[0].focus();         // jump to the first problem
      showFormStatus(statusBox, 'error', 'Please fix the highlighted fields and try again.');
      return;
    }

    // No service connected: be honest, do not pretend the message was delivered
    if (!CONTACT_FORM_ENDPOINT) {
      showFormStatus(statusBox, 'info',
        'Thanks – your details look good, but this website is not connected to a message service yet, so nothing was sent. Please email or call us using the details on this page.');
      return;
    }

    setButtonBusy(submitButton, true);
    try {
      const accepted = await sendToEndpoint(CONTACT_FORM_ENDPOINT, form);
      if (accepted) {
        form.reset();
        fields.forEach((field) => setFieldError(field, ''));
        showFormStatus(statusBox, 'success', 'Thank you! Your message has been sent. Our team will get back to you soon.');
      } else {
        showFormStatus(statusBox, 'error', 'Sorry, we could not send your message. Please try again or contact us directly.');
      }
    } catch (error) {
      showFormStatus(statusBox, 'error', 'We could not reach the server. Please check your connection and try again.');
    } finally {
      setButtonBusy(submitButton, false);
    }
  });
}


// ==========================================================================
// SECTION 13: NEWSLETTER SUBSCRIPTION
// ==========================================================================
function initNewsletterForm() {
  const form = $('#newsletter-form');
  if (!form) return;

  const input = $('#newsletter-email', form);
  const errorBox = $('#newsletter-error', form);
  const submitButton = $('#newsletter-submit', form);
  const statusBox = $('#newsletter-status', form);

  function validateNewsletterEmail() {
    const value = input.value.trim();
    let message = '';
    if (!value) message = 'Please enter your email address.';
    else if (!EMAIL_PATTERN.test(value)) message = 'Please enter a valid email address.';

    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    errorBox.textContent = message;
    return !message;
  }

  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateNewsletterEmail(); });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusBox.hidden = true;

    if (!validateNewsletterEmail()) {
      input.focus();
      return;
    }

    // No service connected: say so honestly instead of claiming a subscription
    if (!NEWSLETTER_ENDPOINT) {
      showFormStatus(statusBox, 'info', 'Your email looks valid, but the newsletter is not connected to a subscription service yet, so you have not been subscribed.');
      return;
    }

    setButtonBusy(submitButton, true);
    try {
      const accepted = await sendToEndpoint(NEWSLETTER_ENDPOINT, form);
      if (accepted) {
        form.reset();
        showFormStatus(statusBox, 'success', 'Thank you for subscribing!');
      } else {
        showFormStatus(statusBox, 'error', 'Sorry, we could not subscribe you right now. Please try again later.');
      }
    } catch (error) {
      showFormStatus(statusBox, 'error', 'We could not reach the server. Please try again.');
    } finally {
      setButtonBusy(submitButton, false);
    }
  });
}

// Writes the current year into the copyright line (the HTML holds a fallback year)
function initFooterYear() {
  const yearElement = $('#footer-year');
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}


/* ==========================================================================
   START EVERYTHING
   ========================================================================== */
function init() {
  initNavbarScrollShadow();
  initMegaMenu();
  initVideoModal();
  initCarousel();
  initInternalLinks();
  initActiveNavHighlight();
  initScrollReveal();
  initContactForm();
  initNewsletterForm();
  initFooterYear();
}

// The script tag uses `defer`, so the HTML is ready; this guard is just extra safety
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
