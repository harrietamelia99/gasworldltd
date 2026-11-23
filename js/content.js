/* GasWorld: applies words and photos changed in the editing area */
(function () {
  const els = document.querySelectorAll('[data-edit]');
  if (!els.length) return;
  const fix = p => (p && !/^https?:|^\/|^data:/.test(p)) ? '/' + p : p;
  fetch('/api/doc?name=overrides').then(r => r.ok ? r.json() : null).then(j => {
    const o = j && j.data; if (!o || typeof o !== 'object') return;
    els.forEach(el => {
      const v = o[el.dataset.edit]; if (!v) return;
      if (typeof v.text === 'string') {
        el.textContent = '';
        v.text.split('\n').forEach((line, i) => { if (i) el.appendChild(document.createElement('br')); el.appendChild(document.createTextNode(line)); });
      }
      if (v.src) {
        if (el.tagName === 'IMG') { el.removeAttribute('srcset'); el.src = fix(v.src); if (typeof v.alt === 'string') el.alt = v.alt; }
        else el.style.backgroundImage = `url('${fix(v.src).replace(/'/g, '%27')}')`;
      } else if (typeof v.alt === 'string' && el.tagName === 'IMG') el.alt = v.alt;
    });
  }).catch(() => {});
})();
