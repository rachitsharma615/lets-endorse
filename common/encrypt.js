const crypto = require('crypto');
  // Encryption functions
exports.encryptMessage = (message, key) => {
    if (key.length !== 64) {
        throw new Error('Invalid encryption key length. Key must be 32 bytes (64 hex characters).');
      }
    
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
      let encrypted = cipher.update(message, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
  }