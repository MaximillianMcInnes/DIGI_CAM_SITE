import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { existsSync } from "fs";
import { join } from "path";
import type { ProcessedVideo } from "@/src/lib/media/types";

function existingPath(path?: string | null) {
  return path && existsSync(path) ? path : null;
}

function bundledFfmpegPath() {
  return existingPath(
    join(process.cwd(), "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"),
  );
}

function bundledFfprobePath() {
  return existingPath(
    join(
      process.cwd(),
      "node_modules",
      "ffprobe-static",
      "bin",
      process.platform,
      process.arch,
      process.platform === "win32" ? "ffprobe.exe" : "ffprobe",
    ),
  );
}

const ffmpegPath = existingPath(ffmpegStatic) ?? bundledFfmpegPath();
const ffprobePath = existingPath(ffprobeStatic.path) ?? bundledFfprobePath();

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

type ProbeData = {
  width?: number;
  height?: number;
  durationSeconds?: number;
  capturedAt?: string;
  metadata?: Record<string, string>;
};

export async function probeVideo(inputPath: string): Promise<ProbeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      const stream = data.streams.find((item) => item.codec_type === "video");
      const metadata = cleanMetadata({
        ...stringRecord(data.format.tags),
        ...stringRecord(stream?.tags),
      });
      resolve({
        width: stream?.width,
        height: stream?.height,
        durationSeconds: Number(stream?.duration ?? data.format.duration ?? 0) || undefined,
        capturedAt: captureDateFromMetadata(metadata),
        metadata,
      });
    });
  });
}

export async function processVideo(inputPath: string, tempDir: string): Promise<ProcessedVideo> {
  if (!ffmpegPath) {
    throw new Error("FFmpeg binary was not found. Install ffmpeg-static or provide a system FFmpeg binary.");
  }
  if (!ffprobePath) {
    throw new Error("FFprobe binary was not found. Install ffprobe-static so duration and dimensions can be extracted.");
  }

  const mp4Path = join(tempDir, "converted.mp4");
  const thumbnailPath = join(tempDir, "thumbnail.jpg");

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-map 0:v:0",
          "-map 0:a?",
          "-map_metadata 0",
          "-sn",
          "-dn",
          "-c:v libx264",
          "-preset medium",
          "-crf 23",
          "-pix_fmt yuv420p",
          "-profile:v high",
          "-level 4.0",
          "-tag:v avc1",
          "-c:a aac",
          "-b:a 160k",
          "-movflags +faststart",
          "-vf scale='min(1920,iw)':-2",
          "-f mp4",
        ])
        .output(mp4Path)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
  } catch (error) {
    throw new Error(`FFmpeg could not create a browser-compatible H.264 MP4: ${messageFromError(error)}`);
  }

  await createThumbnail(inputPath, thumbnailPath);
  const metadata = await probeVideo(mp4Path).catch((error) => {
    throw new Error(`Converted MP4 was created, but FFprobe could not read its metadata: ${messageFromError(error)}`);
  });

  return {
    mp4Path,
    thumbnailPath: existsSync(thumbnailPath) ? thumbnailPath : undefined,
    ...metadata,
  };
}

async function createThumbnail(inputPath: string, outputPath: string) {
  try {
    await screenshot(inputPath, outputPath, "00:00:01.000");
  } catch {
    try {
      await screenshot(inputPath, outputPath, "00:00:00.000");
    } catch {
      return;
    }
  }
}

function screenshot(inputPath: string, outputPath: string, timestamp: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(timestamp)
      .frames(1)
      .outputOptions(["-vf scale='min(1280,iw)':-2"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function stringRecord(value: unknown) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => typeof entry === "string" || typeof entry === "number")
      .map(([key, entry]) => [key, String(entry)]),
  );
}

function cleanMetadata(metadata: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => [key, value.trim()])
      .slice(0, 24),
  );
}

function captureDateFromMetadata(metadata: Record<string, string>) {
  const raw =
    metadata.creation_time ??
    metadata.date ??
    metadata["com.apple.quicktime.creationdate"];
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
