// Turns the header's page links into a menu that slides in from the right.
// Without JavaScript the links simply stay inline in the header.
(function () {
  var nav = document.querySelector('.site-nav');
  var list = nav && nav.querySelector('ul');
  if (!list) return;
  document.documentElement.classList.add('js-menu');

  var path = location.pathname.replace(/index\.html$/, '');
  var home = document.createElement('li');
  home.innerHTML = '<a href="/">Home</a>';
  if (path === '/') home.firstChild.setAttribute('aria-current', 'page');
  list.insertBefore(home, list.firstChild);

  var drawer = document.createElement('div');
  drawer.className = 'menu-drawer';
  drawer.id = 'site-menu';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Menu');
  drawer.innerHTML =
    '<div class="menu-head"><span>Menu</span>' +
    '<button type="button" class="menu-close" aria-label="Close menu">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
  list.parentNode.removeChild(list);
  drawer.appendChild(list);
  var cta = document.createElement('div');
  cta.className = 'menu-cta';
  cta.innerHTML =
    '<a class="menu-cta-link primary" href="https://apps.apple.com/us/app/shot-timer-drills/id6804109678">Get it on the App Store</a>' +
    '<a class="menu-cta-link" href="/beta/">Join the Android beta</a>';
  drawer.appendChild(cta);

  var backdrop = document.createElement('div');
  backdrop.className = 'menu-backdrop';

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu-button';
  button.setAttribute('aria-label', 'Open menu');
  button.setAttribute('aria-controls', 'site-menu');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  nav.appendChild(button);
  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
  drawer.inert = true;

  function open() {
    document.body.classList.add('menu-open');
    button.setAttribute('aria-expanded', 'true');
    drawer.inert = false;
    drawer.querySelector('.menu-close').focus();
  }
  function close() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    button.setAttribute('aria-expanded', 'false');
    drawer.inert = true;
    button.focus();
  }
  button.addEventListener('click', open);
  backdrop.addEventListener('click', close);
  drawer.querySelector('.menu-close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  // A same-page link (e.g. Home while on Home) should still close the menu.
  drawer.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
})();
