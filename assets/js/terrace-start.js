// Independent of personal content; load the scene only after the document and config are ready.
(() => {
  const recovery = document.getElementById('terraceRecovery');
  const message = document.getElementById('terraceRecoveryText');
  const retry = document.getElementById('terraceRetry');
  const host = document.getElementById('terrace');
  const light = new URLSearchParams(location.search).get('terrace') === 'light';
  function fail(reason) {
    document.documentElement.classList.remove('terrace-ready');
    document.querySelector('.terrace-tools').hidden = true;
    host.hidden = true;
    recovery.hidden = false;
    message.textContent = reason;
    retry.hidden = location.protocol === 'file:';
    retry.textContent = light ? 'Retry full 3D view' : 'Try lighter 3D view';
  }
  retry.addEventListener('click', () => {
    const url = new URL(location.href);
    if (light) url.searchParams.delete('terrace'); else url.searchParams.set('terrace','light');
    location.href = url.href;
  });
  window.addEventListener('terrace-failed', event => fail(event.detail || '3D unavailable. Your letters still work.'));
  if (location.protocol === 'file:') {
    fail('3D preview requires a local server. Open START-WEBSITE.bat or use your GitHub Pages link.');
    return;
  }
  import('./terrace.js?v=10-bundled-photos').catch(error => {
    console.error('Terrace could not start:', error);
    fail('3D could not load. Check that all website files were uploaded, or try the lighter view.');
  });
})();
