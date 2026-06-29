"use client";

import { UploadCloud } from "lucide-react";

export function UploadDropzone({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
      className="rounded-[32px] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm transition hover:border-stone-950"
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#284235]/10 text-[#284235]">
        <UploadCloud size={28} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-stone-950">Drop digicam files here</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
        Files are sent to the Next.js server, uploaded to Firebase Storage, and videos are converted to MP4 in-process.
      </p>
      <label className="mt-6 inline-flex cursor-pointer rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#284235]">
        Choose files
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.mov,.mp4,.m4v,image/*,video/*"
          className="sr-only"
          onChange={(event) => event.target.files && onFiles(event.target.files)}
        />
      </label>
    </div>
  );
}
