import { authClient } from "@/lib/auth-client";

const SESSION_POLL_INTERVAL_MS = 400;
const SESSION_WAIT_TIMEOUT_MS = 90_000;

type SessionPayload = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>["data"]
>;

function hasActiveSession(data: SessionPayload | null | undefined): boolean {
  return Boolean(data?.session);
}

/** Push server session into the Better Auth client atom so `useSession()` updates. */
export function syncSessionToClient(data: SessionPayload | null): void {
  const sessionAtom = authClient.$store.atoms.session;
  const current = sessionAtom.get();
  const sessionData =
    data?.session && data?.user ? data : null;

  sessionAtom.set({
    ...current,
    data: sessionData,
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: current.refetch,
  });
  authClient.$store.notify("$sessionSignal");
}

export async function refreshSession(): Promise<boolean> {
  const { data, error } = await authClient.getSession();
  if (error || !hasActiveSession(data)) {
    return false;
  }
  syncSessionToClient(data);
  return true;
}

/**
 * Poll until Better Auth session is available, then sync it to `useSession()`.
 */
export async function waitForSession(
  timeoutMs = SESSION_WAIT_TIMEOUT_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await refreshSession()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_INTERVAL_MS));
  }

  return false;
}

export async function completeSignIn(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (await refreshSession()) {
    return { ok: true };
  }

  const sessionReady = await waitForSession();
  if (sessionReady) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "Sign-in did not complete. Check EXPO_PUBLIC_AUTH_URL matches your API.",
  };
}
