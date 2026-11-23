import { checkPassword, makeSessionCookie, hasPassword } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasPassword()) return res.status(503).json({ error: 'The editing area has not been given a password yet.' });
  // small delay to slow down guessing
  await new Promise(r => setTimeout(r, 400));
  const { password } = req.body || {};
  if (!checkPassword(password)) return res.status(401).json({ error: 'That password is not right. Please try again.' });
  res.setHeader('Set-Cookie', makeSessionCookie());
  res.status(200).json({ ok: true });
}
