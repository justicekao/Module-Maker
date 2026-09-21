"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  moduleId: string;
  slug: string;
  priceCents: number;
  isOwner: boolean;
  alreadyAcquired: boolean;
  isLoggedIn: boolean;
}

export function AcquireActions({
  moduleId,
  priceCents,
  isOwner,
  alreadyAcquired,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOwner) {
    return (
      <div className="flex gap-3">
        <a href={`/builder/${moduleId}`} className="btn-primary">
          Edit
        </a>
        <a href={`/run/${moduleId}`} className="btn-secondary">
          Run
        </a>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <a href="/login" className="btn-primary">
        Log in to {priceCents > 0 ? "buy" : "get"} this module
      </a>
    );
  }

  if (alreadyAcquired) {
    return (
      <div className="flex gap-3">
        <a href={`/run/${moduleId}`} className="btn-primary">
          Run
        </a>
        <ForkButton moduleId={moduleId} />
      </div>
    );
  }

  async function handleAcquire() {
    setBusy(true);
    setError(null);

    if (priceCents > 0) {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      const body = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok || !body.url) {
        setError(body.error ?? "Couldn't start checkout.");
        return;
      }
      window.location.href = body.url;
      return;
    }

    const res = await fetch(`/api/modules/${moduleId}/acquire`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't get this module.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button onClick={handleAcquire} disabled={busy} className="btn-primary">
        {busy ? "Please wait…" : priceCents > 0 ? `Buy for $${(priceCents / 100).toFixed(2)}` : "Get for free"}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function ForkButton({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleFork() {
    setBusy(true);
    const res = await fetch(`/api/modules/${moduleId}/fork`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return;
    const body = await res.json();
    router.push(`/builder/${body.id}`);
  }

  return (
    <button onClick={handleFork} disabled={busy} className="btn-secondary">
      {busy ? "Forking…" : "Fork & customize"}
    </button>
  );
}
