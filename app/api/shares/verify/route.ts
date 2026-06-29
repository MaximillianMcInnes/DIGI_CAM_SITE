import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySharePassword } from "@/lib/security";

export async function POST(request: NextRequest) {
  const { shareId, password } = (await request.json()) as {
    shareId?: string;
    password?: string;
  };

  if (!shareId || !password) {
    return NextResponse.json({ error: "shareId and password are required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  const snap = await db.collection("shares").where("shareId", "==", shareId).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: "Share not found" }, { status: 404 });

  const share = snap.docs[0].data();
  if (!verifySharePassword(password, share.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(`digishare_share_${shareId}`, "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: `/share/${shareId}`,
  });
  return response;
}
