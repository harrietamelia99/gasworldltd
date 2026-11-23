/* GasWorld editing area: add, edit and remove news posts and case studies. */
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
    help: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>',
  };

  let state = { posts: null };

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
        <button class="ed-card" data-go="help">
          <span class="ed-card-icon">${icons.help}</span>
          <h2>Help</h2>
          <p>Simple tips on writing posts and choosing good photos.</p>
        </button>
      </div>`;
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
        <p>You can add, edit, hide and delete the <strong>news posts</strong> and <strong>case studies</strong> on the website. Your latest three case studies also appear on the Home and Projects pages automatically.</p>
        <p>For anything else (team members, page wording, services), just send the change to Collectiv. Studio.</p>
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

  // ── routing & events ──────────────────────────────────────
  document.addEventListener('click', async e => {
    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      if (go.dataset.go === 'home') showHome();
      else if (go.dataset.go === 'list') showList();
      else if (go.dataset.go === 'help') showHelp();
      return;
    }
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
