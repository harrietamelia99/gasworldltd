// Job applications from the Careers page. Anyone can send one; only logged-in staff can read them.
// Each application gets its own unguessable folder in storage, so nothing is publicly listed.
import crypto from 'node:crypto';
import { put, list, del } from '@vercel/blob';
import { hasStorage, requireLogin } from './_lib.js';

export const config = { api: { bodyParser: { sizeLimit: '4.4mb' } } };

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
const FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

async function saveFile(folder, label, file) {
  if (!file || !file.dataUrl) return null;
  const m = /^data:([^;]+);base64,(.+)$/.exec(file.dataUrl);
  if (!m || !FILE_TYPES[m[1]]) throw new Error('Please upload your CV as a PDF or Word document.');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 3 * 1024 * 1024) throw new Error('That file is too large. Please keep it under 3MB.');
  const original = clean(file.name, 120) || `${label}.${FILE_TYPES[m[1]]}`;
  const safe = original.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || label;
  const blob = await put(`applications/${folder}/${label}-${safe}.${FILE_TYPES[m[1]]}`, buf, { access: 'public', addRandomSuffix: false, contentType: m[1] });
  return { name: original, url: blob.url };
}

async function listApplications() {
  const out = []; let cursor;
  do {
    const r = await list({ prefix: 'applications/', cursor, limit: 1000 });
    out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

export default async function handler(req, res) {
  if (!hasStorage()) return res.status(503).json({ error: 'Applications are not switched on yet. Please email us instead.' });
  try {
    if (req.method === 'POST') {
      const b = req.body || {};
      if (b.website) return res.status(200).json({ ok: true }); // spam trap
      const app = {
        submitted: new Date().toISOString(),
        firstName: clean(b.first_name, 60), lastName: clean(b.last_name, 60),
        email: clean(b.email, 120), phone: clean(b.phone, 40), address: clean(b.address, 200),
        position: clean(b.position, 120), experience: clean(b.experience, 5000),
        callback: !!b.callback,
      };
      if (!app.firstName || !app.lastName || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(app.email) || !app.phone || !app.position || !app.experience)
        return res.status(400).json({ error: 'Please fill in all the boxes marked with a *.' });
      if (!b.consent) return res.status(400).json({ error: 'Please tick the box to agree to us storing your details.' });
      if (!b.cv || !b.cv.dataUrl) return res.status(400).json({ error: 'Please attach your CV.' });
      const folder = crypto.randomBytes(16).toString('hex');
      app.id = folder;
      app.cv = await saveFile(folder, 'cv', b.cv);
      app.cover = await saveFile(folder, 'cover-letter', b.cover);
      await put(`applications/${folder}/application.json`, JSON.stringify(app), { access: 'public', addRandomSuffix: false, contentType: 'application/json' });
      return res.status(200).json({ ok: true });
    }

    if (!requireLogin(req, res)) return;
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
      const blobs = (await listApplications()).filter(x => x.pathname.endsWith('/application.json'));
      const apps = (await Promise.all(blobs.map(async x => { try { return await (await fetch(x.url, { cache: 'no-store' })).json(); } catch { return null; } }))).filter(Boolean);
      apps.sort((a, b) => (b.submitted || '').localeCompare(a.submitted || ''));
      return res.status(200).json({ applications: apps });
    }
    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!/^[a-f0-9]{32}$/.test(id)) return res.status(400).json({ error: 'Not found' });
      const r = await list({ prefix: `applications/${id}/` });
      if (r.blobs.length) await del(r.blobs.map(x => x.url));
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}
