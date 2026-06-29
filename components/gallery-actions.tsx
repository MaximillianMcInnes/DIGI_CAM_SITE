"use client";

import { Copy, Download, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

export function GalleryActions({
  allowDownload,
  downloadUrl,
  compact,
}: {
  allowDownload: boolean;
  downloadUrl?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => (typeof window === "undefined" ? "" : window.location.href), []);

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ url: shareUrl, title: document.title });
      return;
    }
    await copyLink();
  }

  return (
    <div className={compact ? "grid grid-cols-3 gap-2" : "mt-8 grid grid-cols-3 gap-2"}>
      <button
        onClick={nativeShare}
        className={
          compact
            ? "flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            : "flex h-11 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        }
        title="Share"
      >
        <Share2 size={16} />
      </button>
      <button
        onClick={copyLink}
        className={
          compact
            ? "flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            : "flex h-11 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        }
        title={copied ? "Copied" : "Copy link"}
      >
        <Copy size={16} />
      </button>
      {allowDownload && downloadUrl ? (
        <a
          href={downloadUrl}
          download
          className={
            compact
              ? "flex h-11 items-center justify-center rounded-full bg-white text-stone-950 transition hover:bg-white/85"
              : "flex h-11 items-center justify-center rounded-full bg-stone-950 text-white transition hover:bg-[#284235]"
          }
          title="Download"
        >
          <Download size={16} />
        </a>
      ) : (
        <span className={compact ? "flex h-11 items-center justify-center rounded-full bg-white/10 text-white/40" : "flex h-11 items-center justify-center rounded-full bg-stone-200 text-stone-400"}>
          <Download size={16} />
        </span>
      )}
    </div>
  );
}
