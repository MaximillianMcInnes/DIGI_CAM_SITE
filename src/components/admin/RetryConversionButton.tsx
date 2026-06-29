"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { ADMIN_PASSWORD_HEADER, ADMIN_PASSWORD_STORAGE_KEY } from "@/lib/admin-password";

export function RetryConversionButton({ mediaId, onRetried }: { mediaId: string; onRetried?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setLoading(true);
    setError("");
    try {
      const password = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ?? "";
      const response = await fetch("/api/media/retry-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json", [ADMIN_PASSWORD_HEADER]: password },
        body: JSON.stringify({ mediaId }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Retry failed");
      onRetried?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Retry failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={retry}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
      >
        <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
        Retry
      </button>
      {error ? <p className="max-w-xs text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
