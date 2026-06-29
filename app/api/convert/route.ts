import { readFile } from "fs/promises";
import { basename, extname } from "path";
import { NextRequest, NextResponse } from "next/server";
import { processVideo } from "@/src/lib/media/processVideo";
import { cleanupTempDir, makeTempDir, sanitizeFileName, writeTempFile } from "@/src/lib/media/storage";
import { maxUploadBytes } from "@/src/lib/media/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function mp4Name(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const ext = extname(safeName);
  const stem = basename(safeName, ext);
  return `${stem || "converted"}.mp4`;
}

export async function POST(request: NextRequest) {
  const maxBytes = maxUploadBytes();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > maxBytes) {
    return NextResponse.json(
      { error: `File is too large. Maximum file size is ${Math.floor(maxBytes / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File is too large. Maximum file size is ${Math.floor(maxBytes / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }

  const ext = extname(file.name).toLowerCase();
  const isVideo = file.type.startsWith("video/") || [".mod", ".mov", ".mp4", ".m4v", ".mpeg", ".mpg"].includes(ext);
  if (!isVideo) {
    return NextResponse.json({ error: "Upload a MOD, MOV, MP4, or M4V video file." }, { status: 415 });
  }

  const tempDir = await makeTempDir();
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputPath = await writeTempFile(tempDir, file.name, buffer);
    const processed = await processVideo(inputPath, tempDir);
    const mp4 = await readFile(processed.mp4Path);
    const outputName = mp4Name(file.name);

    return new NextResponse(mp4, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(mp4.length),
        "Content-Disposition": `attachment; filename="${outputName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await cleanupTempDir(tempDir);
  }
}
