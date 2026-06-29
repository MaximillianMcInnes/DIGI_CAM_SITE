"use client";

import Link from "next/link";
import {
  Camera,
  Check,
  Clipboard,
  Download,
  EyeOff,
  Film,
  Image as ImageIcon,
  Loader2,
  Lock,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import type { Media, Person } from "@/lib/types";
import { cn, formatBytes, prettyDate } from "@/lib/utils";

export function StatusBadge({ status }: { status?: string }) {
  const tone =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "failed"
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : status === "hidden"
          ? "bg-stone-100 text-stone-600 ring-stone-200"
          : "bg-amber-50 text-amber-700 ring-amber-100";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>
      {status === "processing" || status === "uploading" ? <Loader2 size={12} className="animate-spin" /> : null}
      {status ?? "draft"}
    </span>
  );
}

export function ProcessingBadge({ label = "Processing video" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
      <Loader2 size={13} className="animate-spin" />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        <Camera size={20} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-stone-950">{title}</h3>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-stone-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-stone-100" />
            <div className="h-3 w-full animate-pulse rounded-full bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DownloadButton({
  href,
  disabled,
  label = "Download",
}: {
  href?: string;
  disabled?: boolean;
  label?: string;
}) {
  if (!href || disabled) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400">
        <Download size={15} />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#284235]"
    >
      <Download size={15} />
      {label}
    </a>
  );
}

export function CopyLinkButton({ value, label = "Copy link" }: { value?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = value || window.location.href;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-950"
    >
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function ShareDialog({
  title = "Share this gallery",
  triggerLabel = "Share",
}: {
  title?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#284235]"
      >
        <Share2 size={15} />
        {triggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d2f3f]">Private link</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-950">{title}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-full bg-stone-100">
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 rounded-[18px] border border-stone-200 bg-[#fbfaf7] p-3 text-sm text-stone-600">
              <p className="truncate font-mono text-xs">{url}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <CopyLinkButton value={url} />
              <button
                onClick={() => navigator.share?.({ title, url })}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800"
              >
                <Share2 size={15} />
                Native share
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ConfirmDialog({
  title,
  body,
  onConfirm,
  trigger,
}: {
  title: string;
  body?: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
            {body ? <p className="mt-2 text-sm leading-6 text-stone-500">{body}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#8d2f3f] px-4 py-2 text-sm font-semibold text-white"
              >
                <Trash2 size={15} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type Toast = { id: string; message: string };
const ToastContext = createContext<(message: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (message: string) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 2600);
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function VideoPlayer({ media, autoPlay }: { media: Media; autoPlay?: boolean }) {
  const src = media.videoMp4Url;
  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-stone-950 text-white">
        <Film size={28} />
        <p className="text-sm font-semibold">
          {media.status === "failed" ? "Video conversion failed" : "Converting MOV to MP4..."}
        </p>
      </div>
    );
  }

  return (
    <video
      src={src}
      poster={media.thumbnailUrl ?? media.displayUrl}
      controls
      autoPlay={autoPlay}
      playsInline
      className="h-full w-full object-contain"
    />
  );
}

export function MediaCard({
  media,
  index = 0,
  onOpen,
}: {
  media: Media;
  index?: number;
  onOpen?: (media: Media) => void;
}) {
  const image = media.thumbnailUrl ?? media.displayUrl ?? (media.type === "image" ? media.originalUrl : undefined);
  const tall = index % 5 === 0 || index % 5 === 3;

  return (
    <button
      onClick={() => onOpen?.(media)}
      className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-[24px] border border-stone-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className={cn("relative overflow-hidden bg-stone-100", tall ? "aspect-[4/5]" : "aspect-[4/3]")}>
        {media.status === "processing" ? (
          <div className="flex h-full items-center justify-center">
            <ProcessingBadge />
          </div>
        ) : media.status === "failed" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-rose-50 text-rose-700">
            <Film />
            <span className="text-sm font-semibold">Conversion failed</span>
          </div>
        ) : (
          <>
            {image ? (
              <img
                src={image}
                alt={media.title ?? media.caption ?? media.originalFileName}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400">
                <ImageIcon />
              </div>
            )}
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-950 shadow-sm">
                {media.type === "video" ? "REC" : "DSC"}
              </span>
              {media.type === "video" ? (
                <span className="flex size-7 items-center justify-center rounded-full bg-black/70 text-white">
                  <Film size={13} />
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-sm font-semibold text-stone-950">{media.title || media.caption || media.originalFileName}</p>
          <StatusBadge status={media.status} />
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
          <span>{media.originalFileName}</span>
          {media.capturedAt ? <span>{prettyDate(media.capturedAt)}</span> : null}
          {media.camera ? <span>{media.camera}</span> : null}
          {media.fileSizeBytes ? <span>{formatBytes(media.fileSizeBytes)}</span> : null}
        </div>
        {media.notes ? <p className="line-clamp-2 text-xs leading-5 text-stone-500">{media.notes}</p> : null}
      </div>
    </button>
  );
}

export function MasonryGrid({ children }: { children: React.ReactNode }) {
  return <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">{children}</div>;
}

export function PersonCard({ person }: { person: Person }) {
  return (
    <Link
      href={`/u/${person.slug}`}
      className="group flex items-center gap-3 rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="size-14 overflow-hidden rounded-full bg-stone-100">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            <Camera size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-950">{person.displayName}</p>
        <p className="text-xs text-stone-500">{person.mediaCount} frames</p>
      </div>
    </Link>
  );
}

export function AdminMetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <span className="text-[#284235]">{icon ?? <Sparkles size={16} />}</span>
      </div>
      <p className="mt-5 text-3xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

export function VisibilityPill({ visibility }: { visibility?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-950 shadow-sm">
      {visibility === "private" ? <Lock size={12} /> : visibility === "hidden" ? <EyeOff size={12} /> : null}
      {visibility ?? "unlisted"}
    </span>
  );
}

export function useDebouncedValue<T>(value: T, delay = 160) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [delay, value]);
  return debounced;
}
