/* GasWorld careers: live vacancies from the editing area, and the application form */
(function () {
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
  function body(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n').map(l => l.trim());
    let out = '', para = [], list = [];
    const flushP = () => { if (para.length) out += `<p>${para.map(esc).join('<br>')}</p>`; para = []; };
    const flushL = () => { if (list.length) out += '<ul>' + list.map(l => `<li>${esc(l)}</li>`).join('') + '</ul>'; list = []; };
    lines.forEach((l, i) => {
      if (!l) { flushP(); flushL(); return; }
      if (/^[-•*]\s+/.test(l)) { flushP(); list.push(l.replace(/^[-•*]\s+/, '')); return; }
      flushL();
      const next = lines[i + 1] || '', prev = lines[i - 1] || '';
      if (l.length < 60 && !/[.!?,]$/.test(l) && !para.length && (!next || /^[-•*]\s+/.test(next)) && !prev.match(/^[^-•*].*[^.!?]$/)) { out += `<h4>${esc(l)}</h4>`; return; }
      para.push(l);
    });
    flushP(); flushL(); return out;
  }
  const listEl = document.querySelector('[data-jobs]');
  const select = document.querySelector('[data-job-options]');
  const form = document.querySelector('[data-apply-form]');

  function pick(title) {
    if (!select || !title) return;
    let opt = [...select.options].find(o => o.value === title || o.text === title);
    if (!opt) { opt = new Option(title, title); select.insertBefore(opt, select.options[1]); }
    select.value = opt.value;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-apply-for]'); if (a) pick(a.dataset.applyFor);
    const t = e.target.closest('[data-job-toggle]');
    if (t) { const d = document.getElementById(t.getAttribute('aria-controls')); const open = d.hidden; d.hidden = !open; t.setAttribute('aria-expanded', open); t.textContent = open ? 'Hide details' : 'Read more'; }
  });

  if (listEl) {
    fetch('/api/doc?name=jobs').then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !Array.isArray(j.data)) return;
      const today = new Date().toISOString().slice(0, 10);
      const jobs = j.data.filter(x => x.published !== false && (!x.closing || x.closing >= today));
      if (!jobs.length) { listEl.hidden = true; return; }
      listEl.innerHTML = jobs.map((job, i) => {
        const meta = [job.location, job.hours, job.salary].filter(Boolean).map(esc).join(' &middot; ');
        return `<div class="job-card">
          <div class="job-card-head"><div>
            <span class="job-pill">Now hiring</span>
            <h3 class="job-title">${esc(job.title)}</h3>
            ${meta ? `<p class="job-meta">${meta}</p>` : ''}
          </div><a href="#apply" class="btn btn-mint" data-apply-for="${esc(job.title)}">Apply now</a></div>
          ${job.summary ? `<p class="job-summary">${esc(job.summary)}</p>` : ''}
          ${job.description ? `<button type="button" class="job-toggle" data-job-toggle aria-expanded="false" aria-controls="job-${i}">Read more</button><div class="job-desc" id="job-${i}" hidden>${body(job.description)}</div>` : ''}
          ${job.closing ? `<p class="job-closing">Closing date: ${esc(fmt(job.closing))}</p>` : ''}
        </div>`;
      }).join('');
      if (select) [...jobs].reverse().forEach(job => { if (![...select.options].some(o => o.value === job.title)) select.insertBefore(new Option(job.title, job.title), select.options[1]); });
    }).catch(() => {});
  }

  if (!form) return;
  const readFile = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  const OK_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  function guessType(f) {
    if (OK_TYPES.includes(f.type)) return f.type;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    return { pdf: OK_TYPES[0], doc: OK_TYPES[1], docx: OK_TYPES[2] }[ext] || '';
  }
  const errBox = form.querySelector('.form-error');
  const showErr = msg => { errBox.textContent = msg; errBox.hidden = !msg; };
  form.addEventListener('submit', async e => {
    e.preventDefault(); showErr('');
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = f.type === 'checkbox' ? !f.checked : f.type === 'file' ? !f.files.length : !f.value.trim();
      f.style.borderColor = bad ? '#e74c3c' : ''; if (bad) valid = false;
    });
    if (!valid) return showErr('Please fill in all the boxes marked with a * and tick the consent box.');
    const files = {};
    for (const [key, id] of [['cv', 'c-cv'], ['cover', 'c-cover']]) {
      const f = form.querySelector('#' + id).files[0]; if (!f) continue;
      const type = guessType(f);
      if (!type) return showErr('Please upload your CV and covering letter as a PDF or Word document.');
      if (f.size > 3 * 1024 * 1024) return showErr(`"${f.name}" is too large. Please keep files under 3MB.`);
      files[key] = { name: f.name, dataUrl: (await readFile(f)).replace(/^data:[^;]*;/, `data:${type};`) };
    }
    const cvSize = (files.cv ? files.cv.dataUrl.length : 0) + (files.cover ? files.cover.dataUrl.length : 0);
    if (cvSize > 4.2 * 1024 * 1024) return showErr('Your files are too large together. Please keep them under 3MB in total.');
    const fd = new FormData(form); const data = {};
    ['website', 'first_name', 'last_name', 'email', 'phone', 'address', 'position', 'experience'].forEach(k => { data[k] = fd.get(k) || ''; });
    data.callback = !!fd.get('callback'); data.consent = !!fd.get('consent');
    Object.assign(data, files);
    const btn = form.querySelector('button[type="submit"]'); const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const r = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
      form.innerHTML = '<div class="apply-done"><h3>Thank you, your application has been sent</h3><p>We review every application and will be in touch within 5 working days.</p></div>';
    } catch (err) {
      showErr(err.message === 'Failed to fetch' ? 'We couldn’t send your application. Please check your connection and try again.' : err.message);
      btn.disabled = false; btn.textContent = label;
    }
  });
})();
