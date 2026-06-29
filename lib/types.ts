export type Visibility = "public" | "private" | "unlisted";
export type MediaType = "image" | "video";
export type MediaStatus = "uploading" | "processing" | "ready" | "failed" | "hidden";
export type ShareTargetType = "collection" | "day" | "person" | "media";

export type SerializableDate = string | number | null | undefined;

export type Collection = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  location?: string;
  dateRange?: string;
  notes?: string;
  metadata?: Record<string, string>;
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
  location?: string;
  description?: string;
  notes?: string;
  metadata?: Record<string, string>;
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
  capturedAt?: SerializableDate;
  camera?: string;
  metadata?: Record<string, string>;
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
