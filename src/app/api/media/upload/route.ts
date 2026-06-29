import { extname } from "path";
import { NextRequest, NextResponse } from "next/server";
import { isGuardResponse, verifyAdminRequest } from "@/src/lib/auth/adminGuard";
import { createMediaDocument, newMediaRef, updateMediaReady, updateMediaStatus } from "@/src/lib/media/firestore";
import { processImage } from "@/src/lib/media/processImage";
import { processVideo } from "@/src/lib/media/processVideo";
import {
  cleanupTempDir,
  makeTempDir,
  sanitizeFileName,
  storagePathFor,
  uploadBufferToStorage,
  uploadFileToStorage,
  writeTempFile,
} from "@/src/lib/media/storage";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  maxUploadBytes,
  type UploadMetadata,
} from "@/src/lib/media/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const maxBytes = maxUploadBytes();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > maxBytes) {
    return NextResponse.json(
      { error: `Upload is too large. Maximum file size is ${Math.floor(maxBytes / 1024 / 1024)} MB.` },
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

  const metadata = parseUploadMetadata(formData);
  const fileName = sanitizeFileName(file.name);
  const ext = extname(fileName).toLowerCase();
  const declaredImage = ACCEPTED_IMAGE_TYPES.has(file.type) || [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].includes(ext);
  const declaredVideo = ACCEPTED_VIDEO_TYPES.has(file.type) || [".mod", ".mov", ".mp4", ".m4v", ".mpeg", ".mpg"].includes(ext);

  if (!declaredImage && !declaredVideo) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectMediaKind(buffer, file.type, ext);
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported or unreadable media file. Upload JPG, PNG, WEBP, HEIC, MOD, MOV, MP4, or M4V." },
      { status: 415 },
    );
  }

  const mediaRef = newMediaRef();
  const mediaId = mediaRef.id;
  const tempDir = await makeTempDir();

  try {
    const inputPath = await writeTempFile(tempDir, fileName, buffer);
    const originalStoragePath = storagePathFor(mediaId, metadata.collectionSlug, `original${ext || ".bin"}`);
    const originalUrl = await uploadBufferToStorage(
      originalStoragePath,
      buffer,
      file.type || (kind === "video" ? "video/quicktime" : "application/octet-stream"),
    );

    await createMediaDocument({
      id: mediaId,
      uploadedBy: decoded.uid,
      type: kind,
      originalFileName: fileName,
      originalStoragePath,
      originalUrl,
      fileSizeBytes: file.size,
      status: kind === "video" ? "processing" : "uploading",
      metadata,
    });

    if (kind === "image") {
      const processed = await processImage(buffer);
      const displayStoragePath = processed.displayBuffer
        ? storagePathFor(mediaId, metadata.collectionSlug, "display.jpg")
        : undefined;
      const displayUrl = displayStoragePath
        ? await uploadBufferToStorage(displayStoragePath, processed.displayBuffer as Buffer, "image/jpeg")
        : originalUrl;
      const thumbnailStoragePath = processed.thumbnailBuffer
        ? storagePathFor(mediaId, metadata.collectionSlug, "thumbnail.jpg")
        : undefined;
      const thumbnailUrl = thumbnailStoragePath
        ? await uploadBufferToStorage(thumbnailStoragePath, processed.thumbnailBuffer as Buffer, "image/jpeg")
        : displayUrl;

      await updateMediaReady(mediaId, {
        displayStoragePath,
        displayUrl,
        thumbnailStoragePath,
        thumbnailUrl,
        width: processed.width,
        height: processed.height,
      });
    } else {
      const processed = await processVideo(inputPath, tempDir);
      const videoMp4StoragePath = storagePathFor(mediaId, metadata.collectionSlug, "converted.mp4");
      const thumbnailStoragePath = processed.thumbnailPath
        ? storagePathFor(mediaId, metadata.collectionSlug, "video-thumbnail.jpg")
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
        capturedAt: metadata.capturedAt ?? processed.capturedAt,
        metadata: {
          ...(processed.metadata ?? {}),
          ...(metadata.metadata ?? {}),
        },
      });
    }

    return NextResponse.json({ ok: true, mediaId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload processing failed";
    await updateMediaStatus(mediaId, "failed", message).catch(() => undefined);
    return NextResponse.json({ error: message, mediaId }, { status: 500 });
  } finally {
    await cleanupTempDir(tempDir);
  }
}

function detectMediaKind(buffer: Buffer, contentType: string, ext: string): "image" | "video" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image";

  const boxType = buffer.subarray(4, 8).toString("ascii");
  const brandBlock = buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii");
  if (boxType === "ftyp") {
    if (/(heic|heix|hevc|hevx|mif1|msf1|heif)/i.test(brandBlock)) return "image";
    if (/(qt  |mp4|m4v|isom|iso2|avc1|mp41|mp42)/i.test(brandBlock)) return "video";
  }

  if (ACCEPTED_IMAGE_TYPES.has(contentType) && [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].includes(ext)) {
    return "image";
  }
  if (ACCEPTED_VIDEO_TYPES.has(contentType) && [".mod", ".mov", ".mp4", ".m4v", ".mpeg", ".mpg"].includes(ext)) {
    return "video";
  }

  return null;
}

function parseUploadMetadata(formData: FormData): UploadMetadata {
  return {
    collectionId: stringValue(formData, "collectionId"),
    collectionSlug: stringValue(formData, "collectionSlug"),
    dayId: stringValue(formData, "dayId"),
    daySlug: stringValue(formData, "daySlug"),
    peopleIds: listValue(formData, "peopleIds"),
    peopleSlugs: listValue(formData, "peopleSlugs"),
    tags: listValue(formData, "tags"),
    title: stringValue(formData, "title"),
    caption: stringValue(formData, "caption"),
    notes: stringValue(formData, "notes"),
    location: stringValue(formData, "location"),
    capturedAt: stringValue(formData, "capturedAt"),
    camera: stringValue(formData, "camera"),
    metadata: metadataValue(formData, "metadata"),
  };
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function listValue(formData: FormData, key: string) {
  const raw = stringValue(formData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function metadataValue(formData: FormData, key: string) {
  const raw = stringValue(formData, key);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => typeof value === "string" || typeof value === "number")
        .map(([entryKey, value]) => [entryKey, String(value)]),
    );
  } catch {
    return Object.fromEntries(
      raw
        .split("\n")
        .map((line) => line.split(":"))
        .filter(([entryKey, value]) => entryKey?.trim() && value?.trim())
        .map(([entryKey, ...value]) => [entryKey.trim(), value.join(":").trim()]),
    );
  }
}
