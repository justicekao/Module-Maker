import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UpgradeButton } from "@/components/settings/upgrade-button";

export default async function BillingPage() {
  const user = await requireUser();
  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  const isPro = membership?.tier === "PRO";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Membership</h1>
      <p className="mt-1 text-sm text-muted">
        Module Maker earns a platform fee on paid marketplace sales. A Pro
        membership is a separate, optional way to support the platform and
        unlock creator perks.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <p className="font-semibold">Free</p>
          <p className="mt-2 text-sm text-muted">
            Build unlimited private modules, publish to the marketplace, and
            run modules with your own AI keys.
          </p>
          {!isPro && <p className="mt-4 text-xs text-brand">Current plan</p>}
        </div>
        <div className="card border-brand p-6">
          <p className="font-semibold">Pro</p>
          <p className="mt-2 text-sm text-muted">
            Lower marketplace fee on your sales, plus early access to new
            module step types.
          </p>
          {isPro ? (
            <p className="mt-4 text-xs text-brand">Current plan</p>
          ) : (
            <div className="mt-4">
              <UpgradeButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
