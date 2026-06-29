import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { isAdminAccessResponse, verifyAdminAccess } from "@/lib/server-admin";

type BulkAction = "assign" | "add-tags" | "metadata" | "hide" | "unhide" | "delete" | "set-cover" | "reorder";

export async function POST(request: NextRequest) {
  const admin = await verifyAdminAccess(request);
  if (isAdminAccessResponse(admin)) return admin;

  const body = (await request.json()) as {
    action?: BulkAction;
    mediaIds?: string[];
    collectionId?: string;
    collectionSlug?: string;
    dayId?: string;
    daySlug?: string;
    peopleIds?: string[];
    peopleSlugs?: string[];
    targetType?: "collection" | "day" | "person";
    targetId?: string;
    sortOrders?: Record<string, number>;
    tags?: string[];
    title?: string;
    caption?: string;
    notes?: string;
    location?: string;
    capturedAt?: string;
    camera?: string;
    metadata?: Record<string, string>;
  };

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  const mediaIds = body.mediaIds ?? [];
  if (!body.action || mediaIds.length === 0) {
    return NextResponse.json({ error: "action and mediaIds are required" }, { status: 400 });
  }

  const batch = db.batch();
  const refs = mediaIds.map((id) => db.collection("media").doc(id));

  if (body.action === "assign") {
    refs.forEach((ref) => {
      batch.update(ref, {
        collectionId: body.collectionId ?? FieldValue.delete(),
        collectionSlug: body.collectionSlug ?? FieldValue.delete(),
        dayId: body.dayId ?? FieldValue.delete(),
        daySlug: body.daySlug ?? FieldValue.delete(),
        peopleIds: body.peopleIds ?? [],
        peopleSlugs: body.peopleSlugs ?? [],
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  if (body.action === "add-tags") {
    const tags = body.tags ?? [];
    if (tags.length === 0) return NextResponse.json({ ok: true, count: 0 });
    refs.forEach((ref) => {
      batch.update(ref, {
        tags: FieldValue.arrayUnion(...tags),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  if (body.action === "metadata") {
    refs.forEach((ref) => {
      batch.update(ref, {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.caption !== undefined ? { caption: body.caption } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.capturedAt !== undefined ? { capturedAt: body.capturedAt } : {}),
        ...(body.camera !== undefined ? { camera: body.camera } : {}),
        ...(body.metadata ? { metadata: body.metadata } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  if (body.action === "hide" || body.action === "unhide") {
    refs.forEach((ref) => batch.update(ref, { status: body.action === "hide" ? "hidden" : "ready" }));
  }

  if (body.action === "reorder") {
    refs.forEach((ref) => batch.update(ref, { sortOrder: body.sortOrders?.[ref.id] ?? Date.now() }));
  }

  if (body.action === "set-cover") {
    const first = await refs[0].get();
    if (!first.exists) return NextResponse.json({ error: "Media not found" }, { status: 404 });
    const media = first.data();
    const coverImageUrl =
      media?.thumbnailUrl ||
      media?.displayUrl ||
      (media?.type === "image" ? media?.originalUrl : "") ||
      "";
    const coverData = {
      coverMediaId: refs[0].id,
      coverImageUrl,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.targetType === "collection" && body.targetId) {
      batch.update(db.collection("collections").doc(body.targetId), coverData);
    }
    if (body.targetType === "day" && body.targetId) {
      batch.update(db.collection("days").doc(body.targetId), coverData);
    }
    if (body.targetType === "person" && body.targetId) {
      batch.update(db.collection("people").doc(body.targetId), { avatarUrl: coverImageUrl });
    }
  }

  if (body.action === "delete") {
    const storage = getAdminStorage();
    for (const ref of refs) {
      const snap = await ref.get();
      const media = snap.data();
      const paths = [
        media?.originalStoragePath,
        media?.displayStoragePath,
        media?.thumbnailStoragePath,
        media?.videoMp4StoragePath,
      ].filter(Boolean) as string[];
      if (storage) {
        await Promise.all(paths.map((path) => storage.bucket().file(path).delete({ ignoreNotFound: true })));
      }
      batch.delete(ref);
    }
  }

  await batch.commit();
  return NextResponse.json({ ok: true, count: mediaIds.length });
}
