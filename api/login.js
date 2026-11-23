import { checkPassword, passwordMatchesIgnoringCase, makeSessionCookie, hasPassword } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasPassword()) return res.status(503).json({ error: 'The editing area has not been given a password yet.' });
  // small delay to slow down guessing
  await new Promise(r => setTimeout(r, 400));
  let body;
  try { body = req.body; } catch { body = undefined; }
  if (body === undefined || body === null) {
    let raw = '';
    try { for await (const c of req) raw += c; } catch {}
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  }
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (Buffer.isBuffer(body)) { try { body = JSON.parse(body.toString('utf8')); } catch { body = {}; } }
  const password = body && body.password;
  if (typeof password !== 'string' || !password.trim()) return res.status(400).json({ error: 'Please type the password.', code: 'empty' });
  if (!checkPassword(password)) {
    if (passwordMatchesIgnoringCase(password)) return res.status(401).json({ error: 'Nearly! Check whether Caps Lock is on, the password is case sensitive.', code: 'case' });
    return res.status(401).json({ error: 'That password is not right. Please try again.', code: 'wrong' });
  }
  res.setHeader('Set-Cookie', makeSessionCookie());
  res.status(200).json({ ok: true });
}
