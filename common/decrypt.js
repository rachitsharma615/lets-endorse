const crypto = require('crypto');  
// Encryption functions
exports.decryptMessage = (message, key) => {
    if (key.length !== 64) {
      throw new Error('Invalid encryption key length. Key must be 32 bytes (64 hex characters).');
    }
  
    console.log("Message is", message)
    const [ivHex, encrypted] = message.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };