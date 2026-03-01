const API_BASE_URL = 'http://localhost:3001/api';

export interface EncryptedCredential {
  name: string;
  category: string;
  username?: string;
  encrypted_password?: string;
  encrypted_api_key?: string;
  notes?: string;
  url?: string;
  tags?: string[];
  is_favorite?: boolean;
}

/**
 * Encrypt sensitive data using the backend API
 */
export async function encryptData(data: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/credentials/encrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    throw new Error('Encryption failed');
  }

  const result = await response.json();
  return result.encrypted;
}

/**
 * Decrypt sensitive data using the backend API
 */
export async function decryptData(encrypted: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/credentials/decrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ encrypted }),
  });

  if (!response.ok) {
    throw new Error('Decryption failed');
  }

  const result = await response.json();
  return result.decrypted;
}

/**
 * Store encrypted credential
 */
export async function storeCredential(credential: {
  name: string;
  category: string;
  username?: string;
  password?: string;
  apiKey?: string;
  notes?: string;
  url?: string;
  tags?: string[];
}): Promise<EncryptedCredential> {
  const response = await fetch(`${API_BASE_URL}/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credential),
  });

  if (!response.ok) {
    throw new Error('Failed to store credential');
  }

  const result = await response.json();
  return result.credential;
}

/**
 * Batch encrypt multiple credentials
 */
export async function batchEncryptCredentials(
  credentials: Array<{
    name: string;
    category: string;
    password?: string;
    apiKey?: string;
    [key: string]: any;
  }>
): Promise<EncryptedCredential[]> {
  const response = await fetch(`${API_BASE_URL}/credentials/batch-encrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credentials }),
  });

  if (!response.ok) {
    throw new Error('Batch encryption failed');
  }

  const result = await response.json();
  return result.encrypted;
}

/**
 * Verify encryption/decryption works
 */
export async function verifyEncryption(data: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/credentials/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.success;
}
