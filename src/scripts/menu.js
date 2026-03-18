const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');

if (menuToggle && mainNav) {
  const overlay = document.getElementById('nav-overlay');

  const toggleMenu = () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    mainNav.classList.toggle('is-open');
    document.body.classList.toggle('nav-open');
  };

  menuToggle.addEventListener('click', toggleMenu);
  
  if (overlay) {
    overlay.addEventListener('click', toggleMenu);
  }
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

// Mark active sub-menu links based on the current path
(function markActiveSubLinks() {
  const path = window.location.pathname;
  const submenuLinks = document.querySelectorAll('.submenu a');
  submenuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    // Active if exact match OR if current path starts with the href (for sub-pages like /jugadoras/xxx)
    if (path === href || (href !== '/' && path.startsWith(href))) {
      link.classList.add('active');
      // Also open the parent submenu so the user can see which section they are in
      const parentSubmenu = link.closest('.submenu');
      const parentHasSubmenu = link.closest('.has-submenu');
      if (parentSubmenu && parentHasSubmenu) {
        // On desktop nothing changes, on mobile mark the submenu parent as active too
        const parentToggle = parentHasSubmenu.querySelector('.submenu-toggle');
        if (parentToggle) {
          // don't auto-open on mobile, just highlight parent item
        }
        // Mark the parent "Estadísticas" link as active
        const parentLink = parentHasSubmenu.querySelector('.submenu-header a');
        if (parentLink) {
          parentLink.classList.add('active');
        }
      }
    }
  });
})();