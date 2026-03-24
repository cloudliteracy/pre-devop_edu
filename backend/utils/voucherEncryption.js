const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.VOUCHER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

// Ensure key is 32 bytes
const getKey = () => {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  return key;
};

const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt voucher code');
  }
};

const decrypt = (text) => {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt voucher code');
  }
};

const maskCode = (code) => {
  if (!code || code.length < 8) return '****-****';
  const decrypted = decrypt(code);
  const parts = decrypted.split('-');
  if (parts.length > 1) {
    return parts.map((part, idx) => idx === parts.length - 1 ? part : '****').join('-');
  }
  return decrypted.slice(0, 4) + '****' + decrypted.slice(-4);
};

module.exports = {
  encrypt,
  decrypt,
  maskCode
};
