import { NextRequest, NextResponse } from "next/server";
import { isAdminAccessResponse, type AdminIdentity, verifyAdminAccess } from "@/lib/server-admin";

export async function verifyAdminRequest(request: NextRequest): Promise<AdminIdentity | NextResponse> {
  return verifyAdminAccess(request);
}

export function isGuardResponse(value: AdminIdentity | NextResponse): value is NextResponse {
  return isAdminAccessResponse(value);
}

