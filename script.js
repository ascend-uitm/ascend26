const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-navigation]');
const header = document.querySelector('[data-header]');

function closeMenu() {
  if (!menuToggle || !navigation) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}

if (menuToggle && navigation) {
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!open));
    navigation.classList.toggle('is-open', !open);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      menuToggle.focus();
    }
  });
}

function updateHeader() {
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});

const posterModal = document.querySelector('[data-poster-modal]');
const posterOpen = document.querySelector('[data-poster-open]');
const posterClose = document.querySelector('[data-poster-close]');
let posterReturnFocus = null;

function openPoster(trigger = posterOpen) {
  if (!posterModal || posterModal.open) return;
  posterReturnFocus = trigger || document.activeElement || posterOpen;

  if (typeof posterModal.showModal === 'function') {
    posterModal.showModal();
  } else {
    posterModal.setAttribute('open', '');
  }

  document.body.classList.add('poster-open');
  posterClose?.focus({ preventScroll: true });
}

function closePoster() {
  if (!posterModal || !posterModal.open) return;

  if (typeof posterModal.close === 'function') {
    posterModal.close();
  } else {
    posterModal.removeAttribute('open');
    document.body.classList.remove('poster-open');
    posterReturnFocus?.focus({ preventScroll: true });
  }
}

posterOpen?.addEventListener('click', () => openPoster(posterOpen));
posterClose?.addEventListener('click', closePoster);

posterModal?.addEventListener('click', (event) => {
  if (event.target === posterModal) closePoster();
});

posterModal?.addEventListener('close', () => {
  document.body.classList.remove('poster-open');
  posterReturnFocus?.focus({ preventScroll: true });
});

window.setTimeout(() => openPoster(posterOpen), 420);
