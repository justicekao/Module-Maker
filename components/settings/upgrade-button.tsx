"use client";

import { useState } from "react";

export function UpgradeButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout/membership", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !body.url) {
      setError(body.error ?? "Couldn't start checkout.");
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div>
      <button onClick={handleUpgrade} disabled={busy} className="btn-primary">
        {busy ? "Please wait…" : "Upgrade to Pro"}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
