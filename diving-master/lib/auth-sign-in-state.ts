import { useSyncExternalStore } from "react";

let oauthInProgress = false;
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function setOAuthInProgress(value: boolean): void {
  if (oauthInProgress === value) {
    return;
  }
  oauthInProgress = value;
  emitChange();
}

export function getOAuthInProgress(): boolean {
  return oauthInProgress;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useOAuthInProgress(): boolean {
  return useSyncExternalStore(subscribe, getOAuthInProgress, () => false);
}
