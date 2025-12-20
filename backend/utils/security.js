const crypto = require('crypto');

// 32 bytes => 256-bit token, base64url for compact QR payload
const generateRawToken = () => crypto.randomBytes(32).toString('base64url');

const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = {
  generateRawToken,
  hashToken,
};
