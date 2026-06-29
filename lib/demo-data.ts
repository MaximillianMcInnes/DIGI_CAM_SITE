import type { Collection, Day, Media, Person, Share } from "@/lib/types";

export const demoCollections: Collection[] = [
  {
    id: "summer-2026",
    slug: "summer-2026",
    title: "Summer 2026",
    description: "Pocket-camera frames, balcony dinners, beach clips, and the best accidental portraits.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85",
    visibility: "public",
    createdAt: "2026-06-01",
    updatedAt: "2026-06-21",
    createdBy: "demo",
    mediaCount: 18,
    dayCount: 3,
  },
  {
    id: "london-nights",
    slug: "london-nights",
    title: "London Nights",
    description: "Low-light flash, late trains, table photos, and small proof that everyone was there.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1800&q=85",
    visibility: "unlisted",
    createdAt: "2026-05-15",
    updatedAt: "2026-05-20",
    createdBy: "demo",
    mediaCount: 11,
    dayCount: 2,
  },
];

export const demoDays: Day[] = [
  {
    id: "paris-day-1",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    slug: "paris-day-1",
    title: "Paris Day 1",
    date: "2026-06-14",
    description: "First roll energy: cafes, river light, and too many test shots.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=85",
    createdAt: "2026-06-14",
    updatedAt: "2026-06-14",
    mediaCount: 7,
    sortOrder: 1,
  },
  {
    id: "beach-roll",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    slug: "beach-roll",
    title: "Beach Roll",
    date: "2026-06-17",
    description: "Washed-out noon, blue towels, and little MP4 memories.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85",
    createdAt: "2026-06-17",
    updatedAt: "2026-06-17",
    mediaCount: 6,
    sortOrder: 2,
  },
  {
    id: "after-dark",
    collectionId: "london-nights",
    collectionSlug: "london-nights",
    slug: "after-dark",
    title: "After Dark",
    date: "2026-05-18",
    description: "Flash reflections and velvet shadows.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=85",
    createdAt: "2026-05-18",
    updatedAt: "2026-05-18",
    mediaCount: 5,
    sortOrder: 1,
  },
];

export const demoPeople: Person[] = [
  {
    id: "max",
    slug: "max",
    displayName: "Max",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    bio: "Usually behind the camera, occasionally caught in the mirror.",
    createdAt: "2026-05-01",
    mediaCount: 9,
  },
  {
    id: "eliza",
    slug: "eliza",
    displayName: "Eliza",
    avatarUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80",
    bio: "Usually somewhere in the brightest frame.",
    createdAt: "2026-05-01",
    mediaCount: 14,
  },
];

export const demoMedia: Media[] = [
  {
    id: "m1",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    dayId: "paris-day-1",
    daySlug: "paris-day-1",
    peopleSlugs: ["max"],
    tags: ["street", "cover"],
    type: "image",
    originalFileName: "DSC_0101.JPG",
    originalStoragePath: "demo/DSC_0101.JPG",
    originalUrl:
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1600&q=85",
    displayUrl:
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1600&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=600&q=75",
    caption: "First frame out of the station.",
    location: "Paris",
    capturedAt: "2026-06-14",
    uploadedBy: "demo",
    status: "ready",
    width: 1600,
    height: 1100,
    fileSizeBytes: 4200000,
    sortOrder: 1,
  },
  {
    id: "m2",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    dayId: "paris-day-1",
    daySlug: "paris-day-1",
    peopleSlugs: ["eliza"],
    tags: ["food", "night"],
    type: "image",
    originalFileName: "DSC_0144.JPG",
    originalStoragePath: "demo/DSC_0144.JPG",
    originalUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=85",
    displayUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=75",
    caption: "Dinner evidence.",
    location: "Paris",
    capturedAt: "2026-06-14",
    uploadedBy: "demo",
    status: "ready",
    width: 1600,
    height: 1066,
    fileSizeBytes: 5100000,
    sortOrder: 2,
  },
  {
    id: "m3",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    dayId: "beach-roll",
    daySlug: "beach-roll",
    peopleSlugs: ["max", "eliza"],
    tags: ["beach", "video"],
    type: "video",
    originalFileName: "MOV_0208.MOV",
    originalStoragePath: "demo/MOV_0208.MOV",
    originalUrl: "",
    videoMp4Url:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=600&q=75",
    displayUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=85",
    caption: "Tiny clip from the waterline.",
    location: "Brighton",
    capturedAt: "2026-06-17",
    uploadedBy: "demo",
    status: "ready",
    durationSeconds: 18,
    fileSizeBytes: 38000000,
    sortOrder: 3,
  },
  {
    id: "m4",
    collectionId: "london-nights",
    collectionSlug: "london-nights",
    dayId: "after-dark",
    daySlug: "after-dark",
    peopleSlugs: ["eliza"],
    tags: ["flash", "night"],
    type: "image",
    originalFileName: "DSC_0307.JPG",
    originalStoragePath: "demo/DSC_0307.JPG",
    originalUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=85",
    displayUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=75",
    caption: "Everyone in one blurry rectangle.",
    location: "London",
    capturedAt: "2026-05-18",
    uploadedBy: "demo",
    status: "ready",
    width: 1600,
    height: 1067,
    fileSizeBytes: 4700000,
    sortOrder: 1,
  },
];

export const demoShares: Share[] = [
  {
    id: "abc123",
    shareId: "abc123",
    targetType: "collection",
    targetId: "summer-2026",
    targetSlug: "summer-2026",
    allowDownload: true,
    allowOriginalQuality: false,
    createdAt: "2026-06-20",
    createdBy: "demo",
    viewCount: 24,
  },
];
