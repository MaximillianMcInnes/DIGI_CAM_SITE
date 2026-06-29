import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { hashSharePassword } from "@/lib/security";
import { isAdminAccessResponse, verifyAdminAccess } from "@/lib/server-admin";

export async function POST(request: NextRequest) {
  const admin = await verifyAdminAccess(request);
  if (isAdminAccessResponse(admin)) return admin;

  const body = (await request.json()) as {
    targetType?: string;
    targetId?: string;
    targetSlug?: string;
    expiresAt?: string;
    password?: string;
    allowDownload?: boolean;
    allowOriginalQuality?: boolean;
  };
  if (!body.targetType || !body.targetId) {
    return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  const shareId = randomBytes(6).toString("base64url");
  const ref = db.collection("shares").doc();
  await ref.set({
    id: ref.id,
    shareId,
    targetType: body.targetType,
    targetId: body.targetId,
    targetSlug: body.targetSlug ?? "",
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    passwordHash: body.password ? hashSharePassword(body.password) : "",
    allowDownload: Boolean(body.allowDownload),
    allowOriginalQuality: Boolean(body.allowOriginalQuality),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: admin.uid,
    viewCount: 0,
  });

  return NextResponse.json({ shareId, url: `/share/${shareId}` });
}
