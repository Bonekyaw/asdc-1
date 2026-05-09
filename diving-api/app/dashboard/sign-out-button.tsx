"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="h-9 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
    >
      Sign out
    </button>
  );
}
