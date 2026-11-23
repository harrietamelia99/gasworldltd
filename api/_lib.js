// Shared helpers for the GasWorld editing area.
// Content (posts) and uploaded photos live in Vercel Blob storage.
// Login uses one shared password set in Vercel as ADMIN_PASSWORD.
import crypto from 'node:crypto';
import { put, list, del } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';

const COOKIE = 'gw_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const secret = () => {
  const pw = (process.env.ADMIN_PASSWORD || '').trim();
  return crypto.createHash('sha256').update('gasworld-editor:' + pw).digest();
};

export const hasStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const hasPassword = () => Boolean((process.env.ADMIN_PASSWORD || '').trim());

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function makeSessionCookie() {
  const expires = Date.now() + MAX_AGE * 1000;
  const token = `${expires}.${sign(String(expires))}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function isLoggedIn(req) {
  if (!hasPassword()) return false;
  const raw = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [expires, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const expected = sign(expires);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function passwordMatchesIgnoringCase(attempt) {
  const pw = (process.env.ADMIN_PASSWORD || '').trim().replace(/^["']|["']$/g, '');
  return typeof attempt === 'string' && pw.length > 0 && attempt.trim().toLowerCase() === pw.toLowerCase();
}

export function checkPassword(attempt) {
  // Ignore stray spaces or line breaks either side (easy to add when pasting).
  const pw = (process.env.ADMIN_PASSWORD || '').trim().replace(/^["']|["']$/g, '');
  if (!pw || typeof attempt !== 'string') return false;
  const a = crypto.createHash('sha256').update(attempt.trim()).digest();
  const b = crypto.createHash('sha256').update(pw).digest();
  return crypto.timingSafeEqual(a, b);
}

export function requireLogin(req, res) {
  if (isLoggedIn(req)) return true;
  res.status(401).json({ error: 'Please log in again.' });
  return false;
}

async function readSeedFile(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(process.cwd(), 'content', file), 'utf8'));
  } catch {
    return fallback;
  }
}

const SEEDS = {
  posts: async () => (await readSeedFile('seed-posts.json', { posts: [] })).posts || [],
  team: async () => (await readSeedFile('seed-team.json', { members: [] })).members || [],
  overrides: async () => ({}),
  jobs: async () => (await readSeedFile('seed-jobs.json', { jobs: [] })).jobs || [],
};

// Each save writes a new, uniquely named file so nobody ever sees a stale copy.
// The newest file is the live one; older ones are kept as a short history.
export async function readDoc(name) {
  const seed = SEEDS[name];
  if (!seed) throw new Error('Unknown content');
  if (!hasStorage()) return seed();
  const { blobs } = await list({ prefix: `content/${name}-` });
  if (!blobs.length) return seed();
  blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
  const r = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!r.ok) throw new Error('Could not read saved content');
  const json = await r.json();
  return json.data ?? json.posts ?? json;
}

export async function writeDoc(name, data) {
  if (!hasStorage()) throw new Error('Storage is not connected yet.');
  const stamp = String(Date.now()).padStart(15, '0');
  await put(`content/${name}-${stamp}.json`, JSON.stringify({ data }, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  const { blobs } = await list({ prefix: `content/${name}-` });
  blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
  const old = blobs.slice(30).map(b => b.url);
  if (old.length) await del(old);
}

export const readPosts = () => readDoc('posts');
export const writePosts = posts => writeDoc('posts', posts);

export async function savePhoto(dataUrl, name) {
  if (!hasStorage()) throw new Error('Storage is not connected yet.');
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('That file is not a photo we can use.');
  const buf = Buffer.from(m[3], 'base64');
  if (buf.length > 3.5 * 1024 * 1024) throw new Error('That photo is too large.');
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
  const safe = String(name || 'photo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'photo';
  const blob = await put(`uploads/${Date.now()}-${safe}.${ext}`, buf, {
    access: 'public',
    addRandomSuffix: true,
    contentType: m[1],
  });
  return blob.url;
}

export const safeSrc = v => {
  const s = String(v || '').trim();
  return /^(https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\/|\/img\/|img\/)/i.test(s) || s === '' ? s : '';
};

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'post';
}

const clean = (v, max = 5000) => String(v ?? '').replace(/—/g, ', ').trim().slice(0, max);

export function sanitisePost(input, existing = {}) {
  const type = input.type === 'news' ? 'news' : 'case-study';
  const facts = Array.isArray(input.facts) ? input.facts
    .map(f => ({ label: clean(f.label, 40), value: clean(f.value, 200) }))
    .filter(f => f.label && f.value).slice(0, 6) : [];
  const gallery = Array.isArray(input.gallery) ? input.gallery
    .map(g => ({ src: clean(g.src, 500), alt: clean(g.alt, 150) }))
    .filter(g => g.src).slice(0, 12) : [];
  return {
    ...existing,
    type,
    title: clean(input.title, 120),
    summary: clean(input.summary, 300),
    date: /^\d{4}-\d{2}-\d{2}$/.test(input.date || '') ? input.date : new Date().toISOString().slice(0, 10),
    image: clean(input.image, 500),
    imageAlt: clean(input.imageAlt, 150) || clean(input.title, 120),
    body: clean(input.body, 12000),
    facts: type === 'case-study' ? facts : [],
    gallery,
    tag: type === 'news' ? 'News' : clean(input.tag, 40) || 'Case Study',
    published: input.published !== false,
    updated: new Date().toISOString(),
  };
}
