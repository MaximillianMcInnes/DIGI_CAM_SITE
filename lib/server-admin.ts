import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PASSWORD_HEADER, isAdminPassword } from "@/lib/admin-password";
import { isAdminEmail, verifyBearerToken } from "@/lib/firebase/admin";

export type AdminIdentity = {
  uid: string;
  email?: string | null;
};

export async function verifyAdminAccess(request: NextRequest): Promise<AdminIdentity | NextResponse> {
  if (isAdminPassword(request.headers.get(ADMIN_PASSWORD_HEADER))) {
    return { uid: "password-admin", email: "password@local" };
  }

  const decoded = await verifyBearerToken(request.headers.get("authorization")).catch(() => null);
  if (decoded && isAdminEmail(decoded.email)) {
    return { uid: decoded.uid, email: decoded.email };
  }

  return NextResponse.json({ error: "Admin password required" }, { status: 401 });
}

export function isAdminAccessResponse(value: AdminIdentity | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

