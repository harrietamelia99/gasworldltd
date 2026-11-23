import { requireLogin, savePhoto } from './_lib.js';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireLogin(req, res)) return;
  try {
    const { dataUrl, name } = req.body || {};
    const url = await savePhoto(dataUrl, name);
    res.status(200).json({ url });
  } catch (err) {
    res.status(400).json({ error: err.message || 'The photo could not be uploaded.' });
  }
}
