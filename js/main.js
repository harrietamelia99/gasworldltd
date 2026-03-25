/* ============================================================
   GasWorld Ltd Main JavaScript
   ============================================================ */

/* ── Loading Screen ─────────────────────────────────────────── */
(function () {
  if (sessionStorage.getItem('gw-loaded')) return;
  sessionStorage.setItem('gw-loaded', '1');

  const screen = document.createElement('div');
  screen.id = 'gw-loader';
  screen.innerHTML = `
    <div class="gw-loader-inner">
      <div class="gw-loader-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 43 865 162" height="42" aria-label="GasWorld"><g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(0.871246, 197.748388)"><g><path d="M 119.75 -12.328125 C 120.75 -23.078125 121.25 -31.035156 121.25 -36.203125 C 121.25 -38.660156 120.75 -47.976562 119.75 -64.15625 C 124.332031 -63.820312 127.75 -63.65625 130 -63.65625 C 132.25 -63.65625 135.664062 -63.820312 140.25 -64.15625 C 139.1875 -52.414062 138.65625 -40.148438 138.65625 -27.359375 C 138.65625 -21.054688 139.1875 -13.660156 140.25 -5.171875 C 130.632812 -2.785156 123.039062 -1.0625 117.46875 0 C 107.914062 1.925781 97.738281 2.890625 86.9375 2.890625 C 70.957031 2.890625 57.828125 0.664062 47.546875 -3.78125 C 33.085938 -10.007812 22.546875 -19.957031 15.921875 -33.625 C 10.941406 -43.894531 8.453125 -55.53125 8.453125 -68.53125 C 8.453125 -86.164062 12.828125 -101.085938 21.578125 -113.296875 C 35.304688 -132.523438 57.65625 -142.140625 88.625 -142.140625 C 102.675781 -142.140625 115.34375 -140.015625 126.625 -135.765625 C 130.53125 -134.378906 135.203125 -132.257812 140.640625 -129.40625 C 138.515625 -124.5 136.789062 -119.425781 135.46875 -114.1875 L 132.984375 -113.296875 C 118.523438 -126.554688 103.109375 -133.1875 86.734375 -133.1875 C 76.847656 -133.1875 67.363281 -130.765625 58.28125 -125.921875 C 48.070312 -120.421875 40.484375 -112.066406 35.515625 -100.859375 C 31.398438 -91.578125 29.34375 -81.234375 29.34375 -69.828125 C 29.34375 -50.859375 34.347656 -35.441406 44.359375 -23.578125 C 50.328125 -16.546875 57.320312 -11.769531 65.34375 -9.25 C 72.039062 -7.125 79.898438 -6.0625 88.921875 -6.0625 C 97.472656 -6.0625 104.800781 -7.023438 110.90625 -8.953125 C 113.09375 -9.617188 116.039062 -10.742188 119.75 -12.328125 Z M 119.75 -12.328125 "/></g></g></g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(158.805891, 197.748388)"><g><path d="M 15.609375 -74.5 L 15.8125 -87.234375 C 25.425781 -95.117188 36.5 -99.0625 49.03125 -99.0625 C 60.4375 -99.0625 69.320312 -95.546875 75.6875 -88.515625 C 78.9375 -84.941406 81.023438 -81.066406 81.953125 -76.890625 C 82.878906 -72.773438 83.34375 -67.632812 83.34375 -61.46875 C 83.34375 -55.769531 83.113281 -43.601562 82.65625 -24.96875 C 82.59375 -22.382812 82.5625 -20.425781 82.5625 -19.09375 C 82.5625 -12.863281 83.222656 -8.921875 84.546875 -7.265625 C 85.804688 -5.671875 87.695312 -4.875 90.21875 -4.875 C 91.007812 -4.875 92.066406 -5.003906 93.390625 -5.265625 L 94.484375 -0.390625 C 89.515625 1.597656 84.875 2.59375 80.5625 2.59375 C 76.457031 2.59375 73.304688 1.097656 71.109375 -1.890625 C 69.984375 -3.347656 68.859375 -6.066406 67.734375 -10.046875 C 57.253906 -1.617188 46.773438 2.59375 36.296875 2.59375 C 29.203125 2.59375 22.9375 0.96875 17.5 -2.28125 C 10.601562 -6.332031 7.15625 -13.164062 7.15625 -22.78125 C 7.15625 -33.78125 11.960938 -41.632812 21.578125 -46.34375 C 25.097656 -48.007812 30.570312 -49.601562 38 -51.125 C 38.925781 -51.320312 44.628906 -52.382812 55.109375 -54.3125 C 61.597656 -55.5 65.410156 -56.988281 66.546875 -58.78125 C 67.203125 -59.84375 67.53125 -61.5 67.53125 -63.75 C 67.53125 -70.519531 66.535156 -75.660156 64.546875 -79.171875 C 60.640625 -86.203125 53.8125 -89.71875 44.0625 -89.71875 C 37.894531 -89.71875 32.359375 -88.328125 27.453125 -85.546875 C 24.597656 -83.953125 22.410156 -82.0625 20.890625 -79.875 C 20.085938 -78.8125 19.160156 -77.019531 18.109375 -74.5 Z M 67.53125 -48.734375 C 52.019531 -46.285156 41.8125 -43.898438 36.90625 -41.578125 C 29.34375 -38.054688 25.5625 -32.351562 25.5625 -24.46875 C 25.5625 -18.5 27.617188 -13.859375 31.734375 -10.546875 C 34.847656 -8.023438 38.828125 -6.765625 43.671875 -6.765625 C 49.234375 -6.765625 54.304688 -8.289062 58.890625 -11.34375 C 61.203125 -12.925781 63.882812 -15.644531 66.9375 -19.5 C 67.207031 -31.4375 67.40625 -41.179688 67.53125 -48.734375 Z M 67.53125 -48.734375 "/></g></g></g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(256.671496, 197.748388)"><g><path d="M 8.859375 -5.375 C 11.046875 -9.75 13.066406 -14.421875 14.921875 -19.390625 C 18.097656 -14.421875 21.046875 -10.972656 23.765625 -9.046875 C 27.816406 -6.265625 32.523438 -4.875 37.890625 -4.875 C 43.660156 -4.875 48.4375 -6.460938 52.21875 -9.640625 C 56 -12.828125 57.890625 -17.007812 57.890625 -22.1875 C 57.890625 -27.09375 56.066406 -31.234375 52.421875 -34.609375 C 49.566406 -37.265625 43.863281 -39.753906 35.3125 -42.078125 C 25.5625 -44.597656 18.960938 -48.175781 15.515625 -52.8125 C 12.128906 -57.320312 10.4375 -62.828125 10.4375 -69.328125 C 10.4375 -79.078125 13.988281 -86.734375 21.09375 -92.296875 C 26.851562 -96.804688 34.378906 -99.0625 43.671875 -99.0625 C 48.898438 -99.0625 53.503906 -98.367188 57.484375 -96.984375 C 59.609375 -96.253906 62.460938 -94.789062 66.046875 -92.59375 C 64.585938 -89.351562 62.628906 -84.679688 60.171875 -78.578125 C 57.453125 -82.816406 55.035156 -85.800781 52.921875 -87.53125 C 49.398438 -90.25 45.320312 -91.609375 40.6875 -91.609375 C 35.90625 -91.609375 31.957031 -90.179688 28.84375 -87.328125 C 25.664062 -84.410156 24.078125 -80.363281 24.078125 -75.1875 C 24.078125 -69.488281 26.164062 -65.179688 30.34375 -62.265625 C 33.457031 -60.140625 38.363281 -58.179688 45.0625 -56.390625 C 51.820312 -54.535156 56.957031 -52.582031 60.46875 -50.53125 C 64.113281 -48.46875 67.035156 -45.117188 69.234375 -40.484375 C 70.753906 -37.234375 71.515625 -33.75 71.515625 -30.03125 C 71.515625 -23.34375 69.226562 -17.046875 64.65625 -11.140625 C 57.5625 -1.984375 47.179688 2.59375 33.515625 2.59375 C 28.679688 2.59375 24.007812 1.925781 19.5 0.59375 C 16.644531 -0.269531 13.097656 -2.257812 8.859375 -5.375 Z M 8.859375 -5.375 "/></g></g></g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(335.740663, 197.748388)"><g><path d="M 2.984375 -139.75 C 7.753906 -139.414062 11.367188 -139.25 13.828125 -139.25 C 16.078125 -139.25 19.554688 -139.414062 24.265625 -139.75 C 25.128906 -136.164062 27.1875 -128.570312 30.4375 -116.96875 C 35.601562 -98.207031 39.582031 -84.25 42.375 -75.09375 C 45.15625 -65.945312 49.460938 -52.1875 55.296875 -33.8125 L 59.578125 -20 C 64.617188 -35.84375 72.875 -60.609375 84.34375 -94.296875 C 88.851562 -107.691406 93.492188 -122.84375 98.265625 -139.75 C 101.117188 -139.414062 103.242188 -139.25 104.640625 -139.25 C 106.023438 -139.25 108.144531 -139.414062 111 -139.75 C 113.851562 -130.0625 119.125 -113.550781 126.8125 -90.21875 C 128.34375 -85.96875 132.585938 -72.96875 139.546875 -51.21875 C 142.535156 -42.070312 145.785156 -32.722656 149.296875 -23.171875 C 151.953125 -30.867188 155.832031 -43.070312 160.9375 -59.78125 L 171.078125 -92.59375 C 178.898438 -119.320312 183.410156 -135.039062 184.609375 -139.75 C 187.984375 -139.414062 190.535156 -139.25 192.265625 -139.25 C 193.984375 -139.25 196.535156 -139.414062 199.921875 -139.75 C 196.804688 -131.726562 188.582031 -109.28125 175.25 -72.40625 C 172 -63.457031 165.46875 -44.097656 155.65625 -14.328125 C 153.863281 -8.691406 152.472656 -3.75 151.484375 0.5 C 148.367188 0.164062 146.015625 0 144.421875 0 C 142.828125 0 140.472656 0.164062 137.359375 0.5 C 134.972656 -8.25 131.425781 -20.050781 126.71875 -34.90625 C 122.007812 -49.5625 116.96875 -65.410156 111.59375 -82.453125 C 108.476562 -92.265625 105.097656 -102.644531 101.453125 -113.59375 C 97.335938 -102.3125 91.535156 -85.929688 84.046875 -64.453125 C 71.773438 -29.441406 64.378906 -7.789062 61.859375 0.5 C 58.742188 0.164062 56.425781 0 54.90625 0 C 53.3125 0 50.957031 0.164062 47.84375 0.5 C 46.445312 -3.945312 44.488281 -10.578125 41.96875 -19.390625 C 41.238281 -21.847656 33.382812 -47.179688 18.40625 -95.390625 C 11.175781 -117.597656 6.035156 -132.382812 2.984375 -139.75 Z M 2.984375 -139.75 "/></g></g></g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(528.880256, 197.748388)"><g><path d="M 58.484375 -99.0625 C 73.535156 -99.0625 85.4375 -93.925781 94.1875 -83.65625 C 101.945312 -74.5 105.828125 -62.957031 105.828125 -49.03125 C 105.828125 -32.851562 100.722656 -19.925781 90.515625 -10.25 C 81.492188 -1.6875 70.117188 2.59375 56.390625 2.59375 C 43.660156 2.59375 32.953125 -0.988281 24.265625 -8.15625 C 13.328125 -17.238281 7.859375 -30.269531 7.859375 -47.25 C 7.859375 -57.789062 10.28125 -67.304688 15.125 -75.796875 C 19.5 -83.347656 25.796875 -89.210938 34.015625 -93.390625 C 41.378906 -97.171875 49.535156 -99.0625 58.484375 -99.0625 Z M 57.984375 -91.609375 C 48.171875 -91.609375 40.578125 -87.597656 35.203125 -79.578125 C 29.242188 -70.816406 26.265625 -60.003906 26.265625 -47.140625 C 26.265625 -32.285156 29.644531 -21.015625 36.40625 -13.328125 C 41.375 -7.691406 47.972656 -4.875 56.203125 -4.875 C 65.210938 -4.875 72.472656 -8.617188 77.984375 -16.109375 C 84.273438 -24.734375 87.421875 -35.90625 87.421875 -49.625 C 87.421875 -63.882812 84.238281 -74.925781 77.875 -82.75 C 73.101562 -88.65625 66.472656 -91.609375 57.984375 -91.609375 Z M 57.984375 -91.609375 "/></g></g></g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(641.763122, 197.748388)"><g><path d="M 16.40625 0.5 C 17.46875 -8.050781 18 -22.804688 18 -43.765625 L 17.796875 -66.546875 C 17.671875 -78.148438 17.539062 -85.375 17.40625 -88.21875 C 17.269531 -90.738281 16.9375 -93.660156 16.40625 -96.984375 C 20.851562 -96.648438 24.171875 -96.484375 26.359375 -96.484375 C 28.546875 -96.484375 31.859375 -96.648438 36.296875 -96.984375 C 35.242188 -90.609375 34.71875 -84.804688 34.71875 -79.578125 C 39.289062 -86.203125 43.300781 -90.910156 46.75 -93.703125 C 51.125 -97.273438 55.898438 -99.0625 61.078125 -99.0625 C 63.066406 -99.0625 65.421875 -98.695312 68.140625 -97.96875 C 66.742188 -93.789062 65.945312 -91.039062 65.75 -89.71875 C 65.414062 -88.257812 65.082031 -85.144531 64.75 -80.375 C 60.84375 -82.226562 57.296875 -83.15625 54.109375 -83.15625 C 43.828125 -83.15625 37.492188 -77.285156 35.109375 -65.546875 C 34.179688 -60.898438 33.71875 -48.863281 33.71875 -29.4375 C 33.71875 -16.507812 34.25 -6.53125 35.3125 0.5 C 31.132812 0.164062 28.015625 0 25.953125 0 C 23.765625 0 20.582031 0.164062 16.40625 0.5 Z M 16.40625 0.5 "/></g></g></g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(706.908731, 197.748388)"><g><path d="M 19.203125 -151.390625 C 23.378906 -151.054688 26.523438 -150.890625 28.640625 -150.890625 C 30.765625 -150.890625 33.914062 -151.054688 38.09375 -151.390625 C 37.425781 -145.484375 36.992188 -139.613281 36.796875 -133.78125 C 36.734375 -130.269531 36.703125 -120.6875 36.703125 -105.03125 L 36.5 -80.5625 L 36.703125 -52.71875 C 36.703125 -33.351562 36.769531 -20.851562 36.90625 -15.21875 C 37.101562 -10.445312 37.5 -5.207031 38.09375 0.5 C 33.914062 0.164062 30.800781 0 28.75 0 C 26.5625 0 23.378906 0.164062 19.203125 0.5 C 20.128906 -8.65625 20.59375 -18.4375 20.59375 -28.84375 L 20.484375 -50.53125 L 20.6875 -80.375 L 20.484375 -107.515625 C 20.421875 -126.546875 19.992188 -141.171875 19.203125 -151.390625 Z M 19.203125 -151.390625 "/></g></g></g><g fill="#1E1D5D" fill-opacity="1"><g transform="translate(763.402283, 197.748388)"><g><path d="M 81.765625 0.5 C 82.421875 -4.601562 82.914062 -11.898438 83.25 -21.390625 C 79.800781 -14.691406 76.648438 -9.914062 73.796875 -7.0625 C 67.367188 -0.625 58.582031 2.59375 47.4375 2.59375 C 35.238281 2.59375 25.523438 -1.75 18.296875 -10.4375 C 10.140625 -20.1875 6.0625 -32.722656 6.0625 -48.046875 C 6.0625 -61.566406 9.3125 -72.769531 15.8125 -81.65625 C 19.851562 -87.226562 24.957031 -91.570312 31.125 -94.6875 C 37.09375 -97.601562 43.492188 -99.0625 50.328125 -99.0625 C 56.890625 -99.0625 63.023438 -97.601562 68.734375 -94.6875 C 74.898438 -91.507812 79.304688 -86.800781 81.953125 -80.5625 L 81.859375 -86.03125 L 81.765625 -100.75 C 81.492188 -128.738281 81.03125 -145.648438 80.375 -151.484375 C 84.550781 -151.085938 87.695312 -150.890625 89.8125 -150.890625 C 91.875 -150.890625 95.023438 -151.085938 99.265625 -151.484375 C 98.472656 -145.253906 98.007812 -136.96875 97.875 -126.625 C 97.875 -119.789062 97.84375 -100.328125 97.78125 -68.234375 L 97.671875 -35.515625 C 97.671875 -18.472656 98.203125 -6.46875 99.265625 0.5 C 95.347656 0.164062 92.429688 0 90.515625 0 C 88.523438 0 85.609375 0.164062 81.765625 0.5 Z M 53.515625 -90.3125 C 44.554688 -90.3125 37.394531 -86.597656 32.03125 -79.171875 C 26.988281 -72.210938 24.46875 -62.398438 24.46875 -49.734375 C 24.46875 -36.597656 26.523438 -26.253906 30.640625 -18.703125 C 35.210938 -10.347656 42.207031 -6.171875 51.625 -6.171875 C 60.644531 -6.171875 67.835938 -9.914062 73.203125 -17.40625 C 78.503906 -24.769531 81.15625 -35.25 81.15625 -48.84375 C 81.15625 -58.71875 80.097656 -66.304688 77.984375 -71.609375 C 75.328125 -78.441406 71.378906 -83.550781 66.140625 -86.9375 C 62.691406 -89.1875 58.484375 -90.3125 53.515625 -90.3125 Z M 53.515625 -90.3125 "/></g></g></g></g></svg>
      </div>
      <div class="gw-loader-dots-row">
        <span class="gw-loader-dot"></span>
        <span class="gw-loader-dot"></span>
        <span class="gw-loader-dot"></span>
      </div>
    </div>
  `;
  document.body.appendChild(screen);

  // Dismiss after 1.2s
  setTimeout(() => {
    screen.classList.add('gw-loader-out');
    setTimeout(() => screen.remove(), 500);
  }, 1200);
})();

document.addEventListener('DOMContentLoaded', function () {

  // ── Sticky Nav ───────────────────────────────────────────
  const nav = document.getElementById('site-nav');
  if (nav) {
    const isTransparent = nav.classList.contains('transparent');

    function updateNav() {
      if (!isTransparent) return;
      if (window.scrollY > 60) {
        nav.classList.remove('transparent');
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
        nav.classList.add('transparent');
      }
    }

    if (isTransparent) {
      window.addEventListener('scroll', updateNav, { passive: true });
      updateNav();
    }
  }

  // ── Mobile Hamburger ─────────────────────────────────────
  const hamburger = document.getElementById('nav-hamburger');
  const mobileOverlay = document.getElementById('nav-mobile-overlay');

  if (hamburger && mobileOverlay) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileOverlay.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileOverlay.contains(e.target)) {
        mobileOverlay.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      }
    });
  }

  // ── Desktop Dropdown ─────────────────────────────────────
  const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');

  dropdownToggles.forEach(toggle => {
    const li = toggle.closest('li');
    const dropdown = li ? li.querySelector('.nav-dropdown') : null;

    if (!dropdown) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      li.classList.toggle('open', isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!li.contains(e.target)) {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
        li.classList.remove('open');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
        li.classList.remove('open');
      }
    });
  });

  // ── Mobile Sub-menu Toggles ───────────────────────────────
  const mobileToggles = document.querySelectorAll('.nav-mobile-toggle');
  mobileToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.nextElementSibling;
      if (sub) {
        const isOpen = sub.style.display === 'block';
        sub.style.display = isOpen ? 'none' : 'block';
        const chevron = btn.querySelector('.chevron');
        if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
      }
    });
  });

  // ── FAQ Accordion ─────────────────────────────────────────
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      question.setAttribute('aria-expanded', isOpen);
    });
  });

  // ── Filter Buttons ────────────────────────────────────────
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('[data-filter-container]') || document;
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const items = document.querySelectorAll('[data-filter]:not(.filter-btn)');
      items.forEach(item => {
        if (filter === 'all' || item.dataset.filter === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ── Testimonial Auto-rotate (simple) ─────────────────────
  const testimonialCarousel = document.querySelector('.testimonial-carousel');
  if (testimonialCarousel) {
    const cards = testimonialCarousel.querySelectorAll('.testimonial-card');
    const dots = testimonialCarousel.querySelectorAll('.carousel-dot');
    let current = 0;

    function showCard(index) {
      cards.forEach((c, i) => c.classList.toggle('active', i === index));
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    if (cards.length > 1) {
      setInterval(() => {
        current = (current + 1) % cards.length;
        showCard(current);
      }, 5000);
    }
  }

  // ── Scroll Reveal ─────────────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(el);
  });

  // ── Staggered reveals ─────────────────────────────────────
  document.querySelectorAll('.reveal-stagger').forEach((container, idx) => {
    const children = container.children;
    Array.from(children).forEach((child, i) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(20px)';
      child.style.transition = `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`;
    });

    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          Array.from(entry.target.children).forEach(child => {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          });
          staggerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    staggerObs.observe(container);
  });

  // ── Form validation (basic) ───────────────────────────────
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const requiredFields = form.querySelectorAll('[required]');
      let valid = true;

      requiredFields.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#e74c3c';
          valid = false;
        }
      });

      if (valid) {
        // Show success state
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          btn.textContent = '✓ Sent we\'ll be in touch soon';
          btn.style.background = 'var(--mint)';
          btn.style.color = 'var(--navy)';
          btn.disabled = true;
        }
      }
    });
  });

  // ── Smooth scroll for anchor links ───────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
        const offset = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // ── Count-up animation for stats ─────────────────────────
  function animateCounter(el) {
    const raw = el.getAttribute('data-count');
    if (!raw) return;
    const target = parseFloat(raw);
    const isDecimal = raw.includes('.');
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - elapsed, 3);
    const current = target * ease;
    const formatted = isDecimal
      ? current.toFixed(1)
      : Math.round(current).toLocaleString();
    el.textContent = prefix + formatted + suffix;
      if (elapsed < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  // ── Parallax on hero ─────────────────────────────────────
  const heroBg = document.querySelector('.hero-home');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      heroBg.style.backgroundPositionY = `calc(50% + ${scrolled * 0.3}px)`;
    }, { passive: true });
  }

  // ── Magnetic button effect ────────────────────────────────
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ── Tilt effect on cards ──────────────────────────────────
  document.querySelectorAll('.project-card, .service-card, .news-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
      card.style.transition = 'transform 0.1s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
    });
  });

  // ── Shimmer sweep on .btn-primary ────────────────────────
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.classList.add('btn-shimmer');
  });

  // ── Section line-reveal (border-top sweep) ───────────────
  const lineRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('line-revealed');
        lineRevealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.section-header').forEach(el => {
    el.classList.add('line-reveal');
    lineRevealObserver.observe(el);
  });

  // ── Nav link hover trail ──────────────────────────────────
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.add('nav-link-animated');
  });

  // ── Ripple effect on buttons ─────────────────────────────
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  // ── Stat items hover glow ─────────────────────────────────
  document.querySelectorAll('.stat-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255,255,255,0.06)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = '';
    });
  });

});
