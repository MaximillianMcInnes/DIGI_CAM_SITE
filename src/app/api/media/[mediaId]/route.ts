import { NextRequest, NextResponse } from "next/server";
import { isGuardResponse, verifyAdminRequest } from "@/src/lib/auth/adminGuard";
import { deleteMediaDocument, getMediaDocument, patchMediaDocument } from "@/src/lib/media/firestore";
import { deleteStorageFiles } from "@/src/lib/media/storage";
import type { MediaDocument } from "@/src/lib/media/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const { mediaId } = await params;
  const body = (await request.json()) as Partial<MediaDocument>;
  const allowed: Partial<MediaDocument> = {};

  for (const key of [
    "collectionId",
    "collectionSlug",
    "dayId",
    "daySlug",
    "peopleIds",
    "peopleSlugs",
    "tags",
    "caption",
    "location",
    "capturedAt",
    "status",
    "sortOrder",
  ] as const) {
    if (key in body) {
      (allowed as Record<string, unknown>)[key] = body[key];
    }
  }

  await patchMediaDocument(mediaId, allowed);
  return NextResponse.json({ ok: true, mediaId });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const { mediaId } = await params;
  const media = await getMediaDocument(mediaId);
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  await deleteStorageFiles([
    media.originalStoragePath,
    media.displayStoragePath,
    media.thumbnailStoragePath,
    media.videoMp4StoragePath,
  ]);
  await deleteMediaDocument(mediaId);

  return NextResponse.json({ ok: true, mediaId });
}
