const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const adminId = '69e0817cd7e470c699ce0bdd';

if (!JWT_SECRET) {
  console.error('JWT_SECRET not found in environment');
  process.exit(1);
}

// Generate token manually to match backend decode logic
// authMiddleware expects 'decoded.id'
const token = jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: '24h' });

console.log('--- ADMIN TOKEN GENERATED ---');
console.log(token);
console.log('------------------------------');
