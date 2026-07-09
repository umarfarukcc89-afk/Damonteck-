'use strict';

/**
 * Foundry & Co. — site scripts
 * Modules: theme toggle, mobile navigation, scroll reveal,
 * active nav highlighting, back-to-top, contact form validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileNav();
  initScrollReveal();
  initActiveNavHighlight();
  initBackToTop();
  initContactForm();
});

/* ---------- Theme toggle ---------- */
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const STORAGE_KEY = 'foundry-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggle.setAttribute('aria-pressed', 'true');
      toggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
      document.documentElement.removeAttribute('data-theme');
      toggle.setAttribute('aria-pressed', 'false');
      toggle.setAttribute('aria-label', 'Switch to dark theme');
    }
  };

  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    // Storage may be unavailable (private browsing); fall back to system preference.
  }

  applyTheme(stored || (prefersDark.matches ? 'dark' : 'light'));

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      // Ignore write failures silently; theme still applies for this session.
    }
  });
}

/* ---------- Mobile navigation ---------- */
function initMobileNav() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!menuToggle || !mobileNav) return;

  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    mobileNav.hidden = true;
  };

  const openMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    mobileNav.hidden = false;
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // Event delegation: close the menu whenever a link inside it is activated.
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ---------- Active nav link highlighting ---------- */
function initActiveNavHighlight() {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.primary-nav .nav-link');
  if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

  const linkFor = (id) => document.querySelector(`.primary-nav .nav-link[href="#${id}"]`);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = linkFor(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------- Back to top ---------- */
function initBackToTop() {
  const button = document.getElementById('back-to-top');
  if (!button) return;

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- Contact form validation ---------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('form-status');

  const validators = {
    name: (value) => (value.trim().length >= 2 ? '' : 'Enter your name.'),
    email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address.'),
    'project-type': (value) => (value ? '' : 'Select a project type.'),
    message: (value) => (value.trim().length >= 10 ? '' : 'Add a few details about the project (at least 10 characters).'),
  };

  const showError = (field, message) => {
    const row = field.closest('.form-row');
    const errorEl = row.querySelector('.field-error');
    if (message) {
      row.classList.add('has-error');
      errorEl.textContent = message;
    } else {
      row.classList.remove('has-error');
      errorEl.textContent = '';
    }
  };

  const validateField = (field) => {
    const validator = validators[field.name];
    if (!validator) return true;
    const message = validator(field.value);
    showError(field, message);
    return !message;
  };

  // Validate on blur for immediate, non-intrusive feedback.
  Object.keys(validators).forEach((name) => {
    const field = form.elements.namedItem(name);
    if (field) field.addEventListener('blur', () => validateField(field));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let isValid = true;
    Object.keys(validators).forEach((name) => {
      const field = form.elements.namedItem(name);
      if (field && !validateField(field)) isValid = false;
    });

    if (!isValid) {
      status.textContent = 'Please fix the highlighted fields before sending.';
      status.className = 'form-status error';
      const firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea');
      if (firstError) firstError.focus();
      return;
    }

    // No backend endpoint is configured in this build. Point the "action"
    // attribute (or wire a fetch() call here) to your own form handler
    // or a service such as your CRM's inbound webhook.
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    window.setTimeout(() => {
      status.textContent = 'Thanks — your project details have been sent. We\u2019ll reply within two working days.';
      status.className = 'form-status success';
      form.reset();
      submitButton.disabled = false;
    }, 500);
  });
}
