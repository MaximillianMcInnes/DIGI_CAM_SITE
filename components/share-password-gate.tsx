"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

export function SharePasswordGate({ shareId }: { shareId: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/shares/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId, password }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("That password did not work.");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-[8px] border border-stone-200 bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-950 text-white">
          <Lock size={20} />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-stone-950">Private share</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">Enter the password to view this gallery link.</p>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-6 w-full rounded-[8px] border border-stone-300 px-3 py-3 text-center outline-none focus:border-stone-950"
          placeholder="Password"
        />
        {error ? <p className="mt-3 text-sm font-medium text-[#8d2f3f]">{error}</p> : null}
        <button
          disabled={loading}
          className="mt-5 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-stone-300"
        >
          {loading ? "Checking..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}
