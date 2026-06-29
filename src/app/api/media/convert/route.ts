import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { isGuardResponse, verifyAdminRequest } from "@/src/lib/auth/adminGuard";
import { getMediaDocument, updateMediaReady, updateMediaStatus } from "@/src/lib/media/firestore";
import { processVideo } from "@/src/lib/media/processVideo";
import {
  cleanupTempDir,
  downloadStorageFile,
  makeTempDir,
  storagePathFor,
  uploadFileToStorage,
} from "@/src/lib/media/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const { mediaId } = (await request.json()) as { mediaId?: string };
  if (!mediaId) return NextResponse.json({ error: "mediaId is required" }, { status: 400 });

  try {
    await convertMediaById(mediaId);
    return NextResponse.json({ ok: true, mediaId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed while creating a browser-compatible MP4";
    await updateMediaStatus(mediaId, "failed", message).catch(() => undefined);
    return NextResponse.json({ error: message, mediaId }, { status: 500 });
  }
}

export async function convertMediaById(mediaId: string) {
  const media = await getMediaDocument(mediaId);
  if (!media) throw new Error("Media not found");
  if (media.type !== "video") throw new Error("Media is not a video");

  const tempDir = await makeTempDir();
  try {
    await updateMediaStatus(mediaId, "processing", null);
    const originalPath = join(tempDir, "original-input");
    await downloadStorageFile(media.originalStoragePath, originalPath);
    const processed = await processVideo(originalPath, tempDir);
    const videoMp4StoragePath = storagePathFor(mediaId, media.collectionSlug, "converted.mp4");
    const thumbnailStoragePath = processed.thumbnailPath
      ? storagePathFor(mediaId, media.collectionSlug, "video-thumbnail.jpg")
      : undefined;
    const videoMp4Url = await uploadFileToStorage(videoMp4StoragePath, processed.mp4Path, "video/mp4");
    const thumbnailUrl = processed.thumbnailPath && thumbnailStoragePath
      ? await uploadFileToStorage(thumbnailStoragePath, processed.thumbnailPath, "image/jpeg")
      : undefined;

    await updateMediaReady(mediaId, {
      videoMp4StoragePath,
      videoMp4Url,
      thumbnailStoragePath,
      thumbnailUrl,
      displayUrl: thumbnailUrl,
      width: processed.width,
      height: processed.height,
      durationSeconds: processed.durationSeconds,
    });
  } finally {
    await cleanupTempDir(tempDir);
  }
}
