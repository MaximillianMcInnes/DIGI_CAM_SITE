"use client";

import { KeyRound, Lock, LogOut } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ADMIN_PASSWORD_STORAGE_KEY, isAdminPassword } from "@/lib/admin-password";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
    setVerified(isAdminPassword(stored));
    setLoaded(true);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdminPassword(password)) {
      setError("That password is not right.");
      return;
    }
    window.localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
    setVerified(true);
    setError("");
  }

  function signOut() {
    window.localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    setPassword("");
    setVerified(false);
  }

  if (!loaded) {
    return <div className="p-10 text-center text-stone-500">Checking admin access...</div>;
  }

  if (!verified) {
    return (
      <form
        onSubmit={submit}
        className="mx-auto max-w-md rounded-[8px] border border-stone-200 bg-white p-6 text-center shadow-sm"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-950 text-white">
          <Lock size={20} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-stone-950">Admin password</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Enter the shared password to upload and manage the archive.
        </p>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          className="mt-5 w-full rounded-full border border-stone-300 px-4 py-3 text-center outline-none focus:border-stone-950"
        />
        {error ? <p className="mt-3 text-sm font-semibold text-[#8d2f3f]">{error}</p> : null}
        <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
          <KeyRound size={16} />
          Unlock
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-[8px] border border-stone-200 bg-white p-3 text-sm text-stone-600">
        <span>Password access enabled</span>
        <button onClick={signOut} className="flex items-center gap-2 rounded-full px-3 py-2 font-medium text-stone-900">
          <LogOut size={15} />
          Lock
        </button>
      </div>
      {children}
    </div>
  );
}
