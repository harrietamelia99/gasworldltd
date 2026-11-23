import { isLoggedIn, hasStorage, hasPassword } from './_lib.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ loggedIn: isLoggedIn(req), storage: hasStorage(), password: hasPassword() });
}
