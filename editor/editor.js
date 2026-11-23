/* GasWorld editing area: posts, case studies, team, and page words & photos. */
(function () {
  const app = document.getElementById('app');
  const nav = document.querySelector('.ed-nav');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; } };
  const urlFor = p => (p.type === 'news' ? '/news/' : '/case-studies/') + encodeURIComponent(p.slug);
  const FACTS = ['Client', 'Location', 'Size of project', 'What we installed'];

  const icons = {
    news: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>',
    project: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></svg>',
    edit: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    team: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    page: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    jobs: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    help: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>',
  };

  let state = { posts: null, team: null, schema: null, jobs: null, apps: null, appCount: 0 };

  // ── helpers ───────────────────────────────────────────────
  async function api(path, opts = {}) {
    const r = await fetch(path, {
      credentials: 'same-origin',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = {};
    try { data = await r.json(); } catch {}
    if (r.status === 401 && path !== '/api/login') { showLogin('You have been logged out. Please log in again.'); throw new Error('logged out'); }
    if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  let toastTimer;
  function toast(msg, isError) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.toggle('is-error', !!isError); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, isError ? 6000 : 3500);
  }

  function confirmBox(title, text, yesLabel) {
    return new Promise(resolve => {
      const m = document.getElementById('modal');
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-text').textContent = text;
      const yes = document.getElementById('modal-yes'); const no = document.getElementById('modal-no');
      yes.textContent = yesLabel;
      m.hidden = false; no.focus();
      const done = v => { m.hidden = true; yes.onclick = no.onclick = null; resolve(v); };
      yes.onclick = () => done(true); no.onclick = () => done(false);
    });
  }

  function setActive(view) {
    nav.querySelectorAll('[data-go]').forEach(a => a.classList.toggle('is-active', a.dataset.go === view));
    window.scrollTo(0, 0);
  }

  // Resize photos in the browser so uploads are quick, even from a phone.
  function resizePhoto(file, maxW = 1800) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) return reject(new Error('Please choose a photo (JPG or PNG).'));
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxW / img.naturalWidth);
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.84));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That photo could not be opened. Try a JPG or PNG.')); };
      img.src = url;
    });
  }

  async function uploadPhoto(file) {
    const dataUrl = await resizePhoto(file);
    const { url } = await api('/api/upload', { method: 'POST', body: { dataUrl, name: file.name.replace(/\.[^.]+$/, '') } });
    return url;
  }

  async function loadPosts(force) {
    if (state.posts && !force) return state.posts;
    const { posts } = await api('/api/posts?all=1');
    state.posts = posts;
    return posts;
  }

  // ── views ─────────────────────────────────────────────────
  function showLogin(message) {
    nav.hidden = true;
    app.innerHTML = `
      <div class="ed-login">
        <h1>Welcome</h1>
        <p class="ed-intro">Log in to update the news and case studies on the GasWorld website.</p>
        <form class="ed-panel" id="login-form">
          ${message ? `<div class="ed-error">${esc(message)}</div>` : ''}
          <div class="ed-field">
            <label class="ed-label" for="pw">Password</label>
            <input class="ed-input" id="pw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required>
          </div>
          <button class="ed-btn ed-btn-primary" type="submit" style="width:100%">Log in</button>
        </form>
        <p class="ed-muted" style="text-align:center">Forgotten the password? Contact Collectiv. Studio.</p>
      </div>`;
    const f = document.getElementById('login-form');
    document.getElementById('pw').focus();
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Logging in…';
      try {
        await api('/api/login', { method: 'POST', body: { password: document.getElementById('pw').value } });
        showHome();
      } catch (err) {
        if (err.message !== 'logged out') showLogin(err.message);
      }
    });
  }

  function showNotReady(info) {
    nav.hidden = true;
    app.innerHTML = `<div class="ed-login"><h1>Nearly ready</h1>
      <div class="ed-note">The editing area hasn't been switched on yet${info.password ? '' : ' (no password has been set)'}${info.storage ? '' : ' (photo and post storage isn’t connected)'}. Please contact Collectiv. Studio.</div></div>`;
  }

  function showHome() {
    nav.hidden = false; setActive('home');
    app.innerHTML = `
      <h1>Hello</h1>
      <p class="ed-intro">What would you like to do today?</p>
      <div class="ed-cards">
        <button class="ed-card" data-new="case-study">
          <span class="ed-card-icon">${icons.project}</span>
          <h2>Add a case study</h2>
          <p>Show off a finished or ongoing project, with photos and project details.</p>
        </button>
        <button class="ed-card" data-new="news">
          <span class="ed-card-icon">${icons.news}</span>
          <h2>Add a news post</h2>
          <p>Share company news, awards, new starters or anything else.</p>
        </button>
        <button class="ed-card" data-go="list">
          <span class="ed-card-icon">${icons.edit}</span>
          <h2>Edit or remove posts</h2>
          <p>Change words or photos on something already on the website, hide it or delete it.</p>
        </button>
        <button class="ed-card" data-go="team">
          <span class="ed-card-icon">${icons.team}</span>
          <h2>Team</h2>
          <p>Add new people, update job titles, bios and photos, or change the order.</p>
        </button>
        <button class="ed-card" data-go="pages">
          <span class="ed-card-icon">${icons.page}</span>
          <h2>Page words &amp; photos</h2>
          <p>Change the wording or swap photos on any page of the website.</p>
        </button>
        <button class="ed-card" data-go="jobs">
          <span class="ed-card-icon">${icons.jobs}</span>
          <h2>Jobs &amp; applications <span class="ed-count-pill" id="app-count" hidden></span></h2>
          <p>Add a job vacancy to the Careers page, and read applications people have sent.</p>
        </button>
        <button class="ed-card" data-go="help">
          <span class="ed-card-icon">${icons.help}</span>
          <h2>Help</h2>
          <p>Simple tips on writing posts and choosing good photos.</p>
        </button>
      </div>`;
    loadApps().then(a => { const el = document.getElementById('app-count'); if (el && a.length) { el.textContent = a.length; el.hidden = false; } }).catch(() => {});
  }

  async function showList() {
    nav.hidden = false; setActive('list');
    app.innerHTML = `<div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span>Edit or remove posts</div>
      <h1>Your posts</h1><p class="ed-intro">Everything that's on the News &amp; Case Studies page. Newest first.</p>
      <div id="list"><p class="ed-muted">Loading your posts…</p></div>`;
    try {
      const posts = await loadPosts(true);
      const list = document.getElementById('list');
      if (!posts.length) { list.innerHTML = '<div class="ed-note">There are no posts yet. Go back to Start to add your first one.</div>'; return; }
      list.innerHTML = '<div class="ed-list">' + posts.map(p => `
        <div class="ed-row">
          ${p.image ? `<img src="${esc(p.image)}" alt="">` : '<span class="ed-thumb-empty"></span>'}
          <div>
            <h3>${esc(p.title)}</h3>
            <div class="ed-meta">
              <span>${p.type === 'news' ? 'News post' : 'Case study'}</span><span>·</span><span>${esc(fmtDate(p.date))}</span>
              <span class="ed-badge ${p.published === false ? 'ed-badge-hidden' : 'ed-badge-live'}">${p.published === false ? 'Hidden' : 'On the website'}</span>
            </div>
          </div>
          <div class="ed-row-actions">
            <button class="ed-btn ed-btn-primary ed-btn-small" data-edit="${esc(p.id)}">Edit</button>
            ${p.published === false ? '' : `<a class="ed-btn ed-btn-ghost ed-btn-small" href="${urlFor(p)}" target="_blank" rel="noopener">View</a>`}
            <button class="ed-btn ed-btn-ghost ed-btn-small" data-delete="${esc(p.id)}">Delete</button>
          </div>
        </div>`).join('') + '</div>';
    } catch (err) {
      if (err.message !== 'logged out') document.getElementById('list').innerHTML = `<div class="ed-error">${esc(err.message)}</div>`;
    }
  }

  function showForm(post) {
    nav.hidden = false; setActive('');
    const isNew = !post.id;
    let p = { type: 'case-study', title: '', summary: '', date: today(), image: '', imageAlt: '', body: '', facts: [], gallery: [], published: true, ...post };
    const factVal = label => (p.facts.find(f => f.label === label) || {}).value || '';
    // keep any older custom fact labels too
    const extraFacts = p.facts.filter(f => !FACTS.includes(f.label));

    app.innerHTML = `
      <div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span>${isNew ? 'Add a post' : '<a href="#" data-go="list">Your posts</a><span>›</span>Edit'}</div>
      <div class="ed-narrow">
      <h1>${isNew ? (p.type === 'news' ? 'Add a news post' : 'Add a case study') : 'Edit post'}</h1>
      <p class="ed-intro">Fill in the boxes below, then press <strong>Save</strong>. Only the title is required.</p>
      <form id="post-form" novalidate>
        <div class="ed-panel">
          <div class="ed-field">
            <span class="ed-label">What kind of post is this?</span>
            <div class="ed-choice">
              <label><input type="radio" name="type" value="case-study" ${p.type !== 'news' ? 'checked' : ''}> Case study</label>
              <label><input type="radio" name="type" value="news" ${p.type === 'news' ? 'checked' : ''}> News post</label>
            </div>
          </div>
          <div class="ed-field">
            <label class="ed-label" for="f-title">Title</label>
            <span class="ed-hint">For example "Bellway Homes, Flowers Hill Grange" or "We've won an award".</span>
            <input class="ed-input" id="f-title" maxlength="120" value="${esc(p.title)}" required>
          </div>
          <div class="ed-field">
            <label class="ed-label" for="f-summary">Short summary</label>
            <span class="ed-hint">One or two sentences. This shows on the cards that link to the post.</span>
            <textarea class="ed-textarea ed-short" id="f-summary" maxlength="300">${esc(p.summary)}</textarea>
            <span class="ed-count" data-count-for="f-summary"></span>
          </div>
          <div class="ed-field">
            <label class="ed-label" for="f-date">Date</label>
            <input class="ed-input" id="f-date" type="date" value="${esc(p.date)}" style="max-width:240px">
          </div>
        </div>

        <div class="ed-panel">
          <h2>Main photo</h2>
          <div class="ed-photo" id="main-photo">${p.image ? `<img src="${esc(p.image)}" alt="">` : '<span class="ed-photo-empty">No photo yet</span>'}</div>
          <div class="ed-actions" style="margin-bottom:1.25rem">
            <label class="ed-btn ed-btn-mint ed-btn-small" for="f-image-file">${p.image ? 'Change photo' : 'Choose a photo'}</label>
            <input class="ed-file" type="file" id="f-image-file" accept="image/*">
            ${p.image ? '<button type="button" class="ed-btn ed-btn-ghost ed-btn-small" id="remove-main">Remove photo</button>' : ''}
          </div>
          <div class="ed-field">
            <label class="ed-label" for="f-alt">Describe the photo</label>
            <span class="ed-hint">A few words for people using screen readers, e.g. "New build homes in Moreton-in-Marsh".</span>
            <input class="ed-input" id="f-alt" maxlength="150" value="${esc(p.imageAlt)}">
          </div>
        </div>

        <div class="ed-panel">
          <h2>The story</h2>
          <div class="ed-field">
            <label class="ed-label" for="f-body">Main text</label>
            <span class="ed-hint">Leave an empty line between paragraphs. Start a line with a dash ( - ) to make a bullet point. A short line on its own becomes a small heading.</span>
            <textarea class="ed-textarea" id="f-body">${esc(p.body)}</textarea>
          </div>
        </div>

        <div class="ed-panel" id="facts-panel" ${p.type === 'news' ? 'hidden' : ''}>
          <h2>Project details</h2>
          <p>These show in a box beside the case study. Leave any you don't need empty.</p>
          <div class="ed-grid-2">
            ${FACTS.map((label, i) => `<div class="ed-field"><label class="ed-label" for="fact-${i}">${label}</label>
              <input class="ed-input" id="fact-${i}" data-fact="${esc(label)}" maxlength="200" value="${esc(factVal(label))}"></div>`).join('')}
            ${extraFacts.map((f, i) => `<div class="ed-field"><label class="ed-label" for="xfact-${i}">${esc(f.label)}</label>
              <input class="ed-input" id="xfact-${i}" data-fact="${esc(f.label)}" maxlength="200" value="${esc(f.value)}"></div>`).join('')}
          </div>
        </div>

        <div class="ed-panel">
          <h2>More photos <span class="ed-muted" style="font-weight:500;font-size:1rem">(optional)</span></h2>
          <p>These show as a gallery at the bottom of the post. You can choose several at once.</p>
          <div class="ed-gallery" id="gallery"></div>
          <label class="ed-btn ed-btn-mint ed-btn-small" for="f-gallery-file">Add photos</label>
          <input class="ed-file" type="file" id="f-gallery-file" accept="image/*" multiple>
        </div>

        <div class="ed-panel">
          <label class="ed-switch"><input type="checkbox" id="f-published" ${p.published !== false ? 'checked' : ''}> Show this on the website</label>
          <span class="ed-hint" style="margin:0.5rem 0 0">Untick to hide it while you're still working on it.</span>
        </div>

        <div class="ed-actions">
          <button class="ed-btn ed-btn-primary" type="submit" id="save-btn">Save</button>
          <button class="ed-btn ed-btn-ghost" type="button" data-go="${isNew ? 'home' : 'list'}">Cancel</button>
        </div>
      </form>
      </div>`;

    const $ = id => document.getElementById(id);
    const counter = () => { $('f-summary').nextElementSibling.textContent = `${$('f-summary').value.length} / 300`; };
    $('f-summary').addEventListener('input', counter); counter();

    app.querySelectorAll('input[name="type"]').forEach(r => r.addEventListener('change', () => {
      p.type = app.querySelector('input[name="type"]:checked').value;
      $('facts-panel').hidden = p.type === 'news';
    }));

    function drawGallery() {
      $('gallery').innerHTML = p.gallery.map((g, i) => `<div class="ed-gallery-item"><img src="${esc(g.src)}" alt=""><button type="button" data-remove-gallery="${i}">Remove</button></div>`).join('');
    }
    drawGallery();
    $('gallery').addEventListener('click', e => {
      const b = e.target.closest('[data-remove-gallery]'); if (!b) return;
      p.gallery.splice(Number(b.dataset.removeGallery), 1); drawGallery();
    });

    let busy = 0;
    const setBusy = d => { busy += d; $('save-btn').disabled = busy > 0; $('save-btn').textContent = busy > 0 ? 'Uploading photos…' : 'Save'; };

    $('f-image-file').addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      $('main-photo').innerHTML = '<span class="ed-photo-empty">Uploading…</span>'; setBusy(1);
      try { p.image = await uploadPhoto(file); $('main-photo').innerHTML = `<img src="${esc(p.image)}" alt="">`; toast('Photo added'); }
      catch (err) { if (err.message !== 'logged out') { toast(err.message, true); $('main-photo').innerHTML = p.image ? `<img src="${esc(p.image)}" alt="">` : '<span class="ed-photo-empty">No photo yet</span>'; } }
      finally { setBusy(-1); e.target.value = ''; }
    });
    const rm = $('remove-main');
    if (rm) rm.addEventListener('click', () => { p.image = ''; $('main-photo').innerHTML = '<span class="ed-photo-empty">No photo yet</span>'; rm.remove(); });

    $('f-gallery-file').addEventListener('change', async e => {
      const files = [...e.target.files]; e.target.value = '';
      for (const file of files) {
        setBusy(1);
        try { const src = await uploadPhoto(file); p.gallery.push({ src, alt: $('f-title').value || '' }); drawGallery(); }
        catch (err) { if (err.message !== 'logged out') toast(err.message, true); }
        finally { setBusy(-1); }
      }
      if (files.length) toast(files.length === 1 ? 'Photo added' : 'Photos added');
    });

    $('post-form').addEventListener('submit', async e => {
      e.preventDefault();
      const title = $('f-title').value.trim();
      if (!title) { toast('Please add a title.', true); $('f-title').focus(); return; }
      const out = {
        ...p,
        type: app.querySelector('input[name="type"]:checked').value,
        title,
        summary: $('f-summary').value.trim(),
        date: $('f-date').value || today(),
        imageAlt: $('f-alt').value.trim(),
        body: $('f-body').value,
        facts: [...app.querySelectorAll('[data-fact]')].map(i => ({ label: i.dataset.fact, value: i.value.trim() })).filter(f => f.value),
        published: $('f-published').checked,
      };
      const btn = $('save-btn'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const { posts } = await api('/api/posts', { method: 'POST', body: out });
        state.posts = posts;
        const saved = posts.find(x => x.id === out.id) || posts.find(x => x.title === out.title);
        showSaved(saved);
      } catch (err) {
        if (err.message !== 'logged out') { toast(err.message, true); btn.disabled = false; btn.textContent = 'Save'; }
      }
    });
  }

  function showSaved(p) {
    setActive('');
    app.innerHTML = `<div class="ed-narrow">
      <h1>Saved</h1>
      <div class="ed-panel">
        <p style="font-size:1.1rem;color:var(--navy)"><strong>${esc(p ? p.title : 'Your post')}</strong> has been saved${p && p.published === false ? ' but is hidden from the website.' : ' and is now on the website.'}</p>
        <p class="ed-muted">It can take up to a minute to appear for everyone.</p>
        <div class="ed-actions">
          ${p && p.published !== false ? `<a class="ed-btn ed-btn-primary" href="${urlFor(p)}" target="_blank" rel="noopener">See it on the website</a>` : ''}
          ${p ? `<button class="ed-btn ed-btn-mint" data-edit="${esc(p.id)}">Keep editing</button>` : ''}
          <button class="ed-btn ed-btn-ghost" data-go="home">Back to start</button>
        </div>
      </div></div>`;
  }

  function showHelp() {
    nav.hidden = false; setActive('help');
    app.innerHTML = `<div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span>Help</div>
      <div class="ed-narrow ed-help">
      <h1>Help</h1>
      <div class="ed-panel">
        <h2>What can I change here?</h2>
        <ul>
          <li><strong>News posts and case studies:</strong> add, edit, hide and delete them. Your latest three case studies also appear on the Home and Projects pages automatically.</li>
          <li><strong>Team:</strong> add new people, update job titles, bios and photos, move people up or down, or remove them.</li>
          <li><strong>Jobs &amp; applications:</strong> add a vacancy to the Careers page, hide it once it's filled, and read applications (with CVs) that people send through the website.</li>
          <li><strong>Page words &amp; photos:</strong> change the wording or swap photos on any page. If you change your mind, press <strong>Put back the original</strong>.</li>
        </ul>
        <p>The menu, footer and contact details are set up separately. Contact Collectiv. Studio if those need changing.</p>
      </div>
      <div class="ed-panel">
        <h2>Writing a good post</h2>
        <ul>
          <li>Keep the title short and clear, e.g. the developer and site name.</li>
          <li>Use the summary for one or two sentences that make people want to click.</li>
          <li>Leave an empty line between paragraphs.</li>
          <li>Start a line with <code>-</code> to make a bullet point. Handy for "Our works" lists.</li>
          <li>Untick <strong>Show this on the website</strong> if you want to save it and finish later.</li>
        </ul>
      </div>
      <div class="ed-panel">
        <h2>Photos</h2>
        <ul>
          <li>Photos from a phone are perfect. Landscape (sideways) photos look best.</li>
          <li>Big photos are made smaller automatically, so you don't need to resize anything.</li>
          <li>Try to use bright, daytime shots of finished work.</li>
          <li>Only use photos you're allowed to use (your own, or ones the developer has said you can use).</li>
        </ul>
      </div>
      <div class="ed-panel">
        <h2>Something not working?</h2>
        <p>Try refreshing the page. If that doesn't help, contact Collectiv. Studio and let us know what you were trying to do.</p>
      </div></div>`;
  }

  // ── team ──────────────────────────────────────────────────
  const initials = n => String(n || '').trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase();
  const imgUrl = p => (p && !/^https?:|^\/|^data:/.test(p)) ? '/' + p : p;
  const GROUPS = { directors: 'Directors', team: 'The wider team' };

  async function loadTeam(force) {
    if (state.team && !force) return state.team;
    const { data } = await api('/api/doc?name=team&fresh=1');
    state.team = Array.isArray(data) ? data : [];
    return state.team;
  }
  async function saveTeam(list, msg) {
    const { data } = await api('/api/doc?name=team', { method: 'POST', body: { data: list } });
    state.team = data; if (msg) toast(msg); return data;
  }

  async function showTeam() {
    nav.hidden = false; setActive('team');
    app.innerHTML = `<div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span>Team</div>
      <h1>Meet the team</h1><p class="ed-intro">The people shown on the Meet the Team page. The first two directors also appear on the About page.</p>
      <div class="ed-actions" style="margin-bottom:1.5rem"><button class="ed-btn ed-btn-primary" data-member="new">+ Add a team member</button>
      <a class="ed-btn ed-btn-ghost" href="/team.html" target="_blank" rel="noopener">View the team page</a></div>
      <div id="team"><p class="ed-muted">Loading the team…</p></div>`;
    try { drawTeam(await loadTeam(true)); }
    catch (err) { if (err.message !== 'logged out') document.getElementById('team').innerHTML = `<div class="ed-error">${esc(err.message)}</div>`; }
  }
  function drawTeam(list) {
    const box = document.getElementById('team'); if (!box) return;
    box.innerHTML = Object.entries(GROUPS).map(([g, label]) => {
      const items = list.map((m, i) => ({ m, i })).filter(x => (x.m.group || 'directors') === g);
      return `<h2 style="margin:1.5rem 0 0.9rem">${label}</h2>` + (items.length ? '<div class="ed-list">' + items.map(({ m, i }, n) => `
        <div class="ed-row ed-row-team">
          ${m.photo ? `<img src="${esc(imgUrl(m.photo))}" alt="">` : `<span class="ed-thumb-empty ed-initials">${esc(initials(m.name))}</span>`}
          <div><h3>${esc(m.name)}</h3><div class="ed-meta"><span>${esc(m.role || 'No job title yet')}</span>${m.photo ? '' : '<span>·</span><span>No photo yet</span>'}</div></div>
          <div class="ed-row-actions">
            <button class="ed-btn ed-btn-primary ed-btn-small" data-member="${i}">Edit</button>
            <button class="ed-btn ed-btn-ghost ed-btn-small" data-move="${i}:-1" ${n === 0 ? 'disabled' : ''} aria-label="Move ${esc(m.name)} up">↑ Up</button>
            <button class="ed-btn ed-btn-ghost ed-btn-small" data-move="${i}:1" ${n === items.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(m.name)} down">↓ Down</button>
            <button class="ed-btn ed-btn-ghost ed-btn-small" data-remove-member="${i}">Remove</button>
          </div>
        </div>`).join('') + '</div>' : '<div class="ed-note">Nobody in this section yet.</div>');
    }).join('');
  }
  async function moveMember(i, dir) {
    const list = state.team.slice(); const g = list[i].group || 'directors';
    let j = i + dir; while (j >= 0 && j < list.length && (list[j].group || 'directors') !== g) j += dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    drawTeam(list);
    try { drawTeam(await saveTeam(list, 'Order saved')); } catch (err) { if (err.message !== 'logged out') { toast(err.message, true); drawTeam(state.team); } }
  }

  function showMember(index) {
    nav.hidden = false; setActive('team');
    const isNew = index === 'new';
    const m = isNew ? { name: '', role: '', bio: '', photo: '', group: 'team' } : { ...state.team[index] };
    app.innerHTML = `<div class="ed-narrow">
      <div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span><a href="#" data-go="team">Team</a><span>›</span>${isNew ? 'Add someone' : 'Edit'}</div>
      <h1>${isNew ? 'Add a team member' : 'Edit ' + esc(m.name)}</h1>
      <form id="member-form" novalidate>
        <div class="ed-panel">
          <div class="ed-field"><label class="ed-label" for="m-name">Name</label><input class="ed-input" id="m-name" value="${esc(m.name)}" maxlength="80" required></div>
          <div class="ed-field"><label class="ed-label" for="m-role">Job title</label><span class="ed-hint">For example: Contracts Manager</span><input class="ed-input" id="m-role" value="${esc(m.role)}" maxlength="100"></div>
          <div class="ed-field"><span class="ed-label">Which section are they in?</span>
            <div class="ed-choice">
              <label><input type="radio" name="group" value="directors" ${m.group !== 'team' ? 'checked' : ''}> Directors</label>
              <label><input type="radio" name="group" value="team" ${m.group === 'team' ? 'checked' : ''}> The wider team</label>
            </div></div>
        </div>
        <div class="ed-panel">
          <div class="ed-field"><label class="ed-label" for="m-bio">About them</label>
            <span class="ed-hint">A few sentences: what they do, how long they've been with GasWorld, and something about them outside work if they like.</span>
            <textarea class="ed-textarea ed-short" id="m-bio" maxlength="1500" style="min-height:170px">${esc(m.bio)}</textarea></div>
        </div>
        <div class="ed-panel">
          <span class="ed-label">Photo</span>
          <span class="ed-hint">A head-and-shoulders photo works best, with their face in the middle. Without a photo we show their initials.</span>
          <div class="ed-photo ed-photo-person" id="m-photo"></div>
          <div class="ed-actions">
            <label class="ed-btn ed-btn-mint ed-btn-small" for="m-file">${m.photo ? 'Change photo' : 'Add a photo'}</label>
            <input class="ed-file" type="file" id="m-file" accept="image/*">
            <button class="ed-btn ed-btn-ghost ed-btn-small" type="button" id="m-nophoto" ${m.photo ? '' : 'hidden'}>Remove photo</button>
          </div>
        </div>
        <div class="ed-actions">
          <button class="ed-btn ed-btn-primary" type="submit" id="m-save">Save</button>
          <button class="ed-btn ed-btn-ghost" type="button" data-go="team">Cancel</button>
        </div>
      </form></div>`;
    const $ = id => document.getElementById(id);
    const drawPhoto = () => {
      $('m-photo').innerHTML = m.photo ? `<img src="${esc(imgUrl(m.photo))}" alt="">` : `<span class="ed-photo-empty ed-initials-big">${esc(initials($('m-name').value) || '?')}</span>`;
      $('m-nophoto').hidden = !m.photo;
      document.querySelector('label[for="m-file"]').textContent = m.photo ? 'Change photo' : 'Add a photo';
    };
    drawPhoto();
    $('m-name').addEventListener('input', () => { if (!m.photo) drawPhoto(); });
    let busy = false;
    $('m-file').addEventListener('change', async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      busy = true; $('m-photo').innerHTML = '<span class="ed-photo-empty">Uploading photo…</span>';
      try { m.photo = await uploadPhoto(f); toast('Photo added'); } catch (err) { if (err.message !== 'logged out') toast(err.message, true); }
      busy = false; drawPhoto();
    });
    $('m-nophoto').addEventListener('click', () => { m.photo = ''; drawPhoto(); });
    $('member-form').addEventListener('submit', async e => {
      e.preventDefault();
      if (busy) return toast('Please wait for the photo to finish uploading', true);
      m.name = $('m-name').value.trim(); m.role = $('m-role').value.trim(); m.bio = $('m-bio').value.trim();
      m.group = app.querySelector('input[name="group"]:checked').value;
      if (!m.name) { toast('Please add their name', true); $('m-name').focus(); return; }
      const btn = $('m-save'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const list = (await loadTeam(true)).slice();
        if (isNew) list.push(m); else { const at = list.findIndex(x => x.id === m.id); at >= 0 ? (list[at] = m) : list.push(m); }
        await saveTeam(list, isNew ? `${m.name} has been added` : 'Changes saved');
        showTeam();
      } catch (err) { if (err.message !== 'logged out') toast(err.message, true); btn.disabled = false; btn.textContent = 'Save'; }
    });
  }

  // ── page words & photos ───────────────────────────────────
  async function loadSchema() {
    if (state.schema) return state.schema;
    const r = await fetch('/content/schema.json'); state.schema = await r.json(); return state.schema;
  }
  const pageUrl = id => id === 'index' ? '/' : `/${id}.html`;

  async function showPages() {
    nav.hidden = false; setActive('pages');
    app.innerHTML = `<div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span>Page words &amp; photos</div>
      <h1>Page words &amp; photos</h1><p class="ed-intro">Choose a page to change its wording or swap a photo.</p><div id="pages"><p class="ed-muted">Loading…</p></div>`;
    try {
      const s = await loadSchema();
      const counts = {}; s.fields.forEach(f => { counts[f.page] = (counts[f.page] || 0) + 1; });
      document.getElementById('pages').innerHTML = '<div class="ed-cards">' + s.pages.map(p => `
        <button class="ed-card ed-card-page" data-page="${esc(p.id)}"><h2>${esc(p.label)}</h2><p>${counts[p.id] || 0} things you can change</p></button>`).join('') + '</div>';
    } catch { document.getElementById('pages').innerHTML = '<div class="ed-error">Could not load the pages. Please refresh.</div>'; }
  }

  async function showPage(id) {
    nav.hidden = false; setActive('pages');
    const s = await loadSchema();
    const page = s.pages.find(p => p.id === id); if (!page) return showPages();
    app.innerHTML = `<div class="ed-narrow"><div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span><a href="#" data-go="pages">Pages</a><span>›</span>${esc(page.label)}</div>
      <h1>${esc(page.label)}</h1><p class="ed-intro">Change anything below, then press <strong>Save this page</strong> at the bottom. Everything is in the same order as on the website.</p>
      <div id="fields"><p class="ed-muted">Loading…</p></div></div>`;
    let ov;
    try { ov = (await api('/api/doc?name=overrides&fresh=1')).data || {}; }
    catch (err) { if (err.message !== 'logged out') document.getElementById('fields').innerHTML = `<div class="ed-error">${esc(err.message)}</div>`; return; }
    const fields = s.fields.filter(f => f.page === id);
    const pending = {};   // key -> {src, alt} for photos picked this visit
    let html = '', lastSection = null;
    fields.forEach(f => {
      if (f.section !== lastSection) { if (lastSection !== null) html += '</div>'; html += `<div class="ed-panel"><h2 class="ed-section">${esc(f.section)}</h2>`; lastSection = f.section; }
      const o = ov[f.key] || {};
      const changed = f.type === 'text' ? typeof o.text === 'string' : !!(o.src || typeof o.alt === 'string');
      const undo = `<button type="button" class="ed-undo" data-reset="${esc(f.key)}" ${changed ? '' : 'hidden'}>Put back the original</button>`;
      if (f.type === 'text') {
        const val = typeof o.text === 'string' ? o.text : f.default;
        const rows = Math.min(10, Math.max(2, Math.ceil(val.length / 70) + (val.split('\n').length - 1)));
        html += `<div class="ed-field" data-key="${esc(f.key)}"><label class="ed-label" for="k-${f.key}">${esc(f.label)}</label>
          ${f.multiline ? `<textarea class="ed-textarea ed-short ed-auto" id="k-${f.key}" rows="${rows}" style="min-height:0">${esc(val)}</textarea>` : `<input class="ed-input" id="k-${f.key}" value="${esc(val)}">`}${undo}</div>`;
      } else {
        const src = o.src || f.default;
        html += `<div class="ed-field" data-key="${esc(f.key)}"><span class="ed-label">${esc(f.label)}</span>
          <div class="ed-photo ed-photo-small"><img id="p-${f.key}" src="${esc(imgUrl(src))}" alt=""></div>
          <div class="ed-actions"><label class="ed-btn ed-btn-mint ed-btn-small" for="u-${f.key}">Change photo</label>
          <input class="ed-file" type="file" id="u-${f.key}" data-upload="${esc(f.key)}" accept="image/*">${undo}</div>
          ${f.label === 'Photo' ? `<label class="ed-hint" for="a-${f.key}" style="margin-top:0.75rem">Describe the photo in a few words (helps Google and people using screen readers)</label><input class="ed-input" id="a-${f.key}" value="${esc(typeof o.alt === 'string' ? o.alt : (f.alt || ''))}">` : ''}</div>`;
      }
    });
    if (lastSection !== null) html += '</div>';
    html += `<div class="ed-actions ed-sticky"><button class="ed-btn ed-btn-primary" id="page-save">Save this page</button>
      <a class="ed-btn ed-btn-ghost" href="${pageUrl(id)}" target="_blank" rel="noopener">View this page</a></div>`;
    const box = document.getElementById('fields'); box.innerHTML = html;
    const resets = new Set();

    box.addEventListener('change', async e => {
      const key = e.target.dataset.upload; if (!key) return;
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const img = document.getElementById('p-' + key); img.style.opacity = 0.4; pending[key] = { busy: true };
      try { pending[key] = { src: await uploadPhoto(f) }; img.src = pending[key].src; resets.delete(key); toast('Photo ready. Press Save this page to put it live.'); }
      catch (err) { delete pending[key]; if (err.message !== 'logged out') toast(err.message, true); }
      img.style.opacity = 1;
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-reset]'); if (!b) return;
      const key = b.dataset.reset; const f = fields.find(x => x.key === key);
      resets.add(key); delete pending[key];
      if (f.type === 'text') document.getElementById('k-' + key).value = f.default;
      else { document.getElementById('p-' + key).src = imgUrl(f.default); const a = document.getElementById('a-' + key); if (a) a.value = f.alt || ''; }
      b.hidden = true; toast('Original put back. Press Save this page to put it live.');
    });
    document.getElementById('page-save').addEventListener('click', async () => {
      if (Object.values(pending).some(p => p.busy)) return toast('Please wait for the photo to finish uploading', true);
      const changes = {}; const reset = [];
      fields.forEach(f => {
        const o = ov[f.key] || {};
        if (f.type === 'text') {
          const v = document.getElementById('k-' + f.key).value.replace(/\r/g, '').trim();
          const cur = typeof o.text === 'string' ? o.text : f.default;
          if (!v) return; // never blank a heading by accident
          if (v === f.default && typeof o.text === 'string') reset.push(f.key);
          else if (v !== cur) changes[f.key] = { text: v };
        } else {
          const a = document.getElementById('a-' + f.key);
          const alt = a ? a.value.trim() : undefined;
          const curAlt = typeof o.alt === 'string' ? o.alt : (f.alt || '');
          if (resets.has(f.key) && !pending[f.key] && (!a || alt === (f.alt || ''))) { if (o.src || typeof o.alt === 'string') reset.push(f.key); return; }
          const c = {};
          if (pending[f.key]) c.src = pending[f.key].src; else if (o.src && !resets.has(f.key)) c.src = o.src;
          if (a && alt !== curAlt) c.alt = alt; else if (typeof o.alt === 'string' && !resets.has(f.key)) c.alt = o.alt;
          if (pending[f.key] || (a && alt !== curAlt)) changes[f.key] = c;
        }
      });
      if (!Object.keys(changes).length && !reset.length) return toast('Nothing has changed yet');
      const btn = document.getElementById('page-save'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await api('/api/doc?name=overrides', { method: 'POST', body: { changes, reset } });
        toast('Saved. The website updates within a minute.');
        showPage(id);
      } catch (err) { if (err.message !== 'logged out') toast(err.message, true); btn.disabled = false; btn.textContent = 'Save this page'; }
    });
    box.querySelectorAll('.ed-auto').forEach(t => { const fit = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 4 + 'px'; }; t.addEventListener('input', fit); requestAnimationFrame(fit); });
  }

  // ── jobs & applications ───────────────────────────────────
  async function loadJobs(force) {
    if (state.jobs && !force) return state.jobs;
    const { data } = await api('/api/doc?name=jobs&fresh=1');
    state.jobs = Array.isArray(data) ? data : []; return state.jobs;
  }
  async function saveJobs(list, msg) {
    const { data } = await api('/api/doc?name=jobs', { method: 'POST', body: { data: list } });
    state.jobs = data; if (msg) toast(msg); return data;
  }
  const jobsTabs = active => `<div class="ed-tabs"><button class="ed-tab ${active === 'jobs' ? 'is-active' : ''}" data-go="jobs">Job vacancies</button><button class="ed-tab ${active === 'apps' ? 'is-active' : ''}" data-go="applications">Applications${state.appCount ? ` <span class="ed-count-pill">${state.appCount}</span>` : ''}</button></div>`;

  async function showJobs() {
    nav.hidden = false; setActive('jobs');
    app.innerHTML = `<div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span>Jobs</div>
      <h1>Jobs &amp; applications</h1>${jobsTabs('jobs')}
      <p class="ed-intro">Vacancies shown on the Careers page. People can apply using the form on that page.</p>
      <div class="ed-actions" style="margin-bottom:1.5rem"><button class="ed-btn ed-btn-primary" data-job="new">+ Add a job vacancy</button>
      <a class="ed-btn ed-btn-ghost" href="/careers.html#vacancies" target="_blank" rel="noopener">View the Careers page</a></div>
      <div id="jobs"><p class="ed-muted">Loading…</p></div>`;
    try {
      const jobs = await loadJobs(true); const box = document.getElementById('jobs');
      const today = new Date().toISOString().slice(0, 10);
      if (!jobs.length) { box.innerHTML = '<div class="ed-note">There are no vacancies at the moment. When there are none, the Careers page still shows the general roles you’re always keen to hear about.</div>'; return; }
      box.innerHTML = '<div class="ed-list">' + jobs.map((j, i) => {
        const closed = j.closing && j.closing < today;
        const badge = j.published === false ? ['ed-badge-hidden', 'Hidden'] : closed ? ['ed-badge-hidden', 'Closed'] : ['ed-badge-live', 'On the website'];
        return `<div class="ed-row ed-row-job"><div>
          <h3>${esc(j.title)}</h3>
          <div class="ed-meta"><span>${esc([j.location, j.hours].filter(Boolean).join(' · ') || 'No details yet')}</span>${j.closing ? `<span>·</span><span>Closes ${esc(fmtDate(j.closing))}</span>` : ''}<span class="ed-badge ${badge[0]}">${badge[1]}</span></div></div>
          <div class="ed-row-actions"><button class="ed-btn ed-btn-primary ed-btn-small" data-job="${i}">Edit</button>
          <button class="ed-btn ed-btn-ghost ed-btn-small" data-remove-job="${i}">Delete</button></div></div>`;
      }).join('') + '</div>';
    } catch (err) { if (err.message !== 'logged out') document.getElementById('jobs').innerHTML = `<div class="ed-error">${esc(err.message)}</div>`; }
  }

  function showJob(index) {
    nav.hidden = false; setActive('jobs');
    const isNew = index === 'new';
    const j = isNew ? { title: '', location: '', hours: 'Full time, permanent', salary: '', summary: '', description: '', closing: '', published: true } : { ...state.jobs[index] };
    app.innerHTML = `<div class="ed-narrow">
      <div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span><a href="#" data-go="jobs">Jobs</a><span>›</span>${isNew ? 'Add a vacancy' : 'Edit'}</div>
      <h1>${isNew ? 'Add a job vacancy' : 'Edit vacancy'}</h1>
      <form id="job-form" novalidate>
        <div class="ed-panel">
          <div class="ed-field"><label class="ed-label" for="j-title">Job title</label><span class="ed-hint">For example: Gas Engineer or Apprentice Plumber</span><input class="ed-input" id="j-title" value="${esc(j.title)}" maxlength="100"></div>
          <div class="ed-grid-2">
            <div class="ed-field"><label class="ed-label" for="j-location">Where</label><span class="ed-hint">e.g. Bristol &amp; Bath</span><input class="ed-input" id="j-location" value="${esc(j.location)}" maxlength="120"></div>
            <div class="ed-field"><label class="ed-label" for="j-hours">Hours &amp; contract</label><span class="ed-hint">e.g. Full time, permanent</span><input class="ed-input" id="j-hours" value="${esc(j.hours)}" maxlength="80"></div>
          </div>
          <div class="ed-grid-2">
            <div class="ed-field"><label class="ed-label" for="j-salary">Salary (optional)</label><span class="ed-hint">e.g. £38,000 to £45,000 plus van</span><input class="ed-input" id="j-salary" value="${esc(j.salary)}" maxlength="80"></div>
            <div class="ed-field"><label class="ed-label" for="j-closing">Closing date (optional)</label><span class="ed-hint">It comes off the website after this date</span><input class="ed-input" type="date" id="j-closing" value="${esc(j.closing)}"></div>
          </div>
        </div>
        <div class="ed-panel">
          <div class="ed-field"><label class="ed-label" for="j-summary">Short summary</label><span class="ed-hint">One or two sentences shown on the Careers page.</span>
            <textarea class="ed-textarea ed-short" id="j-summary" maxlength="400">${esc(j.summary)}</textarea></div>
          <div class="ed-field"><label class="ed-label" for="j-desc">Full job details (optional)</label>
            <span class="ed-hint">People see this when they press "Read more". Leave an empty line between paragraphs. Start a line with <code>-</code> for a bullet point, and put a short heading like <em>What you'll need</em> on its own line.</span>
            <textarea class="ed-textarea" id="j-desc" maxlength="6000" placeholder="What you'll be doing&#10;- Installing heating systems on new build sites&#10;- ...&#10;&#10;What you'll need&#10;- Gas Safe registered&#10;- Full UK driving licence">${esc(j.description)}</textarea></div>
        </div>
        <div class="ed-panel">
          <label class="ed-switch"><input type="checkbox" id="j-published" ${j.published !== false ? 'checked' : ''}> Show this on the website</label>
          <span class="ed-hint" style="margin:0.5rem 0 0">Untick to hide it, for example once the job has been filled.</span>
        </div>
        <div class="ed-actions"><button class="ed-btn ed-btn-primary" type="submit" id="j-save">Save</button>
          <button class="ed-btn ed-btn-ghost" type="button" data-go="jobs">Cancel</button></div>
      </form></div>`;
    const $ = id => document.getElementById(id);
    $('job-form').addEventListener('submit', async e => {
      e.preventDefault();
      Object.assign(j, { title: $('j-title').value.trim(), location: $('j-location').value.trim(), hours: $('j-hours').value.trim(), salary: $('j-salary').value.trim(),
        closing: $('j-closing').value, summary: $('j-summary').value.trim(), description: $('j-desc').value.trim(), published: $('j-published').checked });
      if (!j.title) { toast('Please add a job title', true); $('j-title').focus(); return; }
      const btn = $('j-save'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const list = (await loadJobs(true)).slice();
        if (isNew) list.unshift(j); else { const at = list.findIndex(x => x.id === j.id); at >= 0 ? (list[at] = j) : list.unshift(j); }
        await saveJobs(list, isNew ? 'Vacancy added' : 'Changes saved'); showJobs();
      } catch (err) { if (err.message !== 'logged out') toast(err.message, true); btn.disabled = false; btn.textContent = 'Save'; }
    });
  }

  const fmtWhen = iso => { try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
  async function loadApps() { const { applications } = await api('/api/apply'); state.apps = applications; state.appCount = applications.length; return applications; }

  async function showApplications() {
    nav.hidden = false; setActive('jobs');
    app.innerHTML = `<div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span>Jobs</div>
      <h1>Jobs &amp; applications</h1>${jobsTabs('apps')}
      <p class="ed-intro">Everyone who has applied through the Careers page, newest first.</p><div id="apps"><p class="ed-muted">Loading…</p></div>`;
    try {
      const apps = await loadApps(); const box = document.getElementById('apps');
      document.querySelector('.ed-tabs').outerHTML = jobsTabs('apps');
      if (!apps.length) { box.innerHTML = '<div class="ed-note">No applications yet. They’ll appear here as soon as someone applies.</div>'; return; }
      box.innerHTML = '<div class="ed-list">' + apps.map((a, i) => `<div class="ed-row ed-row-job"><div>
        <h3>${esc(a.firstName)} ${esc(a.lastName)}</h3>
        <div class="ed-meta"><span>${esc(a.position)}</span><span>·</span><span>${esc(fmtWhen(a.submitted))}</span>${a.callback ? '<span class="ed-badge ed-badge-live">Wants a call back</span>' : ''}</div></div>
        <div class="ed-row-actions"><button class="ed-btn ed-btn-primary ed-btn-small" data-app="${i}">Open</button></div></div>`).join('') + '</div>';
    } catch (err) { if (err.message !== 'logged out') document.getElementById('apps').innerHTML = `<div class="ed-error">${esc(err.message)}</div>`; }
  }

  function showApplication(i) {
    const a = state.apps[i]; if (!a) return showApplications();
    nav.hidden = false; setActive('jobs');
    const row = (k, v) => v ? `<div class="ed-detail"><span>${k}</span><div>${v}</div></div>` : '';
    app.innerHTML = `<div class="ed-narrow"><div class="ed-crumbs"><a href="#" data-go="home">Start</a><span>›</span><a href="#" data-go="applications">Applications</a><span>›</span>${esc(a.firstName)} ${esc(a.lastName)}</div>
      <h1>${esc(a.firstName)} ${esc(a.lastName)}</h1><p class="ed-intro">Applied for <strong>${esc(a.position)}</strong> on ${esc(fmtWhen(a.submitted))}.</p>
      <div class="ed-panel">
        ${row('Email', `<a href="mailto:${esc(a.email)}">${esc(a.email)}</a>`)}
        ${row('Phone', `<a href="tel:${esc(a.phone.replace(/\s/g, ''))}">${esc(a.phone)}</a>`)}
        ${row('Address', esc(a.address))}
        ${row('Call back?', a.callback ? 'Yes, they’d like a call to discuss' : 'No')}
      </div>
      <div class="ed-panel"><h2>About their experience</h2><p style="white-space:pre-wrap">${esc(a.experience)}</p></div>
      <div class="ed-panel"><h2>Documents</h2><div class="ed-actions">
        ${a.cv ? `<a class="ed-btn ed-btn-mint" href="${esc(a.cv.url)}" target="_blank" rel="noopener">Open CV</a>` : ''}
        ${a.cover ? `<a class="ed-btn ed-btn-ghost" href="${esc(a.cover.url)}" target="_blank" rel="noopener">Open covering letter</a>` : ''}</div></div>
      <div class="ed-actions"><a class="ed-btn ed-btn-primary" href="mailto:${esc(a.email)}?subject=${encodeURIComponent('Your application to GasWorld: ' + a.position)}">Reply by email</a>
        <button class="ed-btn ed-btn-ghost" data-remove-app="${i}">Delete application</button></div>
      <p class="ed-hint" style="margin-top:1.25rem">Please delete applications once you no longer need them, so you're not keeping people's personal details longer than necessary.</p></div>`;
  }

  // ── routing & events ──────────────────────────────────────
  document.addEventListener('click', async e => {
    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      if (go.dataset.go === 'home') showHome();
      else if (go.dataset.go === 'list') showList();
      else if (go.dataset.go === 'help') showHelp();
      else if (go.dataset.go === 'team') showTeam();
      else if (go.dataset.go === 'pages') showPages();
      else if (go.dataset.go === 'jobs') showJobs();
      else if (go.dataset.go === 'applications') showApplications();
      return;
    }
    const mem = e.target.closest('[data-member]');
    if (mem) { showMember(mem.dataset.member === 'new' ? 'new' : Number(mem.dataset.member)); return; }
    const mv = e.target.closest('[data-move]');
    if (mv) { const [i, d] = mv.dataset.move.split(':').map(Number); moveMember(i, d); return; }
    const rm = e.target.closest('[data-remove-member]');
    if (rm) {
      const i = Number(rm.dataset.removeMember); const m = state.team[i];
      const ok = await confirmBox('Remove ' + m.name + '?', `${m.name} will be taken off the website. This can't be undone, but you can always add them again.`, 'Yes, remove them');
      if (!ok) return;
      const list = state.team.filter((_, n) => n !== i);
      try { drawTeam(await saveTeam(list, m.name + ' has been removed')); } catch (err) { if (err.message !== 'logged out') toast(err.message, true); }
      return;
    }
    const jb = e.target.closest('[data-job]');
    if (jb) { showJob(jb.dataset.job === 'new' ? 'new' : Number(jb.dataset.job)); return; }
    const rj = e.target.closest('[data-remove-job]');
    if (rj) {
      const i = Number(rj.dataset.removeJob); const j = state.jobs[i];
      const ok = await confirmBox('Delete this vacancy?', `"${j.title}" will be removed from the Careers page. If you might use it again, edit it and untick "Show this on the website" instead.`, 'Yes, delete it');
      if (!ok) return;
      try { await saveJobs(state.jobs.filter((_, n) => n !== i), 'Vacancy deleted'); showJobs(); } catch (err) { if (err.message !== 'logged out') toast(err.message, true); }
      return;
    }
    const ap = e.target.closest('[data-app]');
    if (ap) { showApplication(Number(ap.dataset.app)); return; }
    const ra = e.target.closest('[data-remove-app]');
    if (ra) {
      const a = state.apps[Number(ra.dataset.removeApp)];
      const ok = await confirmBox('Delete this application?', `${a.firstName} ${a.lastName}'s application and CV will be deleted for good. This can't be undone.`, 'Yes, delete it');
      if (!ok) return;
      try { await api('/api/apply?id=' + a.id, { method: 'DELETE' }); toast('Application deleted'); showApplications(); } catch (err) { if (err.message !== 'logged out') toast(err.message, true); }
      return;
    }
    const pg = e.target.closest('[data-page]');
    if (pg) { showPage(pg.dataset.page); return; }
    const nw = e.target.closest('[data-new]');
    if (nw) { showForm({ type: nw.dataset.new }); return; }
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const posts = await loadPosts();
      const p = posts.find(x => x.id === ed.dataset.edit);
      if (p) showForm(JSON.parse(JSON.stringify(p)));
      return;
    }
    const del = e.target.closest('[data-delete]');
    if (del) {
      const p = (state.posts || []).find(x => x.id === del.dataset.delete);
      const ok = await confirmBox('Delete this post?', `"${p ? p.title : 'This post'}" will be removed from the website. This can't be undone. If you might want it back, edit it and untick "Show this on the website" instead.`, 'Yes, delete it');
      if (!ok) return;
      try { const { posts } = await api('/api/posts?id=' + encodeURIComponent(del.dataset.delete), { method: 'DELETE' }); state.posts = posts; toast('Post deleted'); showList(); }
      catch (err) { if (err.message !== 'logged out') toast(err.message, true); }
      return;
    }
    const out = e.target.closest('[data-action="logout"]');
    if (out) { e.preventDefault(); await fetch('/api/logout', { method: 'POST' }); showLogin(); }
  });

  // ── start ─────────────────────────────────────────────────
  (async () => {
    try {
      const r = await fetch('/api/session', { credentials: 'same-origin' });
      const info = await r.json();
      if (!info.password || !info.storage) return showNotReady(info);
      info.loggedIn ? showHome() : showLogin();
    } catch {
      app.innerHTML = '<div class="ed-error">The editing area could not be reached. Please refresh the page.</div>';
    }
  })();
})();
