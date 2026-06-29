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

export function sanitizePathSegment(value: string | undefined, fallback: string) {
  const segment = value
    ?.toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return segment || fallback;
}

export function storagePathFor(mediaId: string, collectionSlug: string | undefined, fileName: string) {
  return `media/${sanitizePathSegment(collectionSlug, "uncategorised")}/${sanitizePathSegment(mediaId, "media")}/${sanitizeFileName(fileName)}`;
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
