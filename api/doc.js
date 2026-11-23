// Team members and page text/photo changes.
// GET is public (the website reads it); POST needs to be logged in.
import { readDoc, writeDoc, requireLogin, isLoggedIn, safeSrc, slugify } from './_lib.js';

const clean = (v, max) => String(v ?? '').replace(/—/g, ', ').trim().slice(0, max);

function sanitiseTeam(list) {
  if (!Array.isArray(list)) throw new Error('Something went wrong saving the team.');
  const seen = new Set();
  return list.slice(0, 60).map(m => {
    let id = clean(m.id, 80) || slugify(m.name);
    while (seen.has(id)) id += '-2';
    seen.add(id);
    return {
      id,
      name: clean(m.name, 80),
      role: clean(m.role, 100),
      bio: clean(m.bio, 1500),
      photo: safeSrc(m.photo),
      group: m.group === 'team' ? 'team' : 'directors',
    };
  }).filter(m => m.name);
}

function sanitiseJobs(list) {
  if (!Array.isArray(list)) throw new Error('Something went wrong saving the jobs.');
  const seen = new Set();
  return list.slice(0, 40).map(j => {
    let id = clean(j.id, 80) || (slugify(j.title) + '-' + Date.now().toString(36));
    while (seen.has(id)) id += '-2';
    seen.add(id);
    return {
      id,
      title: clean(j.title, 100),
      location: clean(j.location, 120),
      hours: clean(j.hours, 80),
      salary: clean(j.salary, 80),
      summary: clean(j.summary, 400),
      description: clean(j.description, 6000),
      closing: /^\d{4}-\d{2}-\d{2}$/.test(j.closing || '') ? j.closing : '',
      published: j.published !== false,
    };
  }).filter(j => j.title);
}

function sanitiseOverrides(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Something went wrong saving the page.');
  const out = {};
  for (const [key, val] of Object.entries(obj).slice(0, 2000)) {
    if (!/^[a-z0-9-]{1,60}$/.test(key) || !val || typeof val !== 'object') continue;
    const v = {};
    if (typeof val.text === 'string') v.text = clean(val.text, 3000);
    if (typeof val.src === 'string') { const s = safeSrc(val.src); if (s) v.src = s; }
    if (typeof val.alt === 'string') v.alt = clean(val.alt, 200);
    if (Object.keys(v).length) out[key] = v;
  }
  return out;
}

export default async function handler(req, res) {
  const name = req.query.name;
  if (!['team', 'overrides', 'jobs'].includes(name)) return res.status(404).json({ error: 'Not found' });
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', req.query.fresh === '1' ? 'no-store' : 'public, s-maxage=20, stale-while-revalidate=300');
      let data = await readDoc(name);
      if (name === 'jobs') {
        if (isLoggedIn(req)) res.setHeader('Cache-Control', 'no-store');
        else { const today = new Date().toISOString().slice(0, 10); data = (data || []).filter(j => j.published !== false && (!j.closing || j.closing >= today)); }
      }
      return res.status(200).json({ data });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireLogin(req, res)) return;
    const body = req.body || {};
    if (name === 'team') {
      const data = sanitiseTeam(body.data);
      await writeDoc('team', data);
      return res.status(200).json({ ok: true, data });
    }
    if (name === 'jobs') {
      const data = sanitiseJobs(body.data);
      await writeDoc('jobs', data);
      return res.status(200).json({ ok: true, data });
    }
    // overrides: merge just the changed keys so two people editing different pages don't clash
    const current = await readDoc('overrides');
    const changes = sanitiseOverrides(body.changes || {});
    const merged = { ...current, ...changes };
    for (const key of Array.isArray(body.reset) ? body.reset : []) delete merged[key];
    await writeDoc('overrides', merged);
    return res.status(200).json({ ok: true, data: merged });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}
