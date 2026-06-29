"use client";

import { Check, FileVideo, Image as ImageIcon, Loader2, XCircle } from "lucide-react";

export type UploadQueueItem = {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "processing" | "ready" | "failed";
  message?: string;
};

export function UploadQueue({ items }: { items: UploadQueueItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
              {item.file.type.startsWith("video/") || /\.mov|\.mp4|\.m4v/i.test(item.file.name) ? (
                <FileVideo size={18} />
              ) : (
                <ImageIcon size={18} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-950">{item.file.name}</p>
              <p className="text-xs text-stone-500">
                {item.status === "processing" ? "Converting MOV to MP4..." : item.message ?? item.status}
              </p>
            </div>
            <QueueStatusIcon status={item.status} />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-[#284235] transition-all" style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function QueueStatusIcon({ status }: { status: UploadQueueItem["status"] }) {
  if (status === "ready") return <Check className="text-[#284235]" size={18} />;
  if (status === "failed") return <XCircle className="text-[#8d2f3f]" size={18} />;
  if (status === "uploading" || status === "processing") return <Loader2 className="animate-spin text-stone-500" size={18} />;
  return null;
}
