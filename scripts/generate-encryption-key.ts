/**
 * @file generate-encryption-key.ts
 * @description Generate a secure encryption key for credential vault
 *
 * Usage:
 * ```
 * npx tsx scripts/generate-encryption-key.ts
 * ```
 */

import { CredentialVault } from '../src/lib/security/credential-vault';

console.log('='.repeat(60));
console.log('FlowForge AI - Encryption Key Generator');
console.log('='.repeat(60));
console.log();

const key = CredentialVault.generateKey();

console.log('Generated encryption key:');
console.log();
console.log(key);
console.log();
console.log('Add this to your .env.local file:');
console.log();
console.log(`ENCRYPTION_KEY=${key}`);
console.log();
console.log('⚠️  IMPORTANT: Keep this key secret!');
console.log('   - Do NOT commit it to version control');
console.log('   - Store it securely (e.g., in a password manager)');
console.log('   - Use environment variables in production');
console.log('   - Losing this key means you cannot decrypt existing credentials');
console.log();
console.log('='.repeat(60));
