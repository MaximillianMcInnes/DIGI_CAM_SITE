import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { allowedPeople, isAllowedPersonSlug } from "@/lib/people";
import { isAdminAccessResponse, verifyAdminAccess } from "@/lib/server-admin";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const admin = await verifyAdminAccess(request);
  if (isAdminAccessResponse(admin)) return admin;

  const body = (await request.json()) as {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  };
  const slug = slugify(body.displayName ?? "");
  if (!isAllowedPersonSlug(slug)) {
    return NextResponse.json({ error: "Only Max and Eliza are allowed person slugs" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  const existing = await db.collection("people").where("slug", "==", slug).limit(1).get();
  const ref = existing.empty ? db.collection("people").doc(slug) : existing.docs[0].ref;
  const fallback = allowedPeople.find((person) => person.slug === slug);
  const person = {
    id: ref.id,
    slug,
    displayName: fallback?.displayName ?? body.displayName?.trim() ?? slug,
    bio: body.bio ?? "",
    avatarUrl: body.avatarUrl ?? "",
    createdAt: FieldValue.serverTimestamp(),
    mediaCount: 0,
  };

  await ref.set(person, { merge: true });
  return NextResponse.json({ ok: true, person: { ...person, createdAt: Date.now() } });
}

