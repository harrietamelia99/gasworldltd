/* GasWorld team: renders team cards from the editing area's saved list */
(function () {
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = n => String(n || '').trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase();
  const src = p => (p && !/^https?:|^\//.test(p)) ? '/' + p : p;
  function shortBio(b) {
    b = String(b || '').trim(); if (b.length <= 240) return b;
    const parts = b.match(/[^.!?]+[.!?]+/g) || [b]; let out = '';
    for (const s of parts) { if ((out + s).length > 240 && out) break; out += s; }
    return out.trim();
  }
  function card(m, featured, preview) {
    const img = m.photo
      ? `<img class="team-card-img" src="${esc(src(m.photo))}" alt="${esc(m.name)}" loading="lazy">`
      : `<div class="team-card-img team-card-placeholder" role="img" aria-label="Photo coming soon"><span>${esc(initials(m.name))}</span></div>`;
    const bio = preview ? shortBio(m.bio) : m.bio;
    return `<div class="team-card ${featured ? 'team-card-featured' : 'team-card--sm'}" style="opacity:1;transform:none">${img}
      <div class="team-card-body"><div class="team-card-name">${esc(m.name)}</div>
      <div class="team-card-role"${featured && !preview ? ' style="color:var(--blue)"' : ''}>${esc(m.role)}</div>
      ${bio ? `<p class="team-card-bio">${esc(bio)}</p>` : ''}</div></div>`;
  }
  async function load() {
    try { const r = await fetch('/api/doc?name=team'); if (r.ok) { const j = await r.json(); if (Array.isArray(j.data)) return j.data; } } catch (e) {}
    try { const r = await fetch('/content/seed-team.json'); if (r.ok) return (await r.json()).members || []; } catch (e) {}
    return null;
  }
  const grids = document.querySelectorAll('[data-team],[data-team-preview]');
  if (!grids.length) return;
  load().then(list => {
    if (!list || !list.length) return;
    grids.forEach(g => {
      if (g.dataset.teamPreview) {
        const n = parseInt(g.dataset.teamPreview, 10) || 2;
        g.innerHTML = list.filter(m => m.group !== 'team').slice(0, n).map(m => card(m, true, true)).join('');
      } else {
        const grp = g.dataset.team;
        const items = list.filter(m => (m.group || 'directors') === grp);
        g.innerHTML = items.map(m => card(m, grp === 'directors', false)).join('');
        const sec = g.closest('section'); if (sec && !items.length && grp === 'team') sec.style.display = 'none';
      }
      g.classList.add('visible', 'is-visible');
    });
  });
})();
