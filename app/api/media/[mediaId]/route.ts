import { DELETE as srcDelete, PATCH as srcPatch } from "@/src/app/api/media/[mediaId]/route";

export const runtime = "nodejs";
export const maxDuration = 300;
export const PATCH = srcPatch;
export const DELETE = srcDelete;
