import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = "enc:";

/**
 * Get the encryption key from environment.
 * Must be a 64-char hex string (32 bytes).
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be set as a 64-character hex string (32 bytes)"
    );
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string. Returns a prefixed string: "enc:<iv>:<authTag>:<ciphertext>"
 * All parts are hex-encoded.
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${ENCRYPTED_PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a token string. Handles both encrypted (prefixed with "enc:") and
 * legacy plaintext tokens for backward compatibility during migration.
 */
export function decryptToken(value: string): string {
  // Legacy plaintext token — return as-is
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  const parts = value.slice(ENCRYPTED_PREFIX.length).split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a token value is already encrypted.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}
