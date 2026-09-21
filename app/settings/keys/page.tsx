import { requireUser } from "@/lib/session";
import { KeysManager } from "@/components/settings/keys-manager";

export default async function ApiKeysPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">API keys</h1>
      <p className="mt-1 text-sm text-muted">
        Module Maker runs your modules using your own AI provider keys. Keys
        are encrypted at rest and never shown in full again. Module Maker
        never bills you for AI usage — you pay your provider directly.
      </p>
      <div className="mt-8">
        <KeysManager />
      </div>
    </div>
  );
}
