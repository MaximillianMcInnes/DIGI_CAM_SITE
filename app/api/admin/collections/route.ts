import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { isAdminAccessResponse, verifyAdminAccess } from "@/lib/server-admin";
import type { Visibility } from "@/lib/types";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const admin = await verifyAdminAccess(request);
  if (isAdminAccessResponse(admin)) return admin;

  const body = (await request.json()) as {
    title?: string;
    subtitle?: string;
    description?: string;
    location?: string;
    dateRange?: string;
    notes?: string;
    coverImageUrl?: string;
    metadata?: Record<string, string>;
    visibility?: Visibility;
  };
  if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  const ref = db.collection("collections").doc();
  const collection = {
    id: ref.id,
    slug: slugify(body.title),
    title: body.title.trim(),
    subtitle: body.subtitle ?? "",
    description: body.description ?? "",
    location: body.location ?? "",
    dateRange: body.dateRange ?? "",
    notes: body.notes ?? "",
    coverImageUrl: body.coverImageUrl ?? "",
    metadata: body.metadata ?? {},
    visibility: body.visibility ?? "unlisted",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: admin.uid,
    mediaCount: 0,
    dayCount: 0,
  };

  await ref.set(collection);
  return NextResponse.json({ ok: true, collection: { ...collection, createdAt: Date.now(), updatedAt: Date.now() } });
}
