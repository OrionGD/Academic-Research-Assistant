require('dotenv').config({ path: __dirname + '/../.env' });
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.log('JWT_SECRET: MISSING');
  process.exit(1);
}

console.log('JWT_SECRET: OK');

const payload = { id: 'test123', email: 'test@example.com', role: 'user' };
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('Test Token:', token.substring(0, 50) + '...');

const verified = jwt.verify(token, secret);
console.log('Verification:', verified.email === payload.email ? 'PASSED' : 'FAILED');
console.log('Decoded:', JSON.stringify(verified));

process.exit(0);