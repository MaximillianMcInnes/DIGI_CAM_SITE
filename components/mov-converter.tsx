"use client";

import { Check, Download, FileVideo, Loader2, Trash2, UploadCloud, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatBytes } from "@/lib/utils";

type ConvertStatus = "queued" | "converting" | "ready" | "failed";

type ConvertItem = {
  id: string;
  file: File;
  status: ConvertStatus;
  message?: string;
  outputUrl?: string;
  outputName?: string;
  outputSize?: number;
};

function isConvertibleVideo(file: File) {
  return file.type.startsWith("video/") || /\.(mod|mov|mp4|m4v|mpeg|mpg)$/i.test(file.name);
}

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".mp4";
}

export function MovConverter() {
  const [items, setItems] = useState<ConvertItem[]>([]);
  const [running, setRunning] = useState(false);
  const outputUrls = useRef(new Set<string>());

  const queuedCount = useMemo(
    () => items.filter((item) => item.status === "queued" || item.status === "failed").length,
    [items],
  );

  useEffect(() => {
    const urls = outputUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const accepted = Array.from(fileList).filter(isConvertibleVideo);
    setItems((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued" as const,
      })),
    ]);
  }

  function removeItem(id: string) {
    setItems((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.outputUrl) {
        URL.revokeObjectURL(removed.outputUrl);
        outputUrls.current.delete(removed.outputUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  async function convertOne(item: ConvertItem) {
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, status: "converting", message: "Converting to browser-ready MP4..." } : candidate,
      ),
    );

    try {
      const formData = new FormData();
      formData.set("file", item.file);
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error ?? "Conversion failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      outputUrls.current.add(url);
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: "ready",
                message: "Ready to download",
                outputUrl: url,
                outputName: outputName(item.file.name),
                outputSize: blob.size,
              }
            : candidate,
        ),
      );
    } catch (error) {
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: "failed",
                message: error instanceof Error ? error.message : "Conversion failed",
              }
            : candidate,
        ),
      );
    }
  }

  async function start() {
    setRunning(true);
    try {
      const candidates = items.filter((item) => item.status === "queued" || item.status === "failed");
      for (const item of candidates) {
        await convertOne(item);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
      <section
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        className="flex min-h-[420px] flex-col justify-between rounded-[18px] border border-dashed border-stone-300 bg-white p-5 shadow-sm transition hover:border-stone-950 sm:p-8"
      >
        <div>
          <div className="flex size-14 items-center justify-center rounded-full bg-[#d8382f]/10 text-[#d8382f]">
            <UploadCloud size={28} />
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-normal text-stone-950 sm:text-6xl">
            Max MOD to MP4 converter
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-stone-600">
            Drop Max camera clips, including .MOD files, and turn them into H.264 MP4s that behave on phones.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#d8382f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-950">
            <UploadCloud size={16} />
            Choose videos
            <input
              type="file"
              multiple
              accept=".mod,.mov,.mp4,.m4v,.mpeg,.mpg,video/*"
              className="sr-only"
              onChange={(event) => event.target.files && addFiles(event.target.files)}
            />
          </label>
          <button
            onClick={start}
            disabled={running || queuedCount === 0}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {running ? <Loader2 className="animate-spin" size={16} /> : <FileVideo size={16} />}
            Convert {queuedCount ? queuedCount : ""}
          </button>
        </div>
      </section>

      <section className="min-h-[420px] overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 bg-[#fbfaf7] px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-950">Queue</h2>
          <span className="text-sm font-medium text-stone-500">{items.length} files</span>
        </div>

        {items.length === 0 ? (
          <div className="grid min-h-[340px] place-items-center p-6 text-center text-sm leading-6 text-stone-500">
            Your converted MP4 downloads will appear here.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {items.map((item) => (
              <article key={item.id} className="grid gap-3 p-4 sm:grid-cols-[44px_1fr_auto] sm:items-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                  {item.status === "converting" ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : item.status === "ready" ? (
                    <Check className="text-[#284235]" size={18} />
                  ) : item.status === "failed" ? (
                    <XCircle className="text-[#8d2f3f]" size={18} />
                  ) : (
                    <FileVideo size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-950">{item.file.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatBytes(item.file.size)}
                    {item.outputSize ? ` -> ${formatBytes(item.outputSize)}` : ""} - {item.message ?? item.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.outputUrl ? (
                    <a
                      href={item.outputUrl}
                      download={item.outputName}
                      className="flex size-10 items-center justify-center rounded-full bg-stone-950 text-white"
                      title="Download MP4"
                    >
                      <Download size={16} />
                    </a>
                  ) : null}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex size-10 items-center justify-center rounded-full border border-stone-300 text-stone-700"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
