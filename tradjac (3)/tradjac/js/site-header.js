document.addEventListener('DOMContentLoaded', function () {
  var header = document.getElementById('site-header');
  var toggleBtn = document.getElementById('mobile-toggle');
  var mobileMenu = document.getElementById('mobile-menu');

  function setMenuOpen(open) {
    if (!mobileMenu || !toggleBtn) return;
    mobileMenu.classList.toggle('is-open', open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', function () {
      setMenuOpen(!mobileMenu.classList.contains('is-open'));
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuOpen(false);
      });
    });
  }

  if (!header) return;

  var hero = document.querySelector('[data-header-hero]');

  function updateHeaderTheme() {
    if (hero) {
      var pastHero = window.scrollY > hero.offsetHeight - 90;
      header.classList.toggle('header--light', pastHero);
      header.classList.toggle('header--dark', !pastHero);
    }
    header.classList.toggle('header--scrolled', window.scrollY > 48);
  }

  if (!hero && !header.classList.contains('header--dark') && !header.classList.contains('header--light')) {
    header.classList.add('header--light');
  }

  updateHeaderTheme();
  window.addEventListener('scroll', updateHeaderTheme, { passive: true });
});
