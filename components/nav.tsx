import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Nav() {
  const session = await auth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-sm text-brand-foreground">
            M
          </span>
          Module Maker
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <Link href="/templates" className="hover:text-foreground">
            Templates
          </Link>
          {session?.user && (
            <>
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/settings/keys" className="hover:text-foreground">
                API keys
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link href="/builder/new" className="btn-primary">
                New module
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn-ghost">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
