import { NextRequest, NextResponse } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { demoCollections, demoDays, demoMedia } from "@/lib/demo-data";
import { normaliseAllowedPeople } from "@/lib/people";
import type { Collection, Day, Media, Person } from "@/lib/types";
import { isAdminAccessResponse, verifyAdminAccess } from "@/lib/server-admin";

function serialise<T extends Record<string, unknown>>(id: string, data: DocumentData): T {
  const output: Record<string, unknown> = { id, ...data };
  for (const [key, value] of Object.entries(output)) {
    if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
      output[key] = value.toMillis();
    }
  }
  return output as T;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdminAccess(request);
  if (isAdminAccessResponse(admin)) return admin;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({
      collections: demoCollections,
      days: demoDays,
      people: normaliseAllowedPeople([]),
      media: demoMedia,
    });
  }

  const [collectionSnap, daySnap, peopleSnap, mediaSnap] = await Promise.all([
    db.collection("collections").get(),
    db.collection("days").get(),
    db.collection("people").get(),
    db.collection("media").get(),
  ]);

  const collections = collectionSnap.docs.map((doc) => serialise<Collection>(doc.id, doc.data()));
  const days = daySnap.docs.map((doc) => serialise<Day>(doc.id, doc.data()));
  const people = normaliseAllowedPeople(peopleSnap.docs.map((doc) => serialise<Person>(doc.id, doc.data())));
  const media = mediaSnap.docs.map((doc) => serialise<Media>(doc.id, doc.data()));

  return NextResponse.json({ collections, days, people, media });
}

