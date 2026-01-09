// Shared navbar session dropdown for all pages (vanilla JS, no build step)
(function () {
  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function getSession() {
    const token = localStorage.getItem('token');
    const userStored = localStorage.getItem('user');
    const user = userStored ? safeParse(userStored) : null;
    return { token, user };
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  function renderNavMenu() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    const { token, user } = getSession();

    if (token && user && user.name) {
      navMenu.innerHTML = `
        <div class="relative group">
          <button class="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-all hover:scale-105 border border-white/10 backdrop-blur-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span class="text-gray-200 max-w-[12rem] truncate">${user.name}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          <div class="absolute right-0 mt-2 w-52 bg-gray-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] overflow-hidden">
            <a href="/pages/frontoffice/dashboard.html" class="block px-4 py-3 hover:bg-gray-700/80 transition-colors flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              Meus Favoritos
            </a>
            ${user.role === 'admin' ? `
              <a href="/pages/backoffice/home.html" class="block px-4 py-3 hover:bg-gray-700/80 transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Backoffice
              </a>
            ` : ''}
            <div class="border-t border-white/10"></div>
            <a href="#" id="logoutLink" class="block px-4 py-3 hover:bg-gray-700/80 transition-colors flex items-center gap-2 text-red-300">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Sair
            </a>
          </div>
        </div>
      `;

      const logoutLink = document.getElementById('logoutLink');
      if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
      }
    } else {
      navMenu.innerHTML = `
        <a href="/pages/auth/register.html" class="text-gray-200 hover:text-white transition-all flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 0 1 8 0zM3 20a6 6 0 0 1 12 0v1H3v-1z"></path></svg>
          Registar
        </a>
        <a href="/pages/auth/login.html" class="bg-primary px-4 py-2 rounded-lg hover:bg-primary-hover transition-all hover:scale-105 shadow-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v1"></path></svg>
          Entrar
        </a>
      `;
    }
  }

  // expose for pages that want to call explicitly
  window.renderNavMenu = renderNavMenu;
  window.logout = logout;

  // auto-run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavMenu);
  } else {
    renderNavMenu();
  }
})();

