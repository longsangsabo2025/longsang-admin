const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment or generate one
const getEncryptionKey = () => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    // Ensure key is 32 bytes
    return crypto.createHash('sha256').update(envKey).digest();
  }
  // For development, use a consistent key (NOT for production!)
  return crypto.createHash('sha256').update('dev-encryption-key-change-in-production').digest();
};

/**
 * Encrypt sensitive data
 */
const encrypt = (text) => {
  if (!text) return null;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv + authTag + encrypted (all in hex)
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
};

/**
 * Decrypt sensitive data
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const key = getEncryptionKey();
    
    // Extract iv, authTag, and encrypted data
    const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex');
    const authTag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedText.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * POST /api/credentials/encrypt
 * Encrypt sensitive data
 */
router.post('/encrypt', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    const encrypted = encrypt(data);
    res.json({ encrypted });
  } catch (error) {
    console.error('Encryption error:', error);
    res.status(500).json({ error: 'Encryption failed' });
  }
});

/**
 * POST /api/credentials/decrypt
 * Decrypt sensitive data
 */
router.post('/decrypt', (req, res) => {
  try {
    const { encrypted } = req.body;
    
    if (!encrypted) {
      return res.status(400).json({ error: 'Encrypted data is required' });
    }
    
    const decrypted = decrypt(encrypted);
    
    if (decrypted === null) {
      return res.status(400).json({ error: 'Decryption failed' });
    }
    
    res.json({ decrypted });
  } catch (error) {
    console.error('Decryption error:', error);
    res.status(500).json({ error: 'Decryption failed' });
  }
});

/**
 * POST /api/credentials
 * Store encrypted credential
 */
router.post('/', (req, res) => {
  try {
    const { name, category, username, password, apiKey, notes, url, tags } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    
    // Encrypt sensitive fields
    const encryptedPassword = password ? encrypt(password) : null;
    const encryptedApiKey = apiKey ? encrypt(apiKey) : null;
    
    const credential = {
      name,
      category,
      username,
      encrypted_password: encryptedPassword,
      encrypted_api_key: encryptedApiKey,
      notes,
      url,
      tags,
      created_at: new Date().toISOString()
    };
    
    res.json({ 
      success: true, 
      credential,
      message: 'Credential encrypted successfully'
    });
  } catch (error) {
    console.error('Store credential error:', error);
    res.status(500).json({ error: 'Failed to store credential' });
  }
});

/**
 * POST /api/credentials/batch-encrypt
 * Encrypt multiple credentials at once
 */
router.post('/batch-encrypt', (req, res) => {
  try {
    const { credentials } = req.body;
    
    if (!Array.isArray(credentials)) {
      return res.status(400).json({ error: 'Credentials must be an array' });
    }
    
    const encrypted = credentials.map(cred => ({
      ...cred,
      encrypted_password: cred.password ? encrypt(cred.password) : null,
      encrypted_api_key: cred.apiKey ? encrypt(cred.apiKey) : null,
      password: undefined,
      apiKey: undefined
    }));
    
    res.json({ encrypted });
  } catch (error) {
    console.error('Batch encryption error:', error);
    res.status(500).json({ error: 'Batch encryption failed' });
  }
});

/**
 * POST /api/credentials/verify
 * Verify encryption/decryption works
 */
router.post('/verify', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    const encrypted = encrypt(data);
    const decrypted = decrypt(encrypted);
    
    const success = decrypted === data;
    
    res.json({ 
      success,
      original: data,
      encrypted,
      decrypted,
      match: success
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
