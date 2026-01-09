// Global page loader (injects if missing, hides on window load)
(function () {
  function ensureLoader() {
    let loader = document.getElementById('pageLoader');
    if (loader) return loader;

    loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className =
      'fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center transition-opacity duration-300';
    loader.innerHTML = `
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
        <p class="text-xl text-gray-300">A carregar...</p>
      </div>
    `;

    // prepend to body
    document.body.insertBefore(loader, document.body.firstChild);
    return loader;
  }

  function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }

  function init() {
    ensureLoader();
    window.addEventListener('load', () => {
      // tiny delay to avoid flash on very fast loads
      setTimeout(hideLoader, 300);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

