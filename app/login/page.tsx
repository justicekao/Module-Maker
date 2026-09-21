import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back to Module Maker.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-muted">
        No account yet?{" "}
        <Link href="/register" className="text-brand">
          Sign up
        </Link>
      </p>
    </div>
  );
}
