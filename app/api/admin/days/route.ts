import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { isAdminAccessResponse, verifyAdminAccess } from "@/lib/server-admin";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const admin = await verifyAdminAccess(request);
  if (isAdminAccessResponse(admin)) return admin;

  const body = (await request.json()) as {
    collectionId?: string;
    title?: string;
    date?: string;
    location?: string;
    description?: string;
    notes?: string;
    coverImageUrl?: string;
    metadata?: Record<string, string>;
  };
  if (!body.collectionId || !body.title?.trim()) {
    return NextResponse.json({ error: "collectionId and title are required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  const collectionRef = db.collection("collections").doc(body.collectionId);
  const collectionSnap = await collectionRef.get();
  if (!collectionSnap.exists) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  const collection = collectionSnap.data();
  const siblingSnap = await db.collection("days").where("collectionId", "==", body.collectionId).get();
  const ref = db.collection("days").doc();
  const day = {
    id: ref.id,
    collectionId: body.collectionId,
    collectionSlug: collection?.slug,
    slug: slugify(body.title),
    title: body.title.trim(),
    date: body.date ?? "",
    location: body.location ?? "",
    description: body.description ?? "",
    notes: body.notes ?? "",
    coverImageUrl: body.coverImageUrl ?? "",
    metadata: body.metadata ?? {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    mediaCount: 0,
    sortOrder: siblingSnap.size + 1,
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(ref, day);
    transaction.update(collectionRef, {
      dayCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return NextResponse.json({ ok: true, day: { ...day, createdAt: Date.now(), updatedAt: Date.now() } });
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdminAccess(request);
  if (isAdminAccessResponse(admin)) return admin;

  const body = (await request.json()) as {
    dayId?: string;
    swapDayId?: string;
    sortOrder?: number;
    swapSortOrder?: number;
  };
  if (!body.dayId || !body.swapDayId) {
    return NextResponse.json({ error: "dayId and swapDayId are required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  await Promise.all([
    db.collection("days").doc(body.dayId).set({ sortOrder: body.swapSortOrder, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
    db.collection("days").doc(body.swapDayId).set({ sortOrder: body.sortOrder, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
  ]);

  return NextResponse.json({ ok: true });
}
