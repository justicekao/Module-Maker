import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import type { AiProviderId } from "@/types/graph";

export class MissingApiKeyError extends Error {
  constructor(provider: AiProviderId) {
    super(
      `No ${provider} API key connected. Add one in Settings → API Keys before running this module.`,
    );
  }
}

// Returns a function that lazily decrypts the caller's stored key for a
// provider the first time it's needed, so a run that never reaches a
// provider never has to touch a key for it.
export function makeApiKeyResolver(userId: string) {
  const cache = new Map<AiProviderId, string>();

  return async (provider: AiProviderId): Promise<string> => {
    const cached = cache.get(provider);
    if (cached) return cached;

    const record = await prisma.apiKey.findFirst({
      where: { userId, provider },
      orderBy: { createdAt: "asc" },
    });
    if (!record) throw new MissingApiKeyError(provider);

    const key = decryptSecret(record.encryptedKey);
    cache.set(provider, key);
    return key;
  };
}
