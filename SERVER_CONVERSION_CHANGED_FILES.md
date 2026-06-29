# DigiShare Next.js Server Conversion Changed Files

This export contains the changed/new files for moving media upload and video conversion into Next.js route handlers. `package-lock.json` changed from dependency installation and is intentionally omitted from this copy-paste code export.

## .env.example

``bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aiscend-14a48
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aiscend-14a48.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

ADMIN_EMAILS=you@example.com
FIREBASE_SERVICE_ACCOUNT_JSON=
````

## README.md

``md
# DigiCam Social / DigiShare

Premium private digicam-style photo and video sharing built with Next.js 15, TypeScript, Tailwind CSS, Firebase Auth, Firestore, Storage, Firebase Admin, and in-process FFmpeg conversion inside Next.js route handlers.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The public gallery routes use Firestore when Firebase Admin is configured and fall back to polished demo data until env vars are filled in.

Required environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `ADMIN_EMAILS`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

## Core Routes

- `/`
- `/login`
- `/upload`
- `/admin`
- `/admin/collections`
- `/admin/media`
- `/c/[collectionSlug]`
- `/c/[collectionSlug]/day/[daySlug]`
- `/u/[personSlug]`
- `/share/[shareId]`

## Firebase

Use the existing AIScend Firebase project values in `.env.local`. The known project identifiers are included in `.env.example`:

- `aiscend-14a48`
- `aiscend-14a48.firebasestorage.app`

Update `firestore.rules` and `storage.rules` with your real admin emails before deploying rules. Firebase rules cannot read `.env`, so the same email list from `ADMIN_EMAILS` must be pasted into both rules files.

Public reads are limited to ready media from public/unlisted collections. Private collections stay hidden on `/c/[slug]` and are only visible to admins or through valid share links.

## Video Conversion

Video conversion happens directly in the Next.js server API routes with `fluent-ffmpeg`, `ffmpeg-static`, and `ffprobe-static`. There is no Cloud Run worker, Cloud Function, or separate backend service.

Deploy to a real long-running Node server/VPS, or Firebase App Hosting if your configuration supports long-running server processes and enough local temp storage. Do not rely on Vercel serverless for large MOV/MP4 conversion.

The server stores original videos, converted MP4s, thumbnails, duration, dimensions, file size metadata, and marks failures as `status: "failed"` for retry from `/admin/media`.

## Admin Features

- Dashboard stats for collections, days, people, media, processing videos, and failed videos.
- Manage collections, days, and people.
- Drag/drop upload with inline collection/day creation and people/tag/caption/location assignment.
- Bulk media assign, hide, unhide, delete, set cover, reorder, and retry conversion.
- Share links for collection, day, person, or media with optional expiry, optional password, download toggle, and original-quality toggle.
````

## package.json

``json
{
  "name": "digi_cam_site",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "ffmpeg-static": "^5.3.0",
    "ffprobe-static": "^3.1.0",
    "firebase": "^12.15.0",
    "firebase-admin": "^13.10.0",
    "fluent-ffmpeg": "^2.1.3",
    "lucide-react": "^1.22.0",
    "next": "^15.5.19",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "sharp": "^0.35.2",
    "tailwind-merge": "^3.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^15.5.19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
````

## app/api/media/upload/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/upload/route";

export const runtime = "nodejs";
export const maxDuration = 3600;
export const POST = srcPost;
````

## app/api/media/convert/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/convert/route";

export const runtime = "nodejs";
export const maxDuration = 3600;
export const POST = srcPost;
````

## app/api/media/retry-conversion/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/retry-conversion/route";

export const runtime = "nodejs";
export const maxDuration = 3600;
export const POST = srcPost;
````

## app/api/media/retry/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/retry-conversion/route";

export const runtime = "nodejs";
export const maxDuration = 3600;
export const POST = srcPost;
````

## app/api/media/[mediaId]/route.ts

``ts
import { DELETE as srcDelete, PATCH as srcPatch } from "@/src/app/api/media/[mediaId]/route";

export const runtime = "nodejs";
export const PATCH = srcPatch;
export const DELETE = srcDelete;
````

## src/app/api/media/upload/route.ts

``ts
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
  MAX_UPLOAD_BYTES,
  type UploadMetadata,
} from "@/src/lib/media/types";

export const runtime = "nodejs";
export const maxDuration = 3600;

export async function POST(request: NextRequest) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large" }, { status: 413 });
  }

  const metadata = parseUploadMetadata(formData);
  const fileName = sanitizeFileName(file.name);
  const ext = extname(fileName).toLowerCase();
  const isImage = ACCEPTED_IMAGE_TYPES.has(file.type) || [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].includes(ext);
  const isVideo = ACCEPTED_VIDEO_TYPES.has(file.type) || [".mov", ".mp4", ".m4v"].includes(ext);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const mediaRef = newMediaRef();
  const mediaId = mediaRef.id;
  const tempDir = await makeTempDir();

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputPath = await writeTempFile(tempDir, fileName, buffer);
    const originalStoragePath = storagePathFor(mediaId, metadata.collectionSlug, `original${ext || ".bin"}`);
    const originalUrl = await uploadBufferToStorage(
      originalStoragePath,
      buffer,
      file.type || (isVideo ? "video/quicktime" : "application/octet-stream"),
    );

    await createMediaDocument({
      id: mediaId,
      uploadedBy: decoded.uid,
      type: isVideo ? "video" : "image",
      originalFileName: fileName,
      originalStoragePath,
      originalUrl,
      fileSizeBytes: file.size,
      status: isVideo ? "processing" : "uploading",
      metadata,
    });

    if (isImage) {
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

function parseUploadMetadata(formData: FormData): UploadMetadata {
  return {
    collectionId: stringValue(formData, "collectionId"),
    collectionSlug: stringValue(formData, "collectionSlug"),
    dayId: stringValue(formData, "dayId"),
    daySlug: stringValue(formData, "daySlug"),
    peopleIds: listValue(formData, "peopleIds"),
    peopleSlugs: listValue(formData, "peopleSlugs"),
    tags: listValue(formData, "tags"),
    caption: stringValue(formData, "caption"),
    location: stringValue(formData, "location"),
    capturedAt: stringValue(formData, "capturedAt"),
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
````

## src/app/api/media/convert/route.ts

``ts
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
export const maxDuration = 3600;

export async function POST(request: NextRequest) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const { mediaId } = (await request.json()) as { mediaId?: string };
  if (!mediaId) return NextResponse.json({ error: "mediaId is required" }, { status: 400 });

  try {
    await convertMediaById(mediaId);
    return NextResponse.json({ ok: true, mediaId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed";
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
````

## src/app/api/media/retry-conversion/route.ts

``ts
export { maxDuration, POST, runtime } from "@/src/app/api/media/convert/route";
````

## src/app/api/media/[mediaId]/route.ts

``ts
import { NextRequest, NextResponse } from "next/server";
import { isGuardResponse, verifyAdminRequest } from "@/src/lib/auth/adminGuard";
import { deleteMediaDocument, getMediaDocument, patchMediaDocument } from "@/src/lib/media/firestore";
import { deleteStorageFiles } from "@/src/lib/media/storage";
import type { MediaDocument } from "@/src/lib/media/types";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const { mediaId } = await params;
  const body = (await request.json()) as Partial<MediaDocument>;
  const allowed: Partial<MediaDocument> = {};

  for (const key of [
    "collectionId",
    "collectionSlug",
    "dayId",
    "daySlug",
    "peopleIds",
    "peopleSlugs",
    "tags",
    "caption",
    "location",
    "capturedAt",
    "status",
    "sortOrder",
  ] as const) {
    if (key in body) {
      (allowed as Record<string, unknown>)[key] = body[key];
    }
  }

  await patchMediaDocument(mediaId, allowed);
  return NextResponse.json({ ok: true, mediaId });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const { mediaId } = await params;
  const media = await getMediaDocument(mediaId);
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  await deleteStorageFiles([
    media.originalStoragePath,
    media.displayStoragePath,
    media.thumbnailStoragePath,
    media.videoMp4StoragePath,
  ]);
  await deleteMediaDocument(mediaId);

  return NextResponse.json({ ok: true, mediaId });
}
````

## src/lib/firebase/client.ts

``ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const missingFirebaseClientConfig = Object.entries(firebaseClientConfig)
  .filter(([, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`);

export const isFirebaseClientConfigured = missingFirebaseClientConfig.length === 0;

export const firebaseApp = isFirebaseClientConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseClientConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseDb = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;
export const googleProvider = new GoogleAuthProvider();
````

## src/lib/firebase/admin.ts

``ts
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function serviceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  const parsed = JSON.parse(json) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

export function getFirebaseAdminApp(): App {
  if (getApps().length) return getApp();

  const account = serviceAccount();
  const projectId = account?.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (account) {
    return initializeApp({
      credential: cert(account),
      projectId,
      storageBucket,
    });
  }

  return initializeApp({ projectId, storageBucket });
}

export function adminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function adminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function adminStorage() {
  return getStorage(getFirebaseAdminApp());
}
````

## src/lib/auth/adminGuard.ts

``ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/src/lib/firebase/admin";

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const allowlist = adminEmails();
  return allowlist.length > 0 && allowlist.includes(email.toLowerCase());
}

export async function verifyAdminRequest(request: NextRequest): Promise<DecodedIdToken | NextResponse> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Firebase ID token" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(header.slice("Bearer ".length));
    if (!isAdminEmail(decoded.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return decoded;
  } catch {
    return NextResponse.json({ error: "Invalid Firebase ID token" }, { status: 401 });
  }
}

export function isGuardResponse(value: DecodedIdToken | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
````

## src/lib/media/processVideo.ts

``ts
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { existsSync } from "fs";
import { join } from "path";
import type { ProcessedVideo } from "@/src/lib/media/types";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

type ProbeData = {
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export async function probeVideo(inputPath: string): Promise<ProbeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      const stream = data.streams.find((item) => item.codec_type === "video");
      resolve({
        width: stream?.width,
        height: stream?.height,
        durationSeconds: Number(stream?.duration ?? data.format.duration ?? 0) || undefined,
      });
    });
  });
}

export async function processVideo(inputPath: string, tempDir: string): Promise<ProcessedVideo> {
  const mp4Path = join(tempDir, "converted.mp4");
  const thumbnailPath = join(tempDir, "thumbnail.jpg");

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-map_metadata 0",
        "-c:v libx264",
        "-preset medium",
        "-crf 23",
        "-pix_fmt yuv420p",
        "-c:a aac",
        "-b:a 160k",
        "-movflags +faststart",
        "-vf scale='min(1920,iw)':-2",
      ])
      .output(mp4Path)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });

  await createThumbnail(inputPath, thumbnailPath);
  const metadata = await probeVideo(mp4Path);

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
    await screenshot(inputPath, outputPath, "00:00:00.000");
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
````

## src/lib/media/processImage.ts

``ts
import sharp from "sharp";
import type { ProcessedImage } from "@/src/lib/media/types";

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  try {
    const image = sharp(input, { failOn: "none" }).rotate();
    const metadata = await image.metadata();

    const displayBuffer = await image
      .clone()
      .resize({ width: 1800, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();

    const thumbnailBuffer = await image
      .clone()
      .resize({ width: 640, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    return {
      displayBuffer,
      thumbnailBuffer,
      width: metadata.width,
      height: metadata.height,
    };
  } catch {
    return {};
  }
}
````

## src/lib/media/storage.ts

``ts
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { mkdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, extname, join } from "path";
import { adminStorage } from "@/src/lib/firebase/admin";

export function sanitizeFileName(fileName: string) {
  const ext = extname(fileName).toLowerCase();
  const stem = basename(fileName, ext)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${stem || "media"}${ext}`;
}

export function storagePathFor(mediaId: string, collectionSlug: string | undefined, fileName: string) {
  return `media/${collectionSlug || "uncategorised"}/${mediaId}/${sanitizeFileName(fileName)}`;
}

export async function makeTempDir() {
  const dir = join(tmpdir(), `digishare-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanupTempDir(dir: string) {
  await rm(dir, { recursive: true, force: true });
}

export async function writeTempFile(dir: string, fileName: string, buffer: Buffer) {
  const filePath = join(dir, sanitizeFileName(fileName));
  await writeFile(filePath, buffer);
  return filePath;
}

export async function uploadBufferToStorage(path: string, buffer: Buffer, contentType: string) {
  const bucket = adminStorage().bucket();
  const file = bucket.file(path);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000",
    },
  });
  return signedReadUrl(path);
}

export async function uploadFileToStorage(path: string, filePath: string, contentType: string) {
  const bucket = adminStorage().bucket();
  await bucket.upload(filePath, {
    destination: path,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000",
    },
  });
  return signedReadUrl(path);
}

export async function downloadStorageFile(path: string, destination: string) {
  await adminStorage().bucket().file(path).download({ destination });
  return destination;
}

export async function deleteStorageFiles(paths: Array<string | undefined>) {
  const bucket = adminStorage().bucket();
  await Promise.all(paths.filter(Boolean).map((path) => bucket.file(path as string).delete({ ignoreNotFound: true })));
}

export async function signedReadUrl(path: string) {
  const [url] = await adminStorage().bucket().file(path).getSignedUrl({
    action: "read",
    expires: "2100-01-01",
  });
  return url;
}

export function streamFromFile(filePath: string) {
  return createReadStream(filePath);
}
````

## src/lib/media/firestore.ts

``ts
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/src/lib/firebase/admin";
import type { MediaDocument, MediaStatus, UploadMetadata } from "@/src/lib/media/types";

export function mediaCollection() {
  return adminDb().collection("media");
}

export function newMediaRef() {
  return mediaCollection().doc();
}

export async function createMediaDocument(input: {
  id: string;
  uploadedBy: string;
  type: "image" | "video";
  originalFileName: string;
  originalStoragePath: string;
  originalUrl: string;
  fileSizeBytes: number;
  status: MediaStatus;
  metadata: UploadMetadata;
}) {
  const document: Omit<MediaDocument, "uploadedAt"> & { uploadedAt: FieldValue } = {
    id: input.id,
    collectionId: input.metadata.collectionId,
    collectionSlug: input.metadata.collectionSlug,
    dayId: input.metadata.dayId,
    daySlug: input.metadata.daySlug,
    peopleIds: input.metadata.peopleIds ?? [],
    peopleSlugs: input.metadata.peopleSlugs ?? [],
    tags: input.metadata.tags ?? [],
    type: input.type,
    originalFileName: input.originalFileName,
    originalStoragePath: input.originalStoragePath,
    originalUrl: input.originalUrl,
    caption: input.metadata.caption,
    location: input.metadata.location,
    capturedAt: input.metadata.capturedAt,
    uploadedAt: FieldValue.serverTimestamp(),
    uploadedBy: input.uploadedBy,
    status: input.status,
    processingError: null,
    fileSizeBytes: input.fileSizeBytes,
    sortOrder: Date.now(),
  };
  await mediaCollection().doc(input.id).set(document, { merge: true });
}

export async function updateMediaReady(mediaId: string, data: Partial<MediaDocument>) {
  await mediaCollection()
    .doc(mediaId)
    .set(
      {
        ...data,
        status: "ready",
        processingError: null,
      },
      { merge: true },
    );
}

export async function updateMediaStatus(mediaId: string, status: MediaStatus, processingError?: string | null) {
  await mediaCollection().doc(mediaId).set(
    {
      status,
      processingError: processingError ?? null,
    },
    { merge: true },
  );
}

export async function getMediaDocument(mediaId: string) {
  const snap = await mediaCollection().doc(mediaId).get();
  if (!snap.exists) return null;
  return snap.data() as MediaDocument & { uploadedAt: Timestamp };
}

export async function patchMediaDocument(mediaId: string, data: Partial<MediaDocument>) {
  await mediaCollection().doc(mediaId).set(data, { merge: true });
}

export async function deleteMediaDocument(mediaId: string) {
  await mediaCollection().doc(mediaId).delete();
}
````

## src/lib/media/types.ts

``ts
import type { Timestamp } from "firebase-admin/firestore";

export type MediaType = "image" | "video";
export type MediaStatus = "uploading" | "processing" | "ready" | "failed" | "hidden";

export type MediaDocument = {
  id: string;
  collectionId?: string;
  collectionSlug?: string;
  dayId?: string;
  daySlug?: string;
  peopleIds?: string[];
  peopleSlugs?: string[];
  tags?: string[];
  type: MediaType;
  originalFileName: string;
  originalStoragePath: string;
  originalUrl: string;
  displayStoragePath?: string;
  displayUrl?: string;
  thumbnailStoragePath?: string;
  thumbnailUrl?: string;
  videoMp4StoragePath?: string;
  videoMp4Url?: string;
  caption?: string;
  location?: string;
  capturedAt?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  status: MediaStatus;
  processingError?: string | null;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSizeBytes?: number;
  sortOrder?: number;
};

export type UploadMetadata = {
  collectionId?: string;
  collectionSlug?: string;
  dayId?: string;
  daySlug?: string;
  peopleIds?: string[];
  peopleSlugs?: string[];
  tags?: string[];
  caption?: string;
  location?: string;
  capturedAt?: string;
};

export type ProcessedImage = {
  displayBuffer?: Buffer;
  thumbnailBuffer?: Buffer;
  width?: number;
  height?: number;
};

export type ProcessedVideo = {
  mp4Path: string;
  thumbnailPath?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
export const ACCEPTED_VIDEO_TYPES = new Set(["video/quicktime", "video/mp4", "video/x-m4v"]);
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 120;
````

## src/types/ffprobe-static.d.ts

``ts
declare module "ffprobe-static" {
  const ffprobeStatic: {
    path: string;
    version?: string;
    url?: string;
  };

  export default ffprobeStatic;
}
````

## src/components/upload/UploadDropzone.tsx

``ts
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
````

## src/components/upload/UploadQueue.tsx

``ts
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
````

## src/components/admin/RetryConversionButton.tsx

``ts
"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { firebaseAuth } from "@/src/lib/firebase/client";

export function RetryConversionButton({ mediaId, onRetried }: { mediaId: string; onRetried?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function retry() {
    if (!firebaseAuth?.currentUser) return;
    setLoading(true);
    const token = await firebaseAuth.currentUser.getIdToken();
    await fetch("/api/media/retry-conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mediaId }),
    });
    setLoading(false);
    onRetried?.();
  }

  return (
    <button
      onClick={retry}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
    >
      <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
      Retry
    </button>
  );
}
````

## components/upload-console.tsx

``ts
"use client";

import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Check, FileVideo, Image as ImageIcon, Loader2, Plus, UploadCloud, XCircle } from "lucide-react";
import { ProcessingBadge, StatusBadge } from "@/components/gallery-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { auth, db } from "@/lib/firebase/client";
import type { Collection, Day, Person } from "@/lib/types";
import { isImageFile, isVideoFile, slugify } from "@/lib/utils";

type UploadStatus = "queued" | "uploading" | "processing" | "ready" | "failed";

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  message?: string;
};

export function UploadConsole() {
  return (
    <AdminGuard>
      <UploadWorkspace />
    </AdminGuard>
  );
}

function UploadWorkspace() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [newDay, setNewDay] = useState("");
  const [personInput, setPersonInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);

  const selectedCollectionDoc = useMemo(
    () => collections.find((item) => item.id === selectedCollection),
    [collections, selectedCollection],
  );
  const collectionDays = days.filter((day) => day.collectionId === selectedCollection);
  const selectedDayDoc = days.find((day) => day.id === selectedDay);

  const loadOptions = useCallback(async () => {
    if (!db) return;
    const [collectionSnap, daySnap, peopleSnap] = await Promise.all([
      getDocs(collection(db, "collections")),
      getDocs(collection(db, "days")),
      getDocs(collection(db, "people")),
    ]);
    setCollections(collectionSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Collection));
    setDays(daySnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Day));
    setPeople(peopleSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Person));
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  async function createCollectionInline() {
    if (!db || !auth?.currentUser || !newCollection.trim()) return;
    const slug = slugify(newCollection);
    const refDoc = doc(collection(db, "collections"));
    const data: Collection = {
      id: refDoc.id,
      slug,
      title: newCollection.trim(),
      description: "",
      visibility: "unlisted",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: auth.currentUser.uid,
      mediaCount: 0,
      dayCount: 0,
    };
    await setDoc(refDoc, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    setNewCollection("");
    setSelectedCollection(refDoc.id);
    await loadOptions();
  }

  async function createDayInline() {
    if (!db || !auth?.currentUser || !selectedCollectionDoc || !newDay.trim()) return;
    const refDoc = doc(collection(db, "days"));
    const data: Day = {
      id: refDoc.id,
      collectionId: selectedCollectionDoc.id,
      collectionSlug: selectedCollectionDoc.slug,
      slug: slugify(newDay),
      title: newDay.trim(),
      description: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mediaCount: 0,
      sortOrder: collectionDays.length + 1,
    };
    await setDoc(refDoc, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await updateDoc(doc(db, "collections", selectedCollectionDoc.id), {
      dayCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    setNewDay("");
    setSelectedDay(refDoc.id);
    await loadOptions();
  }

  function addFiles(fileList: FileList | File[]) {
    const accepted = Array.from(fileList).filter((file) => isImageFile(file) || isVideoFile(file));
    setItems((current) => [
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "queued" as const,
      })),
      ...current,
    ]);
  }

  async function ensurePeople() {
    if (!db || !auth?.currentUser) return { peopleIds: [], peopleSlugs: [] };
    const names = personInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const peopleIds: string[] = [];
    const peopleSlugs: string[] = [];

    for (const name of names) {
      const slug = slugify(name);
      const existing = people.find((item) => item.slug === slug);
      if (existing) {
        peopleIds.push(existing.id);
        peopleSlugs.push(existing.slug);
        continue;
      }

      const snap = await getDocs(query(collection(db, "people"), where("slug", "==", slug)));
      if (!snap.empty) {
        peopleIds.push(snap.docs[0].id);
        peopleSlugs.push(slug);
        continue;
      }

      const personRef = doc(collection(db, "people"));
      await setDoc(personRef, {
        id: personRef.id,
        slug,
        displayName: name,
        createdAt: serverTimestamp(),
        mediaCount: 0,
      });
      peopleIds.push(personRef.id);
      peopleSlugs.push(slug);
    }

    return { peopleIds, peopleSlugs };
  }

  async function uploadOne(item: UploadItem) {
    if (!auth?.currentUser || !selectedCollectionDoc) return;

    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, status: "uploading", progress: 10, message: "Uploading original" } : candidate,
      ),
    );

    const processingTimer = window.setTimeout(() => {
      if (!isVideoFile(item.file)) return;
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: "processing",
                progress: 65,
                message: "Converting MOV to MP4...",
              }
            : candidate,
        ),
      );
    }, 1200);

    try {
      const { peopleIds, peopleSlugs } = await ensurePeople();
      const tags = tagInput
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      const formData = new FormData();
      formData.set("file", item.file);
      formData.set("collectionId", selectedCollectionDoc.id);
      formData.set("collectionSlug", selectedCollectionDoc.slug);
      if (selectedDayDoc?.id) formData.set("dayId", selectedDayDoc.id);
      if (selectedDayDoc?.slug) formData.set("daySlug", selectedDayDoc.slug);
      formData.set("peopleIds", JSON.stringify(peopleIds));
      formData.set("peopleSlugs", JSON.stringify(peopleSlugs));
      formData.set("tags", JSON.stringify(tags));
      formData.set("caption", caption);
      formData.set("location", location);

      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = (await response.json()) as { error?: string; mediaId?: string };
      if (!response.ok) throw new Error(result.error ?? "Upload failed");

      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                progress: 100,
                status: "ready",
                message: isVideoFile(item.file) ? "Converted and ready" : "Ready",
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
                message: error instanceof Error ? error.message : "Upload failed",
              }
            : candidate,
        ),
      );
    } finally {
      window.clearTimeout(processingTimer);
    }
  }

  async function startUpload() {
    for (const item of items.filter((candidate) => candidate.status === "queued" || candidate.status === "failed")) {
      await uploadOne(item);
    }
    await loadOptions();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <section className="space-y-4 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Organise upload</h2>
          <p className="mt-1 text-sm text-stone-600">Choose the album structure once, then batch upload the roll.</p>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Collection
          <select
            value={selectedCollection}
            onChange={(event) => {
              setSelectedCollection(event.target.value);
              setSelectedDay("");
            }}
            className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-stone-950"
          >
            <option value="">Select collection</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <InlineCreate
          placeholder="New collection title"
          value={newCollection}
          onChange={setNewCollection}
          onCreate={createCollectionInline}
        />

        <label className="block text-sm font-semibold text-stone-700">
          Day
          <select
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
            disabled={!selectedCollection}
            className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-stone-950 disabled:bg-stone-100"
          >
            <option value="">No day</option>
            {collectionDays.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <InlineCreate placeholder="New day title" value={newDay} onChange={setNewDay} onCreate={createDayInline} />

        <label className="block text-sm font-semibold text-stone-700">
          People
          <input
            value={personInput}
            onChange={(event) => setPersonInput(event.target.value)}
            placeholder="Max, Sasha, group"
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Tags
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="beach, night, paris"
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Caption
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Location
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Paris, Brighton, London"
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
      </section>

      <section className="space-y-4">
        <UploadDropzone onFiles={addFiles} />

        <button
          onClick={startUpload}
          disabled={!selectedCollection || items.length === 0}
          className="w-full rounded-full bg-[#284235] px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-950 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Start upload
        </button>

        <UploadQueue items={items} collectionSlug={selectedCollectionDoc?.slug} daySlug={selectedDayDoc?.slug} />
      </section>
    </div>
  );
}

function InlineCreate({
  value,
  onChange,
  onCreate,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-950"
      />
      <button
        onClick={onCreate}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white"
      >
        <Plus size={17} />
      </button>
    </div>
  );
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "ready") return <Check className="text-[#284235]" size={18} />;
  if (status === "failed") return <XCircle className="text-[#8d2f3f]" size={18} />;
  if (status === "uploading" || status === "processing") return <Loader2 className="animate-spin text-stone-500" size={18} />;
  return null;
}

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
        Multi-upload JPG, PNG, WEBP, HEIC, MOV, and MP4. Images are compressed client-side where possible.
      </p>
      <label className="mt-6 inline-flex cursor-pointer rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#284235]">
        Choose files
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.mov,.mp4,image/*,video/*"
          className="sr-only"
          onChange={(event) => event.target.files && onFiles(event.target.files)}
        />
      </label>
    </div>
  );
}

export function UploadQueue({
  items,
  collectionSlug,
  daySlug,
}: {
  items: UploadItem[];
  collectionSlug?: string;
  daySlug?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
              {isVideoFile(item.file) ? <FileVideo size={18} /> : <ImageIcon size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-950">{item.file.name}</p>
              <p className="text-xs text-stone-500">{item.message ?? item.status}</p>
            </div>
            {item.status === "processing" ? <ProcessingBadge label="Processing" /> : <StatusBadge status={item.status} />}
            <StatusIcon status={item.status} />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-[#284235] transition-all" style={{ width: `${item.progress}%` }} />
          </div>
          {item.status === "ready" || item.status === "processing" ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
              {collectionSlug ? <a href={`/c/${collectionSlug}`} className="hover:text-stone-950">Open collection</a> : null}
              {collectionSlug && daySlug ? <a href={`/c/${collectionSlug}/day/${daySlug}`} className="hover:text-stone-950">Open day</a> : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
````

## components/admin-media-console.tsx

``ts
"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Eye, EyeOff, RotateCcw, Star, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { auth, db } from "@/lib/firebase/client";
import type { Collection, Day, Media, Person } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

export function AdminMediaConsole() {
  return (
    <AdminGuard>
      <MediaWorkspace />
    </AdminGuard>
  );
}

function MediaWorkspace() {
  const [media, setMedia] = useState<Media[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [dayId, setDayId] = useState("");
  const [peopleIds, setPeopleIds] = useState<string[]>([]);
  const [bulkTags, setBulkTags] = useState("");

  const selectedCollection = collections.find((item) => item.id === collectionId);
  const selectedDay = days.find((item) => item.id === dayId);
  const selectedPeople = people.filter((item) => peopleIds.includes(item.id));
  const collectionDays = days.filter((item) => item.collectionId === collectionId);
  const selectedMedia = useMemo(() => media.filter((item) => selected.includes(item.id)), [media, selected]);

  async function load() {
    if (!db) return;
    const [mediaSnap, collectionSnap, daySnap, peopleSnap] = await Promise.all([
      getDocs(query(collection(db, "media"), orderBy("uploadedAt", "desc"))),
      getDocs(collection(db, "collections")),
      getDocs(collection(db, "days")),
      getDocs(collection(db, "people")),
    ]);
    setMedia(mediaSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Media));
    setCollections(collectionSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Collection));
    setDays(daySnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Day));
    setPeople(peopleSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Person));
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function authedPost(url: string, body: unknown) {
    if (!auth?.currentUser) return;
    setBusy(url);
    const token = await auth.currentUser.getIdToken();
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setBusy("");
    setSelected([]);
    await load();
  }

  async function retry(mediaId: string) {
    await authedPost("/api/media/retry-conversion", { mediaId });
  }

  async function bulk(action: "assign" | "add-tags" | "hide" | "unhide" | "delete" | "set-cover" | "reorder") {
    if (selected.length === 0) return;
    await authedPost("/api/admin/media/bulk", {
      action,
      mediaIds: selected,
      collectionId: selectedCollection?.id,
      collectionSlug: selectedCollection?.slug,
      dayId: selectedDay?.id,
      daySlug: selectedDay?.slug,
      peopleIds,
      peopleSlugs: selectedPeople.map((item) => item.slug),
      targetType: selectedDay ? "day" : selectedCollection ? "collection" : selectedPeople[0] ? "person" : undefined,
      targetId: selectedDay?.id ?? selectedCollection?.id ?? selectedPeople[0]?.id,
      sortOrders: Object.fromEntries(selected.map((id, index) => [id, Date.now() + index])),
      tags: bulkTags
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">Bulk edit</h2>
            <p className="text-sm text-stone-500">{selected.length} selected</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToolButton onClick={() => bulk("assign")} label="Assign" />
            <ToolButton onClick={() => bulk("add-tags")} label="Add tags" icon={<Tag size={15} />} />
            <ToolButton onClick={() => bulk("hide")} label="Hide" icon={<EyeOff size={15} />} />
            <ToolButton onClick={() => bulk("unhide")} label="Unhide" icon={<Eye size={15} />} />
            <ToolButton onClick={() => bulk("set-cover")} label="Set cover" icon={<Star size={15} />} />
            <ToolButton onClick={() => bulk("reorder")} label="Reorder" />
            <ToolButton onClick={() => bulk("delete")} label="Delete" icon={<Trash2 size={15} />} danger />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <select
            value={collectionId}
            onChange={(event) => {
              setCollectionId(event.target.value);
              setDayId("");
            }}
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          >
            <option value="">No collection change</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <select
            value={dayId}
            onChange={(event) => setDayId(event.target.value)}
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          >
            <option value="">No day change</option>
            {collectionDays.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <select
            value={peopleIds[0] ?? ""}
            onChange={(event) => setPeopleIds(event.target.value ? [event.target.value] : [])}
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          >
            <option value="">No person change</option>
            {people.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
          <input
            value={bulkTags}
            onChange={(event) => setBulkTags(event.target.value)}
            placeholder="Add tags: beach, night"
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[48px_80px_1fr_110px_120px] gap-3 border-b border-stone-200 bg-[#fbfaf7] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 md:grid">
          <span />
          <span>Preview</span>
          <span>File</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {media.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 border-b border-stone-100 px-4 py-3 last:border-b-0 md:grid-cols-[48px_80px_1fr_110px_120px] md:items-center"
          >
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="size-5 accent-stone-950"
            />
            <div className="size-16 overflow-hidden rounded-[18px] bg-stone-100">
              {item.thumbnailUrl || item.displayUrl ? (
                <img src={item.thumbnailUrl ?? item.displayUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-950">{item.originalFileName}</p>
              <p className="text-xs text-stone-500">
                {item.collectionSlug || "uncategorised"} {item.daySlug ? `/ ${item.daySlug}` : ""}{" "}
                {item.uploadedAt ? `- ${prettyDate(item.uploadedAt)}` : ""}
              </p>
              <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-stone-400">
                REC {item.type} {item.width && item.height ? `${item.width}x${item.height}` : ""}
              </p>
            </div>
            <span className="text-sm font-medium text-stone-700">{item.status}</span>
            <button
              onClick={() => retry(item.id)}
              disabled={item.type !== "video" || busy !== ""}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
            >
              <RotateCcw size={14} />
              Retry
            </button>
          </div>
        ))}
      </section>

      {selectedMedia.length ? (
        <p className="text-sm text-stone-500">
          Selected: {selectedMedia.map((item) => item.originalFileName).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        danger ? "bg-[#8d2f3f] text-white" : "bg-stone-950 text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
````

## firestore.rules

``js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() && request.auth.token.email in [
        "you@example.com"
      ];
    }

    function publicVisibility(value) {
      return value in ["public", "unlisted"];
    }

    match /collections/{id} {
      allow read: if publicVisibility(resource.data.visibility) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /days/{id} {
      allow read: if isAdmin() || publicVisibility(get(/databases/$(database)/documents/collections/$(resource.data.collectionId)).data.visibility);
      allow create, update, delete: if isAdmin();
    }

    match /people/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /media/{id} {
      allow read: if isAdmin() || (
        resource.data.status == "ready" &&
        resource.data.collectionId is string &&
        publicVisibility(get(/databases/$(database)/documents/collections/$(resource.data.collectionId)).data.visibility)
      );
      allow create, update, delete: if isAdmin();
    }

    match /shares/{id} {
      allow read, create, update, delete: if isAdmin();
    }
  }
}
````

## storage.rules

``js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.token.email in [
        "you@example.com"
      ];
    }

    function mediaData(mediaId) {
      return firestore.get(/databases/(default)/documents/media/$(mediaId)).data;
    }

    function readyPublicMedia(mediaId) {
      return firestore.exists(/databases/(default)/documents/media/$(mediaId)) &&
        mediaData(mediaId).status == "ready" &&
        mediaData(mediaId).collectionId is string &&
        firestore.get(/databases/(default)/documents/collections/$(mediaData(mediaId).collectionId)).data.visibility in ["public", "unlisted"];
    }

    match /media/{collectionSlug}/{mediaId}/{fileName} {
      allow read: if isAdmin() || readyPublicMedia(mediaId);
      allow write, delete: if isAdmin();
    }
  }
}
````

## lib/types.ts

``ts
export type Visibility = "public" | "private" | "unlisted";
export type MediaType = "image" | "video";
export type MediaStatus = "uploading" | "processing" | "ready" | "failed" | "hidden";
export type ShareTargetType = "collection" | "day" | "person" | "media";

export type SerializableDate = string | number | null | undefined;

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverImageUrl?: string;
  visibility: Visibility;
  createdAt?: SerializableDate;
  updatedAt?: SerializableDate;
  createdBy: string;
  mediaCount: number;
  dayCount: number;
};

export type Day = {
  id: string;
  collectionId: string;
  collectionSlug: string;
  slug: string;
  title: string;
  date?: string;
  description?: string;
  coverMediaId?: string;
  coverImageUrl?: string;
  createdAt?: SerializableDate;
  updatedAt?: SerializableDate;
  mediaCount: number;
  sortOrder: number;
};

export type Person = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: SerializableDate;
  mediaCount: number;
};

export type Media = {
  id: string;
  collectionId?: string;
  collectionSlug?: string;
  dayId?: string;
  daySlug?: string;
  peopleIds?: string[];
  peopleSlugs?: string[];
  tags?: string[];
  type: MediaType;
  originalFileName: string;
  originalStoragePath: string;
  originalUrl: string;
  displayStoragePath?: string;
  displayUrl?: string;
  thumbnailStoragePath?: string;
  thumbnailUrl?: string;
  videoMp4StoragePath?: string;
  videoMp4Url?: string;
  caption?: string;
  location?: string;
  capturedAt?: SerializableDate;
  uploadedAt?: SerializableDate;
  uploadedBy: string;
  status: MediaStatus;
  processingError?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSizeBytes?: number;
  sortOrder?: number;
};

export type Share = {
  id: string;
  shareId: string;
  targetType: ShareTargetType;
  targetId: string;
  targetSlug?: string;
  expiresAt?: SerializableDate;
  passwordHash?: string;
  allowDownload: boolean;
  allowOriginalQuality: boolean;
  createdAt?: SerializableDate;
  createdBy: string;
  viewCount: number;
};

export type GalleryBundle = {
  collection?: Collection;
  day?: Day;
  person?: Person;
  days: Day[];
  media: Media[];
};
````

