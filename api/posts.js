import { readPosts, writePosts, requireLogin, isLoggedIn, sanitisePost, slugify } from './_lib.js';

const sortPosts = posts => posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const all = req.query.all === '1' && isLoggedIn(req);
      let posts = await readPosts();
      if (!all) posts = posts.filter(p => p.published !== false);
      res.setHeader('Cache-Control', all ? 'no-store' : 'public, s-maxage=20, stale-while-revalidate=300');
      return res.status(200).json({ posts: sortPosts(posts) });
    }

    if (!requireLogin(req, res)) return;
    const posts = await readPosts();

    if (req.method === 'POST') {
      const input = req.body || {};
      if (!String(input.title || '').trim()) return res.status(400).json({ error: 'Please add a title.' });
      const idx = input.id ? posts.findIndex(p => p.id === input.id) : -1;
      if (idx >= 0) {
        posts[idx] = sanitisePost(input, posts[idx]);
      } else {
        let slug = slugify(input.title);
        const taken = new Set(posts.map(p => p.slug));
        let n = 2; const base = slug;
        while (taken.has(slug)) slug = `${base}-${n++}`;
        posts.push({ id: slug + '-' + Date.now().toString(36), slug, ...sanitisePost(input) });
      }
      await writePosts(posts);
      return res.status(200).json({ ok: true, posts: sortPosts(posts) });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      const next = posts.filter(p => p.id !== id);
      if (next.length === posts.length) return res.status(404).json({ error: 'That post could not be found.' });
      await writePosts(next);
      return res.status(200).json({ ok: true, posts: sortPosts(next) });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}
