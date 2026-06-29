import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { demoCollections, demoDays, demoMedia, demoPeople, demoShares } from "@/lib/demo-data";
import { allowedPeople, isAllowedPersonSlug } from "@/lib/people";
import type { Collection, Day, Media, Person, Share } from "@/lib/types";

function serialise<T extends Record<string, unknown>>(id: string, data: DocumentData): T {
  const output: Record<string, unknown> = { id, ...data };
  for (const [key, value] of Object.entries(output)) {
    if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
      output[key] = value.toMillis();
    }
  }
  return output as T;
}

function ready(media: Media[]) {
  return media.filter((item) => item.status === "ready");
}

function sortMedia(media: Media[]) {
  return [...media].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
}

function sortDays(days: Day[]) {
  return [...days].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCollections(): Promise<Collection[]> {
  const db = getAdminDb();
  if (!db) return demoCollections;

  try {
    const snap = await db.collection("collections").get();
    return snap.docs
      .map((doc) => serialise<Collection>(doc.id, doc.data()))
      .filter((collection) => collection.visibility !== "private")
      .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
  } catch {
    return demoCollections;
  }
}

function shareIsExpired(share: Share) {
  if (!share.expiresAt) return false;
  const expires = typeof share.expiresAt === "number" ? new Date(share.expiresAt) : new Date(share.expiresAt);
  return !Number.isNaN(expires.getTime()) && expires.getTime() < Date.now();
}

export async function getCollectionBySlug(
  slug: string,
  options: { includePrivate?: boolean } = {},
): Promise<Collection | null> {
  const db = getAdminDb();
  if (!db) return demoCollections.find((item) => item.slug === slug) ?? null;

  try {
    const snap = await db.collection("collections").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const collection = serialise<Collection>(doc.id, doc.data());
    return collection.visibility === "private" && !options.includePrivate ? null : collection;
  } catch {
    return demoCollections.find((item) => item.slug === slug) ?? null;
  }
}

export async function getDaysForCollection(collectionSlug: string): Promise<Day[]> {
  const db = getAdminDb();
  if (!db) return sortDays(demoDays.filter((item) => item.collectionSlug === collectionSlug));

  try {
    const snap = await db.collection("days").where("collectionSlug", "==", collectionSlug).get();
    return sortDays(snap.docs.map((doc) => serialise<Day>(doc.id, doc.data())));
  } catch {
    return sortDays(demoDays.filter((item) => item.collectionSlug === collectionSlug));
  }
}

export async function getDayBySlug(collectionSlug: string, daySlug: string): Promise<Day | null> {
  const db = getAdminDb();
  if (!db) {
    return demoDays.find((item) => item.collectionSlug === collectionSlug && item.slug === daySlug) ?? null;
  }

  try {
    const snap = await db
      .collection("days")
      .where("collectionSlug", "==", collectionSlug)
      .where("slug", "==", daySlug)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return serialise<Day>(doc.id, doc.data());
  } catch {
    return demoDays.find((item) => item.collectionSlug === collectionSlug && item.slug === daySlug) ?? null;
  }
}

export async function getMediaForCollection(collectionSlug: string): Promise<Media[]> {
  const db = getAdminDb();
  if (!db) return sortMedia(ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug)));

  try {
    const snap = await db.collection("media").where("collectionSlug", "==", collectionSlug).get();
    return sortMedia(ready(snap.docs.map((doc) => serialise<Media>(doc.id, doc.data()))));
  } catch {
    return sortMedia(ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug)));
  }
}

export async function getMediaForDay(collectionSlug: string, daySlug: string): Promise<Media[]> {
  const db = getAdminDb();
  if (!db) {
    return sortMedia(
      ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug && item.daySlug === daySlug)),
    );
  }

  try {
    const snap = await db
      .collection("media")
      .where("collectionSlug", "==", collectionSlug)
      .where("daySlug", "==", daySlug)
      .get();
    return sortMedia(ready(snap.docs.map((doc) => serialise<Media>(doc.id, doc.data()))));
  } catch {
    return sortMedia(
      ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug && item.daySlug === daySlug)),
    );
  }
}

export async function getPersonBySlug(slug: string): Promise<Person | null> {
  const allowedFallback = allowedPeople.find((item) => item.slug === slug);
  if (!isAllowedPersonSlug(slug)) return null;

  const db = getAdminDb();
  if (!db) return demoPeople.find((item) => item.slug === slug) ?? allowedFallback ?? null;

  try {
    const snap = await db.collection("people").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return allowedFallback ?? null;
    const doc = snap.docs[0];
    return serialise<Person>(doc.id, doc.data());
  } catch {
    return demoPeople.find((item) => item.slug === slug) ?? allowedFallback ?? null;
  }
}

export async function getPeopleBySlugs(slugs: string[]): Promise<Person[]> {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return [];
  const db = getAdminDb();
  if (!db) return demoPeople.filter((item) => unique.includes(item.slug));

  try {
    const people = await Promise.all(unique.map((slug) => getPersonBySlug(slug)));
    return people.filter(Boolean) as Person[];
  } catch {
    return demoPeople.filter((item) => unique.includes(item.slug));
  }
}

export async function getMediaForPerson(personSlug: string): Promise<Media[]> {
  const db = getAdminDb();
  if (!db) return sortMedia(ready(demoMedia.filter((item) => item.peopleSlugs?.includes(personSlug))));

  try {
    const snap = await db.collection("media").where("peopleSlugs", "array-contains", personSlug).get();
    return sortMedia(ready(snap.docs.map((doc) => serialise<Media>(doc.id, doc.data()))));
  } catch {
    return sortMedia(ready(demoMedia.filter((item) => item.peopleSlugs?.includes(personSlug))));
  }
}

export async function getMediaById(mediaId: string): Promise<Media | null> {
  const db = getAdminDb();
  if (!db) return demoMedia.find((item) => item.id === mediaId && item.status === "ready") ?? null;

  try {
    const doc = await db.collection("media").doc(mediaId).get();
    if (!doc.exists) return null;
    const media = serialise<Media>(doc.id, doc.data() ?? {});
    return media.status === "ready" ? media : null;
  } catch {
    return demoMedia.find((item) => item.id === mediaId && item.status === "ready") ?? null;
  }
}

export async function getCollectionsForMedia(media: Media[]): Promise<Collection[]> {
  const slugs = [...new Set(media.map((item) => item.collectionSlug).filter(Boolean))] as string[];
  const collections = await Promise.all(slugs.map((slug) => getCollectionBySlug(slug)));
  return collections.filter(Boolean) as Collection[];
}

export async function getDaysForMedia(media: Media[]): Promise<Day[]> {
  const pairs = [...new Set(media.map((item) => `${item.collectionSlug ?? ""}/${item.daySlug ?? ""}`))].filter((pair) =>
    pair.endsWith("/") ? false : true,
  );
  const days = await Promise.all(
    pairs.map((pair) => {
      const [collectionSlug, daySlug] = pair.split("/");
      return getDayBySlug(collectionSlug, daySlug);
    }),
  );
  return days.filter(Boolean) as Day[];
}

export async function getShareById(shareId: string): Promise<Share | null> {
  const db = getAdminDb();
  if (!db) return demoShares.find((item) => item.shareId === shareId) ?? null;

  try {
    const snap = await db.collection("shares").where("shareId", "==", shareId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return serialise<Share>(doc.id, doc.data());
  } catch {
    return demoShares.find((item) => item.shareId === shareId) ?? null;
  }
}

export async function getShareBundle(shareId: string) {
  const share = await getShareById(shareId);
  if (!share || shareIsExpired(share)) return null;

  if (share.targetType === "collection" && share.targetSlug) {
    const collection = await getCollectionBySlug(share.targetSlug, { includePrivate: true });
    if (!collection) return null;
    const [days, media] = await Promise.all([
      getDaysForCollection(collection.slug),
      getMediaForCollection(collection.slug),
    ]);
    return { share, collection, days, media };
  }

  if (share.targetType === "person" && share.targetSlug) {
    const person = await getPersonBySlug(share.targetSlug);
    if (!person) return null;
    const media = await getMediaForPerson(person.slug);
    return { share, person, days: [], media };
  }

  if (share.targetType === "day" && share.targetSlug) {
    const [collectionSlug, daySlug] = share.targetSlug.split("/");
    const [collection, day, media] = await Promise.all([
      getCollectionBySlug(collectionSlug, { includePrivate: true }),
      getDayBySlug(collectionSlug, daySlug),
      getMediaForDay(collectionSlug, daySlug),
    ]);
    if (!collection || !day) return null;
    return { share, collection, day, days: [], media };
  }

  if (share.targetType === "media") {
    const mediaItem = await getMediaById(share.targetId);
    if (!mediaItem) return null;
    return { share, days: [], media: [mediaItem] };
  }

  return null;
}

export async function incrementShareView(shareId: string) {
  const db = getAdminDb();
  if (!db) return;
  try {
    const snap = await db.collection("shares").where("shareId", "==", shareId).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({ viewCount: FieldValue.increment(1) });
    }
  } catch {
    return;
  }
}
