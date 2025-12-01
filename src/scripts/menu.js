const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';

    menuToggle.setAttribute('aria-expanded', !isExpanded);
    mainNav.classList.toggle('is-open');
    document.body.classList.toggle('nav-open');
  });
}

const submenuToggles = document.querySelectorAll('.submenu-toggle');

submenuToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const parentLi = toggle.closest('.has-submenu');
    const submenu = parentLi.querySelector('.submenu');
    const link = parentLi.querySelector('a[aria-expanded]');

    if (submenu && link) {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      toggle.setAttribute('aria-expanded', !isExpanded);
      link.setAttribute('aria-expanded', !isExpanded);
      submenu.classList.toggle('is-open');
    }
  });
});