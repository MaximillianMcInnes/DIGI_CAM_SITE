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
  title?: string;
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
  notes?: string;
  location?: string;
  capturedAt?: string;
  camera?: string;
  metadata?: Record<string, string>;
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
  title?: string;
  caption?: string;
  notes?: string;
  location?: string;
  capturedAt?: string;
  camera?: string;
  metadata?: Record<string, string>;
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
  capturedAt?: string;
  metadata?: Record<string, string>;
};

const DEFAULT_MAX_UPLOAD_MB = 120;

export function maxUploadBytes() {
  const configured = Number(process.env.DIGISHARE_MAX_UPLOAD_MB ?? process.env.MAX_UPLOAD_FILE_SIZE_MB);
  const megabytes = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_UPLOAD_MB;
  return Math.floor(megabytes * 1024 * 1024);
}

export const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
export const ACCEPTED_VIDEO_TYPES = new Set(["video/quicktime", "video/mp4", "video/x-m4v", "video/mpeg", "video/mpg"]);
