import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptWithPassword,
  decryptWithPassword,
  generateKey,
  generateEnvKey,
  getEnvKey,
  CredentialVault,
  EncryptionError,
  DecryptionError,
  encryptAPICredentials,
  decryptAPICredentials,
  encryptOAuthCredentials,
  decryptOAuthCredentials,
  type APICredentials,
  type OAuthCredentials,
} from '../utils/encryption';

describe('Encryption Utilities', () => {
  describe('generateKey', () => {
    it('should generate a 32-byte key', () => {
      const key = generateKey();
      expect(key.length).toBe(32);
    });

    it('should generate unique keys', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('generateEnvKey', () => {
    it('should return hex and base64 representations', () => {
      const envKey = generateEnvKey();
      expect(envKey.hex).toBeDefined();
      expect(envKey.base64).toBeDefined();
      expect(envKey.hex.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt plaintext correctly', () => {
      const key = generateKey();
      const plaintext = 'Hello, World!';

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt complex data', () => {
      const key = generateKey();
      const plaintext = JSON.stringify({
        apiKey: 'sk-test-123',
        secret: 'my-secret-value',
        nested: { value: 42 },
      });

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(JSON.parse(decrypted)).toEqual({
        apiKey: 'sk-test-123',
        secret: 'my-secret-value',
        nested: { value: 42 },
      });
    });

    it('should produce different ciphertext for same plaintext', () => {
      const key = generateKey();
      const plaintext = 'Same text';

      const encrypted1 = encrypt(plaintext, key);
      const encrypted2 = encrypt(plaintext, key);

      // Different IVs should produce different ciphertext
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should include algorithm and version in result', () => {
      const key = generateKey();
      const encrypted = encrypt('test', key);

      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.version).toBe(1);
    });

    it('should throw on invalid key length', () => {
      const invalidKey = Buffer.from('too-short');
      expect(() => encrypt('test', invalidKey)).toThrow(EncryptionError);
      expect(() => encrypt('test', invalidKey)).toThrow(/Key must be 32 bytes/);
    });

    it('should throw on wrong decryption key', () => {
      const key1 = generateKey();
      const key2 = generateKey();

      const encrypted = encrypt('test', key1);
      expect(() => decrypt(encrypted, key2)).toThrow(DecryptionError);
    });

    it('should throw on unsupported algorithm', () => {
      const key = generateKey();
      const encrypted = encrypt('test', key);
      encrypted.algorithm = 'unsupported';

      expect(() => decrypt(encrypted, key)).toThrow(EncryptionError);
      expect(() => decrypt(encrypted, key)).toThrow(/Unsupported algorithm/);
    });
  });

  describe('encryptWithPassword and decryptWithPassword', () => {
    it('should encrypt and decrypt with password', () => {
      const password = 'my-secure-password';
      const plaintext = 'Secret message';

      const encrypted = encryptWithPassword(plaintext, password);
      const decrypted = decryptWithPassword(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should include salt in encrypted data', () => {
      const encrypted = encryptWithPassword('test', 'password');
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.salt!.length).toBeGreaterThan(0);
    });

    it('should produce different results for same password', () => {
      const password = 'same-password';

      const encrypted1 = encryptWithPassword('test', password);
      const encrypted2 = encryptWithPassword('test', password);

      // Different salts should produce different results
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should fail with wrong password', () => {
      const encrypted = encryptWithPassword('test', 'correct-password');
      expect(() =>
        decryptWithPassword(encrypted, 'wrong-password')
      ).toThrow(DecryptionError);
    });

    it('should throw if salt is missing', () => {
      const encrypted = encryptWithPassword('test', 'password');
      delete encrypted.salt;

      expect(() => decryptWithPassword(encrypted, 'password')).toThrow(
        EncryptionError
      );
      expect(() => decryptWithPassword(encrypted, 'password')).toThrow(
        /Salt required/
      );
    });
  });

  describe('getEnvKey', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should read hex-encoded key from environment', () => {
      const key = generateKey();
      process.env.ENCRYPTION_KEY = key.toString('hex');

      const envKey = getEnvKey();
      expect(envKey.equals(key)).toBe(true);
    });

    it('should read base64-encoded key from environment', () => {
      const key = generateKey();
      process.env.ENCRYPTION_KEY = key.toString('base64');

      const envKey = getEnvKey();
      expect(envKey.equals(key)).toBe(true);
    });

    it('should throw if environment variable is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => getEnvKey()).toThrow(EncryptionError);
      expect(() => getEnvKey()).toThrow(/not set/);
    });

    it('should throw on invalid key length', () => {
      process.env.ENCRYPTION_KEY = 'too-short';
      expect(() => getEnvKey()).toThrow(EncryptionError);
      expect(() => getEnvKey()).toThrow(/Invalid key length/);
    });

    it('should use custom environment variable name', () => {
      const key = generateKey();
      process.env.CUSTOM_KEY = key.toString('hex');

      const envKey = getEnvKey('CUSTOM_KEY');
      expect(envKey.equals(key)).toBe(true);
    });
  });

  describe('CredentialVault', () => {
    let key: Buffer;
    let vault: CredentialVault;

    beforeEach(() => {
      key = generateKey();
      vault = new CredentialVault(key);
    });

    it('should encrypt and decrypt credentials object', () => {
      const credentials = {
        apiKey: 'test-api-key',
        apiSecret: 'test-secret',
      };

      const encrypted = vault.encryptCredentials(credentials);
      const decrypted = vault.decryptCredentials<typeof credentials>(encrypted);

      expect(decrypted).toEqual(credentials);
    });

    it('should encrypt to string and decrypt from string', () => {
      const credentials = {
        username: 'test',
        password: 'secret',
      };

      const encryptedString = vault.encryptToString(credentials);
      expect(typeof encryptedString).toBe('string');

      const decrypted = vault.decryptFromString<typeof credentials>(encryptedString);
      expect(decrypted).toEqual(credentials);
    });

    it('should rotate key successfully', () => {
      const credentials = { apiKey: 'test' };
      const encrypted = vault.encryptCredentials(credentials);

      const newKey = generateKey();
      const reEncrypted = vault.rotateKey<typeof credentials>(encrypted, newKey);

      const newVault = new CredentialVault(newKey);
      const decrypted = newVault.decryptCredentials<typeof credentials>(reEncrypted);

      expect(decrypted).toEqual(credentials);
    });
  });

  describe('API Credential helpers', () => {
    let key: Buffer;

    beforeEach(() => {
      key = generateKey();
    });

    it('should encrypt and decrypt API credentials', () => {
      const credentials: APICredentials = {
        apiKey: 'api-key-123',
        apiSecret: 'api-secret-456',
        sellerId: 'seller-789',
      };

      const encrypted = encryptAPICredentials(credentials, key);
      const decrypted = decryptAPICredentials(encrypted, key);

      expect(decrypted).toEqual(credentials);
    });

    it('should encrypt and decrypt OAuth credentials', () => {
      const credentials: OAuthCredentials = {
        clientId: 'client-123',
        clientSecret: 'secret-456',
        accessToken: 'access-token-789',
        refreshToken: 'refresh-token-012',
        tokenExpiry: Date.now() + 3600000,
      };

      const encrypted = encryptOAuthCredentials(credentials, key);
      const decrypted = decryptOAuthCredentials(encrypted, key);

      expect(decrypted).toEqual(credentials);
    });
  });

  describe('Error classes', () => {
    it('should create EncryptionError with correct name', () => {
      const error = new EncryptionError('Test error');
      expect(error.name).toBe('EncryptionError');
      expect(error.message).toBe('Test error');
    });

    it('should create DecryptionError with correct name', () => {
      const error = new DecryptionError('Test error');
      expect(error.name).toBe('DecryptionError');
      expect(error.message).toBe('Test error');
    });
  });
});
