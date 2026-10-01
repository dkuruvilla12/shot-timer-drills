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
    '<a class="store-badge" href="https://apps.apple.com/us/app/shot-timer-drills/id6804109678">' +
    '<img src="/download/app-store-badge.svg" alt="Download on the App Store" width="170" height="57"></a>' +
    '<a class="beta-badge" href="/beta/" aria-label="Join the beta on Android">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.5 11.5 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25A1.25 1.25 0 1 1 8.25 14 1.25 1.25 0 0 1 7 15.25zm10 0A1.25 1.25 0 1 1 18.25 14 1.25 1.25 0 0 1 17 15.25z"/></svg>' +
    '<span><span class="small">Join the beta on</span><span class="big">Android</span></span></a>';
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
