// Registers the service worker (sw.js, made by scripts/build-web.mjs), so the app works
// offline after the first visit. When a new version has been downloaded in the background,
// it tells the app (event "sw-update-ready"), which shows an "Update" button.
// The new version is only switched on when the user taps it: never in the middle of a lesson.
(function () {
  if (!('serviceWorker' in navigator) || !document.currentScript) return;
  var base = new URL('.', document.currentScript.src);

  function notify(worker) {
    window.__swWaiting = worker;
    window.dispatchEvent(new CustomEvent('sw-update-ready', { detail: worker }));
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register(new URL('sw.js', base).href, { scope: base.pathname })
      .then(function (registration) {
        if (registration.waiting && navigator.serviceWorker.controller) notify(registration.waiting);
        registration.addEventListener('updatefound', function () {
          var worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) notify(worker);
          });
        });
        // Look for a new version whenever the app comes back to the screen.
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') registration.update().catch(function () {});
        });
      })
      .catch(function () {});
  });
})();
