/**
 * @file credential-vault.ts
 * @description Secure credential encryption system using AES-256-GCM
 */

import crypto from 'crypto';

/**
 * Credential vault for encrypting/decrypting sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
export class CredentialVault {
  private algorithm = 'aes-256-gcm' as const;
  private key: Buffer;
  private keyVersion: number = 1;

  constructor() {
    // Get encryption key from environment
    const envKey = process.env.ENCRYPTION_KEY;

    if (!envKey) {
      // In development, generate a warning
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'WARNING: ENCRYPTION_KEY not set. Using temporary key. DO NOT use in production!'
        );
        // Use a temporary key in development
        this.key = crypto.randomBytes(32);
      } else {
        throw new Error(
          'ENCRYPTION_KEY environment variable is required in production'
        );
      }
    } else {
      // Convert hex string to buffer
      this.key = Buffer.from(envKey, 'hex');

      if (this.key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
      }
    }
  }

  /**
   * Encrypt plaintext data
   * @returns Encrypted string in format: "iv:authTag:ciphertext"
   */
  encrypt(plaintext: string): string {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt encrypted data
   * @param ciphertext Encrypted string in format: "iv:authTag:ciphertext"
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    try {
      // Parse encrypted data
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt credential');
    }
  }

  /**
   * Encrypt JSON object
   */
  encryptJSON(data: any): string {
    const json = JSON.stringify(data);
    return this.encrypt(json);
  }

  /**
   * Decrypt to JSON object
   */
  decryptJSON<T = any>(ciphertext: string): T {
    const json = this.decrypt(ciphertext);
    return JSON.parse(json);
  }

  /**
   * Get current key version
   */
  getKeyVersion(): number {
    return this.keyVersion;
  }

  /**
   * Hash a value (one-way, for comparison)
   * Useful for API keys that need to be matched but not retrieved
   */
  hash(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('hex');
  }

  /**
   * Generate a random encryption key (for initial setup)
   */
  static generateKey(): string {
    const key = crypto.randomBytes(32);
    return key.toString('hex');
  }
}

/**
 * Singleton vault instance
 */
let vaultInstance: CredentialVault | null = null;

/**
 * Get the vault instance
 */
export function getVault(): CredentialVault {
  if (!vaultInstance) {
    vaultInstance = new CredentialVault();
  }
  return vaultInstance;
}

/**
 * Convenience functions
 */
export const encryptCredential = (plaintext: string): string => {
  return getVault().encrypt(plaintext);
};

export const decryptCredential = (ciphertext: string): string => {
  return getVault().decrypt(ciphertext);
};

export const encryptCredentialJSON = (data: any): string => {
  return getVault().encryptJSON(data);
};

export const decryptCredentialJSON = <T = any>(ciphertext: string): T => {
  return getVault().decryptJSON<T>(ciphertext);
};
