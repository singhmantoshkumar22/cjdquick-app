/**
 * AES-256-GCM Encryption for Credentials
 *
 * Provides secure encryption for storing API credentials,
 * tokens, and other sensitive integration data.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

// Constants
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 32;
const SCRYPT_N = 16384; // CPU/memory cost parameter
const SCRYPT_R = 8; // Block size
const SCRYPT_P = 1; // Parallelization parameter

/**
 * Encryption result containing all components needed for decryption
 */
export interface EncryptedData {
  /** Base64 encoded encrypted ciphertext */
  ciphertext: string;
  /** Base64 encoded initialization vector */
  iv: string;
  /** Base64 encoded authentication tag */
  authTag: string;
  /** Base64 encoded salt (if using password-based encryption) */
  salt?: string;
  /** Algorithm identifier for future compatibility */
  algorithm: string;
  /** Version for migration support */
  version: number;
}

/**
 * Encrypt plaintext using AES-256-GCM with a provided key
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedData {
  if (key.length !== KEY_LENGTH) {
    throw new EncryptionError(`Key must be ${KEY_LENGTH} bytes (256 bits)`);
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: ALGORITHM,
    version: 1,
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM with a provided key
 */
export function decrypt(encryptedData: EncryptedData, key: Buffer): string {
  if (key.length !== KEY_LENGTH) {
    throw new EncryptionError(`Key must be ${KEY_LENGTH} bytes (256 bits)`);
  }

  if (encryptedData.algorithm !== ALGORITHM) {
    throw new EncryptionError(`Unsupported algorithm: ${encryptedData.algorithm}`);
  }

  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    let plaintext = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    return plaintext;
  } catch {
    throw new DecryptionError('Decryption failed - invalid key or corrupted data');
  }
}

/**
 * Encrypt using a password (derives key using scrypt)
 */
export function encryptWithPassword(plaintext: string, password: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);

  const result = encrypt(plaintext, key);
  result.salt = salt.toString('base64');

  return result;
}

/**
 * Decrypt using a password (derives key using scrypt)
 */
export function decryptWithPassword(encryptedData: EncryptedData, password: string): string {
  if (!encryptedData.salt) {
    throw new EncryptionError('Salt required for password-based decryption');
  }

  const salt = Buffer.from(encryptedData.salt, 'base64');
  const key = deriveKey(password, salt);

  return decrypt(encryptedData, key);
}

/**
 * Derive a key from password using scrypt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
}

/**
 * Generate a random encryption key
 */
export function generateKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

/**
 * Generate a key from environment variable or throw
 */
export function getEnvKey(envVar: string = 'ENCRYPTION_KEY'): Buffer {
  const keyStr = process.env[envVar];
  if (!keyStr) {
    throw new EncryptionError(`Environment variable ${envVar} not set`);
  }

  // Support both hex and base64 encoded keys
  let key: Buffer;
  if (keyStr.length === KEY_LENGTH * 2) {
    // Hex encoded
    key = Buffer.from(keyStr, 'hex');
  } else {
    // Base64 encoded
    key = Buffer.from(keyStr, 'base64');
  }

  if (key.length !== KEY_LENGTH) {
    throw new EncryptionError(
      `Invalid key length from ${envVar}: expected ${KEY_LENGTH} bytes, got ${key.length}`
    );
  }

  return key;
}

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

/**
 * Credential Vault for managing encrypted credentials
 */
export class CredentialVault {
  private key: Buffer;

  constructor(key?: Buffer) {
    this.key = key ?? getEnvKey();
  }

  /**
   * Encrypt a credential object
   */
  encryptCredentials<T extends object>(credentials: T): EncryptedData {
    const json = JSON.stringify(credentials);
    return encrypt(json, this.key);
  }

  /**
   * Decrypt a credential object
   */
  decryptCredentials<T extends object>(encryptedData: EncryptedData): T {
    const json = decrypt(encryptedData, this.key);
    return JSON.parse(json) as T;
  }

  /**
   * Encrypt and serialize to a single string (for database storage)
   */
  encryptToString<T extends object>(credentials: T): string {
    const encrypted = this.encryptCredentials(credentials);
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  /**
   * Deserialize and decrypt from a single string
   */
  decryptFromString<T extends object>(encrypted: string): T {
    const encryptedData = JSON.parse(
      Buffer.from(encrypted, 'base64').toString('utf8')
    ) as EncryptedData;
    return this.decryptCredentials<T>(encryptedData);
  }

  /**
   * Re-encrypt credentials with a new key
   */
  rotateKey<T extends object>(
    encryptedData: EncryptedData,
    newKey: Buffer
  ): EncryptedData {
    const credentials = this.decryptCredentials<T>(encryptedData);
    const newVault = new CredentialVault(newKey);
    return newVault.encryptCredentials(credentials);
  }
}

/**
 * Type definitions for common credential structures
 */
export interface APICredentials {
  apiKey: string;
  apiSecret?: string;
  sellerId?: string;
  storeId?: string;
}

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface BasicAuthCredentials {
  username: string;
  password: string;
}

/**
 * Convenience functions for common credential types
 */
export function encryptAPICredentials(
  credentials: APICredentials,
  key?: Buffer
): EncryptedData {
  const vault = new CredentialVault(key);
  return vault.encryptCredentials(credentials);
}

export function decryptAPICredentials(
  encryptedData: EncryptedData,
  key?: Buffer
): APICredentials {
  const vault = new CredentialVault(key);
  return vault.decryptCredentials<APICredentials>(encryptedData);
}

export function encryptOAuthCredentials(
  credentials: OAuthCredentials,
  key?: Buffer
): EncryptedData {
  const vault = new CredentialVault(key);
  return vault.encryptCredentials(credentials);
}

export function decryptOAuthCredentials(
  encryptedData: EncryptedData,
  key?: Buffer
): OAuthCredentials {
  const vault = new CredentialVault(key);
  return vault.decryptCredentials<OAuthCredentials>(encryptedData);
}

/**
 * Generate a new encryption key and return as environment-friendly string
 */
export function generateEnvKey(): { hex: string; base64: string } {
  const key = generateKey();
  return {
    hex: key.toString('hex'),
    base64: key.toString('base64'),
  };
}
