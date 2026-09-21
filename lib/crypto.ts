import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM at-rest encryption for user-supplied AI provider API keys.
// Ciphertext format: base64(iv):base64(authTag):base64(ciphertext)

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET must be set to a 32+ byte hex string",
    );
  }
  return Buffer.from(secret, "hex").subarray(0, 32);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptSecret(encoded: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted secret");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

// Last 4 characters only, safe to display in the UI (e.g. "sk-...ab12").
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return "****";
  return `****${plaintext.slice(-4)}`;
}
