/* GasWorld news & case studies
   Posts are managed in the editing area (/editor) and served from /api/posts.
   If that is unavailable, the bundled starter content is used instead. */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const urlFor = p => (p.type === 'news' ? '/news/' : '/case-studies/') + encodeURIComponent(p.slug);
  const tagClass = p => p.type === 'news' ? 'tag-commercial' : (/renew/i.test(p.tag || '') ? 'tag-renewables' : 'tag-commercial');
  const fmtDate = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
  const arrow = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

  let cache;
  async function loadPosts() {
    if (cache) return cache;
    cache = (async () => {
      try {
        const r = await fetch('/api/posts');
        if (!r.ok) throw new Error();
        return (await r.json()).posts || [];
      } catch {
        try {
          const r = await fetch('/content/seed-posts.json');
          const posts = (await r.json()).posts || [];
          return posts.filter(p => p.published !== false).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        } catch { return null; }
      }
    })();
    return cache;
  }

  // Turn plain text from the editor into tidy HTML.
  function formatBody(text) {
    const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/);
    let html = '';
    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      const heading = lines[0];
      const rest = lines.slice(1);
      const isList = l => /^[-•*]\s+/.test(l);
      if (lines.every(isList)) {
        html += '<ul class="case-study-list">' + lines.map(l => '<li>' + esc(l.replace(/^[-•*]\s+/, '')) + '</li>').join('') + '</ul>';
      } else if (rest.length && rest.every(isList) && heading.length < 70 && !/[.!?]$/.test(heading)) {
        html += '<h2 class="case-study-subhead">' + esc(heading) + '</h2>';
        html += '<ul class="case-study-list">' + rest.map(l => '<li>' + esc(l.replace(/^[-•*]\s+/, '')) + '</li>').join('') + '</ul>';
      } else if (lines.length === 1 && heading.length < 70 && !/[.!?:]$/.test(heading)) {
        html += '<h2 class="case-study-subhead">' + esc(heading) + '</h2>';
      } else {
        html += '<p>' + lines.map(esc).join('<br>') + '</p>';
      }
    });
    return html;
  }

  function projectCard(p) {
    const meta = (p.facts || []).slice(0, 3).map(f => f.value).join(' · ') || p.summary || '';
    const label = p.type === 'news' ? 'Read more' : 'Read case study';
    const filter = p.type === 'news' ? 'news' : (/renew/i.test(p.tag || '') ? 'renewables' : 'commercial');
    return `<article class="project-card" data-filter="${filter}">
      <a href="${urlFor(p)}"><img class="project-card-img" src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" loading="lazy"></a>
      <div class="project-card-body">
        <span class="card-tag ${tagClass(p)}">${esc(p.tag || 'Case Study')}</span>
        <h4><a href="${urlFor(p)}" style="color:inherit">${esc(p.title)}</a></h4>
        <p>${esc(meta)}</p>
        <a href="${urlFor(p)}" class="arrow-link mt-sm">${label} ${arrow}</a>
      </div>
    </article>`;
  }

  function newsCard(p) {
    return `<article class="news-card">
      <a href="${urlFor(p)}"><img class="news-card-img" src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" loading="lazy"></a>
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="card-tag ${tagClass(p)}">${p.type === 'news' ? 'News' : 'Case Study'}</span>
          <span class="news-card-date">${esc(fmtDate(p.date))}</span>
        </div>
        <h3 class="news-card-title">${esc(p.title)}</h3>
        <p class="news-card-excerpt">${esc(p.summary)}</p>
        <a href="${urlFor(p)}" class="news-card-link">${p.type === 'news' ? 'Read more' : 'Read case study'} ${arrow}</a>
      </div>
    </article>`;
  }

  async function renderLatest() {
    const grids = document.querySelectorAll('[data-latest-case-studies]');
    if (!grids.length) return;
    const posts = await loadPosts();
    if (!posts) return;
    const cs = posts.filter(p => p.type === 'case-study');
    grids.forEach(g => {
      const n = Number(g.getAttribute('data-latest-case-studies')) || 3;
      if (cs.length) {
        g.innerHTML = cs.slice(0, n).map(projectCard).join('');
        g.querySelectorAll(':scope > *').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      }
    });
  }

  async function renderNews() {
    const featured = document.querySelector('[data-news-featured]');
    const grid = document.querySelector('[data-news-grid]');
    if (!featured && !grid) return;
    const posts = await loadPosts();
    if (!posts || !posts.length) return;
    const [first, ...rest] = posts;
    if (featured) {
      featured.innerHTML = `<div class="news-featured">
        <img class="news-featured-img" src="${esc(first.image)}" alt="${esc(first.imageAlt || first.title)}" loading="lazy">
        <div class="news-featured-body">
          <div class="news-card-meta">
            <span class="card-tag ${tagClass(first)}">${first.type === 'news' ? 'News' : 'Case Study'}</span>
            <span class="news-card-date">${esc(fmtDate(first.date))}</span>
          </div>
          <h2 class="news-featured-title">${esc(first.title)}</h2>
          <p>${esc(first.summary)}</p>
          <a href="${urlFor(first)}" class="arrow-link mt-sm">${first.type === 'news' ? 'Read more' : 'Read case study'} ${arrow}</a>
        </div>
      </div>`;
    }
    if (grid) {
      grid.innerHTML = rest.map(newsCard).join('');
      grid.querySelectorAll(':scope > *').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      const wrap = grid.closest('section');
      if (wrap) wrap.hidden = rest.length === 0;
    }
  }

  async function renderPost() {
    const root = document.querySelector('[data-post]');
    if (!root) return;
    const m = location.pathname.match(/\/(case-studies|news)\/([^/?#]+)/);
    const slug = m ? decodeURIComponent(m[2]) : new URLSearchParams(location.search).get('p');
    const posts = await loadPosts();
    const p = posts && posts.find(x => x.slug === slug);
    if (!p) {
      root.innerHTML = `<section class="section bg-white"><div class="container text-center" style="padding:3rem 0">
        <h1>Sorry, we can't find that post</h1>
        <p style="margin:1rem auto 2rem">It may have been moved or removed.</p>
        <a href="/news.html" class="btn btn-primary btn-lg">See all news &amp; case studies</a></div></section>`;
      return;
    }
    document.title = p.title + (p.type === 'news' ? ' | News' : ' | Case Study') + ' | GasWorld';
    const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    setMeta('meta[name="description"]', 'content', p.summary || p.title);
    setMeta('meta[property="og:title"]', 'content', p.title);
    setMeta('meta[property="og:description"]', 'content', p.summary || p.title);
    setMeta('link[rel="canonical"]', 'href', 'https://gasworldltd.co.uk' + urlFor(p));
    const isCs = p.type === 'case-study';
    const facts = (p.facts || []).map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('');
    const gallery = (p.gallery || []).map(g => `<img src="${esc(g.src)}" alt="${esc(g.alt || p.title)}" loading="lazy">`).join('');
    root.innerHTML = `
    <section class="hero-inner" aria-label="${esc(p.title)}">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/index.html">Home</a><span>›</span>
          <a href="${isCs ? '/projects.html' : '/news.html'}">${isCs ? 'Projects' : 'News'}</a><span>›</span>
          <span aria-current="page">${esc(p.title)}</span>
        </nav>
        <div class="hero-inner-content">
          <p class="label label-pill" style="margin-bottom:1rem">${esc(isCs ? (p.tag || 'Case Study') : 'News · ' + fmtDate(p.date))}</p>
          <h1>${esc(p.title)}</h1>
          ${p.summary ? `<p class="lead">${esc(p.summary)}</p>` : ''}
        </div>
      </div>
    </section>
    <section class="section bg-white" aria-label="Overview">
      <div class="container ${facts ? 'case-study-layout' : ''}">
        <div class="case-study-body">
          ${p.image && !gallery ? `<img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" style="width:100%;border-radius:var(--radius-lg);margin-bottom:1.75rem">` : ''}
          ${formatBody(p.body)}
        </div>
        ${facts ? `<aside class="case-study-facts" aria-label="Project facts">
          <h3>Project facts</h3><dl>${facts}</dl>
          <a href="/quote.html" class="btn btn-primary" style="width:100%;justify-content:center">Discuss your project</a>
        </aside>` : ''}
      </div>
    </section>
    ${gallery ? `<section class="section bg-off-white" aria-label="Gallery"><div class="container">
      <div class="case-study-gallery">${gallery}</div>
      <p class="case-study-back"><a href="${isCs ? '/projects.html' : '/news.html'}" class="arrow-link">← Back to ${isCs ? 'all projects' : 'news'}</a></p>
    </div></section>` : ''}`;
    if (window.initHeroGlow) window.initHeroGlow();
  }

  document.addEventListener('DOMContentLoaded', () => { renderLatest(); renderNews(); renderPost(); });
})();
