import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/src/lib/firebase/admin";
import type { MediaDocument, MediaStatus, UploadMetadata } from "@/src/lib/media/types";

export function mediaCollection() {
  return adminDb().collection("media");
}

export function newMediaRef() {
  return mediaCollection().doc();
}

function withoutUndefined<T extends object>(data: T) {
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
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
    title: input.metadata.title,
    type: input.type,
    originalFileName: input.originalFileName,
    originalStoragePath: input.originalStoragePath,
    originalUrl: input.originalUrl,
    caption: input.metadata.caption,
    notes: input.metadata.notes,
    location: input.metadata.location,
    capturedAt: input.metadata.capturedAt,
    camera: input.metadata.camera,
    metadata: input.metadata.metadata ?? {},
    uploadedAt: FieldValue.serverTimestamp(),
    uploadedBy: input.uploadedBy,
    status: input.status,
    processingError: null,
    fileSizeBytes: input.fileSizeBytes,
    sortOrder: Date.now(),
  };
  await mediaCollection().doc(input.id).set(withoutUndefined(document), { merge: true });
}

export async function updateMediaReady(mediaId: string, data: Partial<MediaDocument>) {
  await mediaCollection()
    .doc(mediaId)
    .set(
      withoutUndefined({
        ...data,
        status: "ready",
        processingError: null,
      }),
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
  await mediaCollection().doc(mediaId).set(withoutUndefined(data), { merge: true });
}

export async function deleteMediaDocument(mediaId: string) {
  await mediaCollection().doc(mediaId).delete();
}
