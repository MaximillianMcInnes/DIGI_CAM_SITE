# DigiShare Conversion Audit Changed Files

## .env.example

``bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aiscend-14a48
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aiscend-14a48.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

ADMIN_EMAILS=you@example.com
FIREBASE_SERVICE_ACCOUNT_JSON=
DIGISHARE_MAX_UPLOAD_MB=120
````

## README.md

``md
# DigiCam Social / DigiShare

Premium private digicam-style photo and video sharing built with Next.js 15, TypeScript, Tailwind CSS, Firebase Auth, Firestore, Storage, Firebase Admin, and in-process FFmpeg conversion inside Next.js route handlers.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The public gallery routes use Firestore when Firebase Admin is configured and fall back to polished demo data until env vars are filled in.

Required environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `ADMIN_EMAILS`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `DIGISHARE_MAX_UPLOAD_MB` (optional, defaults to `120`)

## Core Routes

- `/`
- `/login`
- `/upload`
- `/admin`
- `/admin/collections`
- `/admin/media`
- `/c/[collectionSlug]`
- `/c/[collectionSlug]/day/[daySlug]`
- `/u/[personSlug]`
- `/share/[shareId]`

## Firebase

Use the existing AIScend Firebase project values in `.env.local`. The known project identifiers are included in `.env.example`:

- `aiscend-14a48`
- `aiscend-14a48.firebasestorage.app`

Update `firestore.rules` and `storage.rules` with your real admin emails before deploying rules. Firebase rules cannot read `.env`, so the same email list from `ADMIN_EMAILS` must be pasted into both rules files.

Public reads are limited to ready media from public/unlisted collections. Private collections stay hidden on `/c/[slug]` and are only visible to admins or through valid share links.

## Video Conversion

Video conversion happens directly in the Next.js server API routes with `fluent-ffmpeg`, `ffmpeg-static`, and `ffprobe-static`. There is no Cloud Run worker, Cloud Function, or separate backend service.

Deploy to a real Node runtime with enough CPU, memory, request time, and writable `/tmp` disk for FFmpeg. A VPS or container host is the safest target. Firebase App Hosting can work only if your selected runtime supports long-running Node route handlers, native binaries, and enough temp storage. Do not rely on Vercel serverless for large MOV/MP4 conversion.

Media upload and conversion routes explicitly run with:

```ts
export const runtime = "nodejs";
export const maxDuration = 300;
```

Set `DIGISHARE_MAX_UPLOAD_MB` to cap uploads before processing. The server checks both `Content-Length` and the parsed `File.size`; the default cap is `120` MB. Keep this value comfortably below the memory and `/tmp` limits of your deployment target.

The server stores original videos, converted MP4s, thumbnails, duration, dimensions, file size metadata, and marks failures as `status: "failed"` for retry from `/admin/media`.

## Admin Features

- Dashboard stats for collections, days, people, media, processing videos, and failed videos.
- Manage collections, days, and people.
- Drag/drop upload with inline collection/day creation and people/tag/caption/location assignment.
- Bulk media assign, hide, unhide, delete, set cover, reorder, and retry conversion.
- Share links for collection, day, person, or media with optional expiry, optional password, download toggle, and original-quality toggle.
````

## app/api/admin/media/bulk/route.ts

``ts
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage, isAdminEmail, verifyBearerToken } from "@/lib/firebase/admin";

type BulkAction = "assign" | "add-tags" | "hide" | "unhide" | "delete" | "set-cover" | "reorder";

export async function POST(request: NextRequest) {
  const decoded = await verifyBearerToken(request.headers.get("authorization"));
  if (!decoded || !isAdminEmail(decoded.email)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: BulkAction;
    mediaIds?: string[];
    collectionId?: string;
    collectionSlug?: string;
    dayId?: string;
    daySlug?: string;
    peopleIds?: string[];
    peopleSlugs?: string[];
    targetType?: "collection" | "day" | "person";
    targetId?: string;
    sortOrders?: Record<string, number>;
    tags?: string[];
  };

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  const mediaIds = body.mediaIds ?? [];
  if (!body.action || mediaIds.length === 0) {
    return NextResponse.json({ error: "action and mediaIds are required" }, { status: 400 });
  }

  const batch = db.batch();
  const refs = mediaIds.map((id) => db.collection("media").doc(id));

  if (body.action === "assign") {
    refs.forEach((ref) => {
      batch.update(ref, {
        collectionId: body.collectionId ?? FieldValue.delete(),
        collectionSlug: body.collectionSlug ?? FieldValue.delete(),
        dayId: body.dayId ?? FieldValue.delete(),
        daySlug: body.daySlug ?? FieldValue.delete(),
        peopleIds: body.peopleIds ?? [],
        peopleSlugs: body.peopleSlugs ?? [],
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  if (body.action === "add-tags") {
    const tags = body.tags ?? [];
    if (tags.length === 0) return NextResponse.json({ ok: true, count: 0 });
    refs.forEach((ref) => {
      batch.update(ref, {
        tags: FieldValue.arrayUnion(...tags),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  if (body.action === "hide" || body.action === "unhide") {
    refs.forEach((ref) => batch.update(ref, { status: body.action === "hide" ? "hidden" : "ready" }));
  }

  if (body.action === "reorder") {
    refs.forEach((ref) => batch.update(ref, { sortOrder: body.sortOrders?.[ref.id] ?? Date.now() }));
  }

  if (body.action === "set-cover") {
    const first = await refs[0].get();
    if (!first.exists) return NextResponse.json({ error: "Media not found" }, { status: 404 });
    const media = first.data();
    const coverImageUrl =
      media?.thumbnailUrl ||
      media?.displayUrl ||
      (media?.type === "image" ? media?.originalUrl : "") ||
      "";
    const coverData = {
      coverMediaId: refs[0].id,
      coverImageUrl,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.targetType === "collection" && body.targetId) {
      batch.update(db.collection("collections").doc(body.targetId), coverData);
    }
    if (body.targetType === "day" && body.targetId) {
      batch.update(db.collection("days").doc(body.targetId), coverData);
    }
    if (body.targetType === "person" && body.targetId) {
      batch.update(db.collection("people").doc(body.targetId), { avatarUrl: coverImageUrl });
    }
  }

  if (body.action === "delete") {
    const storage = getAdminStorage();
    for (const ref of refs) {
      const snap = await ref.get();
      const media = snap.data();
      const paths = [
        media?.originalStoragePath,
        media?.displayStoragePath,
        media?.thumbnailStoragePath,
        media?.videoMp4StoragePath,
      ].filter(Boolean) as string[];
      if (storage) {
        await Promise.all(paths.map((path) => storage.bucket().file(path).delete({ ignoreNotFound: true })));
      }
      batch.delete(ref);
    }
  }

  await batch.commit();
  return NextResponse.json({ ok: true, count: mediaIds.length });
}
````

## app/api/media/upload/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/upload/route";

export const runtime = "nodejs";
export const maxDuration = 300;
export const POST = srcPost;
````

## app/api/media/convert/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/convert/route";

export const runtime = "nodejs";
export const maxDuration = 300;
export const POST = srcPost;
````

## app/api/media/retry-conversion/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/retry-conversion/route";

export const runtime = "nodejs";
export const maxDuration = 300;
export const POST = srcPost;
````

## app/api/media/retry/route.ts

``ts
import { POST as srcPost } from "@/src/app/api/media/retry-conversion/route";

export const runtime = "nodejs";
export const maxDuration = 300;
export const POST = srcPost;
````

## app/api/media/[mediaId]/route.ts

``ts
import { DELETE as srcDelete, PATCH as srcPatch } from "@/src/app/api/media/[mediaId]/route";

export const runtime = "nodejs";
export const maxDuration = 300;
export const PATCH = srcPatch;
export const DELETE = srcDelete;
````

## components/admin-media-console.tsx

``ts
"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Eye, EyeOff, RotateCcw, Star, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { auth, db } from "@/lib/firebase/client";
import type { Collection, Day, Media, Person } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

export function AdminMediaConsole() {
  return (
    <AdminGuard>
      <MediaWorkspace />
    </AdminGuard>
  );
}

function MediaWorkspace() {
  const [media, setMedia] = useState<Media[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [dayId, setDayId] = useState("");
  const [peopleIds, setPeopleIds] = useState<string[]>([]);
  const [bulkTags, setBulkTags] = useState("");
  const [error, setError] = useState("");

  const selectedCollection = collections.find((item) => item.id === collectionId);
  const selectedDay = days.find((item) => item.id === dayId);
  const selectedPeople = people.filter((item) => peopleIds.includes(item.id));
  const collectionDays = days.filter((item) => item.collectionId === collectionId);
  const selectedMedia = useMemo(() => media.filter((item) => selected.includes(item.id)), [media, selected]);

  async function load() {
    if (!db) return;
    const [mediaSnap, collectionSnap, daySnap, peopleSnap] = await Promise.all([
      getDocs(query(collection(db, "media"), orderBy("uploadedAt", "desc"))),
      getDocs(collection(db, "collections")),
      getDocs(collection(db, "days")),
      getDocs(collection(db, "people")),
    ]);
    setMedia(mediaSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Media));
    setCollections(collectionSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Collection));
    setDays(daySnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Day));
    setPeople(peopleSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Person));
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function authedPost(url: string, body: unknown) {
    if (!auth?.currentUser) return;
    setBusy(url);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Admin action failed");
      setSelected([]);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin action failed");
    } finally {
      setBusy("");
    }
  }

  async function retry(mediaId: string) {
    await authedPost("/api/media/retry-conversion", { mediaId });
  }

  async function bulk(action: "assign" | "add-tags" | "hide" | "unhide" | "delete" | "set-cover" | "reorder") {
    if (selected.length === 0) return;
    await authedPost("/api/admin/media/bulk", {
      action,
      mediaIds: selected,
      collectionId: selectedCollection?.id,
      collectionSlug: selectedCollection?.slug,
      dayId: selectedDay?.id,
      daySlug: selectedDay?.slug,
      peopleIds,
      peopleSlugs: selectedPeople.map((item) => item.slug),
      targetType: selectedDay ? "day" : selectedCollection ? "collection" : selectedPeople[0] ? "person" : undefined,
      targetId: selectedDay?.id ?? selectedCollection?.id ?? selectedPeople[0]?.id,
      sortOrders: Object.fromEntries(selected.map((id, index) => [id, Date.now() + index])),
      tags: bulkTags
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">Bulk edit</h2>
            <p className="text-sm text-stone-500">{selected.length} selected</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToolButton onClick={() => bulk("assign")} label="Assign" />
            <ToolButton onClick={() => bulk("add-tags")} label="Add tags" icon={<Tag size={15} />} />
            <ToolButton onClick={() => bulk("hide")} label="Hide" icon={<EyeOff size={15} />} />
            <ToolButton onClick={() => bulk("unhide")} label="Unhide" icon={<Eye size={15} />} />
            <ToolButton onClick={() => bulk("set-cover")} label="Set cover" icon={<Star size={15} />} />
            <ToolButton onClick={() => bulk("reorder")} label="Reorder" />
            <ToolButton onClick={() => bulk("delete")} label="Delete" icon={<Trash2 size={15} />} danger />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <select
            value={collectionId}
            onChange={(event) => {
              setCollectionId(event.target.value);
              setDayId("");
            }}
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          >
            <option value="">No collection change</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <select
            value={dayId}
            onChange={(event) => setDayId(event.target.value)}
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          >
            <option value="">No day change</option>
            {collectionDays.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <select
            value={peopleIds[0] ?? ""}
            onChange={(event) => setPeopleIds(event.target.value ? [event.target.value] : [])}
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          >
            <option value="">No person change</option>
            {people.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
          <input
            value={bulkTags}
            onChange={(event) => setBulkTags(event.target.value)}
            placeholder="Add tags: beach, night"
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[48px_80px_1fr_110px_120px] gap-3 border-b border-stone-200 bg-[#fbfaf7] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 md:grid">
          <span />
          <span>Preview</span>
          <span>File</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {media.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 border-b border-stone-100 px-4 py-3 last:border-b-0 md:grid-cols-[48px_80px_1fr_110px_120px] md:items-center"
          >
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="size-5 accent-stone-950"
            />
            <div className="size-16 overflow-hidden rounded-[18px] bg-stone-100">
              {item.thumbnailUrl || item.displayUrl ? (
                <img src={item.thumbnailUrl ?? item.displayUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-950">{item.originalFileName}</p>
              <p className="text-xs text-stone-500">
                {item.collectionSlug || "uncategorised"} {item.daySlug ? `/ ${item.daySlug}` : ""}{" "}
                {item.uploadedAt ? `- ${prettyDate(item.uploadedAt)}` : ""}
              </p>
              <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-stone-400">
                REC {item.type} {item.width && item.height ? `${item.width}x${item.height}` : ""}
              </p>
              {item.processingError ? (
                <p className="mt-1 line-clamp-2 text-xs text-rose-600">{item.processingError}</p>
              ) : null}
            </div>
            <span className="text-sm font-medium text-stone-700">{item.status}</span>
            <button
              onClick={() => retry(item.id)}
              disabled={item.type !== "video" || busy !== ""}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
            >
              <RotateCcw size={14} />
              Retry
            </button>
          </div>
        ))}
      </section>

      {selectedMedia.length ? (
        <p className="text-sm text-stone-500">
          Selected: {selectedMedia.map((item) => item.originalFileName).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        danger ? "bg-[#8d2f3f] text-white" : "bg-stone-950 text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
````

## components/gallery-shell.tsx

``ts
import { CalendarDays, Camera, Film, Image as ImageIcon } from "lucide-react";
import { DayCard } from "@/components/collection-card";
import { GalleryActions } from "@/components/gallery-actions";
import { MediaGrid } from "@/components/media-grid";
import { PersonCard, ShareDialog } from "@/components/gallery-ui";
import type { Collection, Day, Media, Person } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

type GalleryShellProps = {
  collection?: Collection;
  day?: Day;
  person?: Person;
  days?: Day[];
  media: Media[];
  people?: Person[];
  shareMode?: boolean;
  allowDownload?: boolean;
  allowOriginalQuality?: boolean;
};

export function GalleryShell({
  collection,
  day,
  person,
  days = [],
  media,
  people = [],
  shareMode,
  allowDownload = true,
  allowOriginalQuality = false,
}: GalleryShellProps) {
  const title = day?.title ?? person?.displayName ?? collection?.title ?? "DigiShare";
  const description = day?.description ?? person?.bio ?? collection?.description;
  const cover = day?.coverImageUrl ?? person?.avatarUrl ?? collection?.coverImageUrl ?? media[0]?.displayUrl;
  const subtitle = day?.date ? prettyDate(day.date) : shareMode ? "Shared private link" : "Private digicam archive";
  const videoCount = media.filter((item) => item.type === "video").length;
  const photoCount = media.filter((item) => item.type === "image").length;
  const featuredPeople = people.length ? people : [];
  const downloadUrl = allowOriginalQuality
    ? media[0]?.originalUrl
    : media[0]?.type === "video"
      ? media[0]?.videoMp4Url
      : media[0]?.displayUrl ?? media[0]?.originalUrl;

  return (
    <main>
      <section className="mx-auto max-w-[1480px] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-stone-950 shadow-[0_30px_100px_rgba(28,25,23,0.18)]">
          <div className="min-h-[520px] lg:min-h-[640px]">
            {cover ? (
              <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-200 text-stone-500">
                <ImageIcon size={44} />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur">
                  {subtitle}
                </span>
                <span className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]">
                  REC
                </span>
              </div>
              <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                <div>
                  <h1 className="max-w-4xl text-5xl font-semibold tracking-normal sm:text-7xl">{title}</h1>
                  {description ? <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">{description}</p> : null}
                </div>
                <div className="rounded-[26px] border border-white/15 bg-white/12 p-4 backdrop-blur-xl">
                  <dl className="grid grid-cols-3 gap-2">
                    <Stat icon={<CalendarDays size={16} />} label="Days" value={days.length || (day ? 1 : 0)} />
                    <Stat icon={<Camera size={16} />} label="Photos" value={photoCount} />
                    <Stat icon={<Film size={16} />} label="Videos" value={videoCount} />
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ShareDialog title={`Share ${title}`} triggerLabel={day ? "Share day" : person ? "Share person" : "Share collection"} />
                    <GalleryActions allowDownload={allowDownload} downloadUrl={downloadUrl} compact />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {days.length > 0 ? (
        <section className="border-y border-stone-200 bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Days</p>
                <h2 className="mt-2 text-3xl font-semibold text-stone-950">Browse by day</h2>
              </div>
            </div>
            <div className="grid auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-[48%] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible">
              {days.map((item) => (
                <DayCard key={item.id} day={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {featuredPeople.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Featured people</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPeople.slice(0, 8).map((item) => (
              <PersonCard key={item.id} person={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">
              {day ? "Timeline" : "Media"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">
              {day ? "All frames from this day" : "Full gallery"}
            </h2>
          </div>
        </div>
        <div className={day ? "border-l border-stone-200 pl-4 sm:pl-6" : ""}>
          <MediaGrid media={media} allowDownload={allowDownload} allowOriginalQuality={allowOriginalQuality} />
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[18px] bg-white/12 p-3">
      <div className="text-white/80">{icon}</div>
      <dt className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-white">{value}</dd>
    </div>
  );
}
````

## components/gallery-ui.tsx

``ts
"use client";

import Link from "next/link";
import {
  Camera,
  Check,
  Clipboard,
  Download,
  EyeOff,
  Film,
  Image as ImageIcon,
  Loader2,
  Lock,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import type { Media, Person } from "@/lib/types";
import { cn, formatBytes, prettyDate } from "@/lib/utils";

export function StatusBadge({ status }: { status?: string }) {
  const tone =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "failed"
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : status === "hidden"
          ? "bg-stone-100 text-stone-600 ring-stone-200"
          : "bg-amber-50 text-amber-700 ring-amber-100";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>
      {status === "processing" || status === "uploading" ? <Loader2 size={12} className="animate-spin" /> : null}
      {status ?? "draft"}
    </span>
  );
}

export function ProcessingBadge({ label = "Processing video" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
      <Loader2 size={13} className="animate-spin" />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        <Camera size={20} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-stone-950">{title}</h3>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-stone-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-stone-100" />
            <div className="h-3 w-full animate-pulse rounded-full bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DownloadButton({
  href,
  disabled,
  label = "Download",
}: {
  href?: string;
  disabled?: boolean;
  label?: string;
}) {
  if (!href || disabled) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400">
        <Download size={15} />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#284235]"
    >
      <Download size={15} />
      {label}
    </a>
  );
}

export function CopyLinkButton({ value, label = "Copy link" }: { value?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = value || window.location.href;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-950"
    >
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function ShareDialog({
  title = "Share this gallery",
  triggerLabel = "Share",
}: {
  title?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#284235]"
      >
        <Share2 size={15} />
        {triggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d2f3f]">Private link</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-950">{title}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-full bg-stone-100">
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 rounded-[18px] border border-stone-200 bg-[#fbfaf7] p-3 text-sm text-stone-600">
              <p className="truncate font-mono text-xs">{url}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <CopyLinkButton value={url} />
              <button
                onClick={() => navigator.share?.({ title, url })}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800"
              >
                <Share2 size={15} />
                Native share
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ConfirmDialog({
  title,
  body,
  onConfirm,
  trigger,
}: {
  title: string;
  body?: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
            {body ? <p className="mt-2 text-sm leading-6 text-stone-500">{body}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#8d2f3f] px-4 py-2 text-sm font-semibold text-white"
              >
                <Trash2 size={15} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type Toast = { id: string; message: string };
const ToastContext = createContext<(message: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (message: string) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 2600);
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function VideoPlayer({ media, autoPlay }: { media: Media; autoPlay?: boolean }) {
  const src = media.videoMp4Url;
  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-stone-950 text-white">
        <Film size={28} />
        <p className="text-sm font-semibold">
          {media.status === "failed" ? "Video conversion failed" : "Converting MOV to MP4..."}
        </p>
      </div>
    );
  }

  return (
    <video
      src={src}
      poster={media.thumbnailUrl ?? media.displayUrl}
      controls
      autoPlay={autoPlay}
      playsInline
      className="h-full w-full object-contain"
    />
  );
}

export function MediaCard({
  media,
  index = 0,
  onOpen,
}: {
  media: Media;
  index?: number;
  onOpen?: (media: Media) => void;
}) {
  const image = media.thumbnailUrl ?? media.displayUrl ?? (media.type === "image" ? media.originalUrl : undefined);
  const tall = index % 5 === 0 || index % 5 === 3;

  return (
    <button
      onClick={() => onOpen?.(media)}
      className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-[24px] border border-stone-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className={cn("relative overflow-hidden bg-stone-100", tall ? "aspect-[4/5]" : "aspect-[4/3]")}>
        {media.status === "processing" ? (
          <div className="flex h-full items-center justify-center">
            <ProcessingBadge />
          </div>
        ) : media.status === "failed" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-rose-50 text-rose-700">
            <Film />
            <span className="text-sm font-semibold">Conversion failed</span>
          </div>
        ) : (
          <>
            {image ? (
              <img
                src={image}
                alt={media.caption ?? media.originalFileName}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400">
                <ImageIcon />
              </div>
            )}
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-950 shadow-sm">
                {media.type === "video" ? "REC" : "DSC"}
              </span>
              {media.type === "video" ? (
                <span className="flex size-7 items-center justify-center rounded-full bg-black/70 text-white">
                  <Film size={13} />
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-sm font-semibold text-stone-950">{media.caption || media.originalFileName}</p>
          <StatusBadge status={media.status} />
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
          <span>{media.originalFileName}</span>
          {media.capturedAt ? <span>{prettyDate(media.capturedAt)}</span> : null}
          {media.fileSizeBytes ? <span>{formatBytes(media.fileSizeBytes)}</span> : null}
        </div>
      </div>
    </button>
  );
}

export function MasonryGrid({ children }: { children: React.ReactNode }) {
  return <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">{children}</div>;
}

export function PersonCard({ person }: { person: Person }) {
  return (
    <Link
      href={`/u/${person.slug}`}
      className="group flex items-center gap-3 rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="size-14 overflow-hidden rounded-full bg-stone-100">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            <Camera size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-950">{person.displayName}</p>
        <p className="text-xs text-stone-500">{person.mediaCount} frames</p>
      </div>
    </Link>
  );
}

export function AdminMetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <span className="text-[#284235]">{icon ?? <Sparkles size={16} />}</span>
      </div>
      <p className="mt-5 text-3xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

export function VisibilityPill({ visibility }: { visibility?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-950 shadow-sm">
      {visibility === "private" ? <Lock size={12} /> : visibility === "hidden" ? <EyeOff size={12} /> : null}
      {visibility ?? "unlisted"}
    </span>
  );
}

export function useDebouncedValue<T>(value: T, delay = 160) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [delay, value]);
  return debounced;
}
````

## components/media-grid.tsx

``ts
"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search, SlidersHorizontal, Tag, UserRound, X } from "lucide-react";
import {
  DownloadButton,
  EmptyState,
  MasonryGrid,
  MediaCard,
  StatusBadge,
  VideoPlayer,
  useDebouncedValue,
} from "@/components/gallery-ui";
import type { Media } from "@/lib/types";
import { cn, formatBytes, prettyDate } from "@/lib/utils";

type TypeFilter = "all" | "image" | "video";
type SortMode = "custom" | "newest" | "oldest";

export function MediaGrid({
  media,
  allowDownload = false,
  allowOriginalQuality = false,
}: {
  media: Media[];
  allowDownload?: boolean;
  allowOriginalQuality?: boolean;
}) {
  const [selected, setSelected] = useState<Media | null>(null);
  const [type, setType] = useState<TypeFilter>("all");
  const [day, setDay] = useState("all");
  const [person, setPerson] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<SortMode>("custom");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const facets = useMemo(() => {
    return {
      days: [...new Set(media.map((item) => item.daySlug).filter(Boolean))] as string[],
      people: [...new Set(media.flatMap((item) => item.peopleSlugs ?? []))],
      tags: [...new Set(media.flatMap((item) => item.tags ?? []))],
    };
  }, [media]);

  const filtered = useMemo(() => {
    const rows = media.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (day !== "all" && item.daySlug !== day) return false;
      if (person !== "all" && !item.peopleSlugs?.includes(person)) return false;
      if (tag !== "all" && !item.tags?.includes(tag)) return false;
      const haystack = [
        item.caption,
        item.location,
        item.daySlug,
        item.originalFileName,
        ...(item.tags ?? []),
        ...(item.peopleSlugs ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(debouncedQuery.toLowerCase());
    });

    return [...rows].sort((a, b) => {
      if (sort === "newest") return String(b.capturedAt ?? b.uploadedAt ?? "").localeCompare(String(a.capturedAt ?? a.uploadedAt ?? ""));
      if (sort === "oldest") return String(a.capturedAt ?? a.uploadedAt ?? "").localeCompare(String(b.capturedAt ?? b.uploadedAt ?? ""));
      return (a.sortOrder ?? 999999) - (b.sortOrder ?? 999999);
    });
  }, [day, debouncedQuery, media, person, sort, tag, type]);

  return (
    <>
      <div className="mb-6 rounded-[24px] border border-stone-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-stone-100 px-4 py-3 text-stone-500">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search filename, tag, person..."
              className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
          </div>
          <div className="grid grid-cols-3 rounded-full bg-stone-100 p-1 text-sm font-semibold text-stone-600">
            {(["all", "image", "video"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setType(item)}
                className={cn("rounded-full px-4 py-2 capitalize transition", type === item ? "bg-stone-950 text-white shadow-sm" : "hover:text-stone-950")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <FilterSelect icon={<CalendarDays size={14} />} value={day} onChange={setDay} label="Day" options={facets.days} />
          <FilterSelect icon={<UserRound size={14} />} value={person} onChange={setPerson} label="Person" options={facets.people} />
          <FilterSelect icon={<Tag size={14} />} value={tag} onChange={setTag} label="Tag" options={facets.tags} />
          <label className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600">
            <SlidersHorizontal size={14} />
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="min-w-0 flex-1 bg-transparent outline-none">
              <option value="custom">Custom order</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </div>

      {filtered.length ? (
        <MasonryGrid>
          {filtered.map((item, index) => (
            <MediaCard key={item.id} media={item} index={index} onOpen={setSelected} />
          ))}
        </MasonryGrid>
      ) : (
        <EmptyState title="No frames match" body="Try clearing one of the filters or changing the sort." />
      )}

      {selected ? (
        <Lightbox
          media={selected}
          allowDownload={allowDownload}
          allowOriginalQuality={allowOriginalQuality}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

function FilterSelect({
  icon,
  value,
  onChange,
  label,
  options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-600">
      {icon}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none">
        <option value="all">All {label.toLowerCase()}s</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function Lightbox({
  media,
  allowDownload,
  allowOriginalQuality,
  onClose,
}: {
  media: Media;
  allowDownload: boolean;
  allowOriginalQuality: boolean;
  onClose: () => void;
}) {
  const source = media.type === "video" ? media.videoMp4Url : media.displayUrl ?? media.originalUrl;
  const downloadSource = allowOriginalQuality ? media.originalUrl : source;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 p-3 text-white backdrop-blur-sm sm:p-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={media.status} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                {media.type === "video" ? "REC" : "DSC"} {prettyDate(media.capturedAt)}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-semibold">{media.caption ?? media.originalFileName}</p>
          </div>
          <button onClick={onClose} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] bg-black shadow-2xl">
          {media.type === "video" ? (
            <VideoPlayer media={media} autoPlay />
          ) : (
            <img src={source} alt={media.caption ?? ""} className="h-full w-full object-contain" />
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs">{media.originalFileName}</span>
            {media.location ? <span>{media.location}</span> : null}
            {media.fileSizeBytes ? <span>{formatBytes(media.fileSizeBytes)}</span> : null}
          </div>
          <DownloadButton href={downloadSource} disabled={!allowDownload} />
        </div>
      </div>
    </div>
  );
}
````

## lib/firebase/admin.ts

``ts
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function normalisePrivateKey(key?: string) {
  return key?.replace(/\\n/g, "\n");
}

function serviceAccountFromJson() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;

  const parsed = JSON.parse(json) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: normalisePrivateKey(parsed.private_key),
  };
}

export function getFirebaseAdminApp(): App | null {
  const serviceAccount = serviceAccountFromJson();
  const projectId =
    serviceAccount?.projectId ?? process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalisePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId) return null;
  if (getApps().length) return getApp();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket,
    });
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      storageBucket,
    });
  }

  return initializeApp({ projectId, storageBucket });
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminStorage() {
  const app = getFirebaseAdminApp();
  return app ? getStorage(app) : null;
}

export async function verifyBearerToken(header: string | null) {
  const app = getFirebaseAdminApp();
  if (!app || !header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  return getAuth(app).verifyIdToken(token);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}
````

## src/app/api/media/upload/route.ts

``ts
import { extname } from "path";
import { NextRequest, NextResponse } from "next/server";
import { isGuardResponse, verifyAdminRequest } from "@/src/lib/auth/adminGuard";
import { createMediaDocument, newMediaRef, updateMediaReady, updateMediaStatus } from "@/src/lib/media/firestore";
import { processImage } from "@/src/lib/media/processImage";
import { processVideo } from "@/src/lib/media/processVideo";
import {
  cleanupTempDir,
  makeTempDir,
  sanitizeFileName,
  storagePathFor,
  uploadBufferToStorage,
  uploadFileToStorage,
  writeTempFile,
} from "@/src/lib/media/storage";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  maxUploadBytes,
  type UploadMetadata,
} from "@/src/lib/media/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const maxBytes = maxUploadBytes();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > maxBytes) {
    return NextResponse.json(
      { error: `Upload is too large. Maximum file size is ${Math.floor(maxBytes / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File is too large. Maximum file size is ${Math.floor(maxBytes / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }

  const metadata = parseUploadMetadata(formData);
  const fileName = sanitizeFileName(file.name);
  const ext = extname(fileName).toLowerCase();
  const declaredImage = ACCEPTED_IMAGE_TYPES.has(file.type) || [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].includes(ext);
  const declaredVideo = ACCEPTED_VIDEO_TYPES.has(file.type) || [".mov", ".mp4", ".m4v"].includes(ext);

  if (!declaredImage && !declaredVideo) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectMediaKind(buffer, file.type, ext);
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported or unreadable media file. Upload JPG, PNG, WEBP, HEIC, MOV, MP4, or M4V." },
      { status: 415 },
    );
  }

  const mediaRef = newMediaRef();
  const mediaId = mediaRef.id;
  const tempDir = await makeTempDir();

  try {
    const inputPath = await writeTempFile(tempDir, fileName, buffer);
    const originalStoragePath = storagePathFor(mediaId, metadata.collectionSlug, `original${ext || ".bin"}`);
    const originalUrl = await uploadBufferToStorage(
      originalStoragePath,
      buffer,
      file.type || (kind === "video" ? "video/quicktime" : "application/octet-stream"),
    );

    await createMediaDocument({
      id: mediaId,
      uploadedBy: decoded.uid,
      type: kind,
      originalFileName: fileName,
      originalStoragePath,
      originalUrl,
      fileSizeBytes: file.size,
      status: kind === "video" ? "processing" : "uploading",
      metadata,
    });

    if (kind === "image") {
      const processed = await processImage(buffer);
      const displayStoragePath = processed.displayBuffer
        ? storagePathFor(mediaId, metadata.collectionSlug, "display.jpg")
        : undefined;
      const displayUrl = displayStoragePath
        ? await uploadBufferToStorage(displayStoragePath, processed.displayBuffer as Buffer, "image/jpeg")
        : originalUrl;
      const thumbnailStoragePath = processed.thumbnailBuffer
        ? storagePathFor(mediaId, metadata.collectionSlug, "thumbnail.jpg")
        : undefined;
      const thumbnailUrl = thumbnailStoragePath
        ? await uploadBufferToStorage(thumbnailStoragePath, processed.thumbnailBuffer as Buffer, "image/jpeg")
        : displayUrl;

      await updateMediaReady(mediaId, {
        displayStoragePath,
        displayUrl,
        thumbnailStoragePath,
        thumbnailUrl,
        width: processed.width,
        height: processed.height,
      });
    } else {
      const processed = await processVideo(inputPath, tempDir);
      const videoMp4StoragePath = storagePathFor(mediaId, metadata.collectionSlug, "converted.mp4");
      const thumbnailStoragePath = processed.thumbnailPath
        ? storagePathFor(mediaId, metadata.collectionSlug, "video-thumbnail.jpg")
        : undefined;
      const videoMp4Url = await uploadFileToStorage(videoMp4StoragePath, processed.mp4Path, "video/mp4");
      const thumbnailUrl = processed.thumbnailPath && thumbnailStoragePath
        ? await uploadFileToStorage(thumbnailStoragePath, processed.thumbnailPath, "image/jpeg")
        : undefined;

      await updateMediaReady(mediaId, {
        videoMp4StoragePath,
        videoMp4Url,
        thumbnailStoragePath,
        thumbnailUrl,
        displayUrl: thumbnailUrl,
        width: processed.width,
        height: processed.height,
        durationSeconds: processed.durationSeconds,
      });
    }

    return NextResponse.json({ ok: true, mediaId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload processing failed";
    await updateMediaStatus(mediaId, "failed", message).catch(() => undefined);
    return NextResponse.json({ error: message, mediaId }, { status: 500 });
  } finally {
    await cleanupTempDir(tempDir);
  }
}

function detectMediaKind(buffer: Buffer, contentType: string, ext: string): "image" | "video" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image";

  const boxType = buffer.subarray(4, 8).toString("ascii");
  const brandBlock = buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii");
  if (boxType === "ftyp") {
    if (/(heic|heix|hevc|hevx|mif1|msf1|heif)/i.test(brandBlock)) return "image";
    if (/(qt  |mp4|m4v|isom|iso2|avc1|mp41|mp42)/i.test(brandBlock)) return "video";
  }

  if (ACCEPTED_IMAGE_TYPES.has(contentType) && [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].includes(ext)) {
    return "image";
  }
  if (ACCEPTED_VIDEO_TYPES.has(contentType) && [".mov", ".mp4", ".m4v"].includes(ext)) {
    return "video";
  }

  return null;
}

function parseUploadMetadata(formData: FormData): UploadMetadata {
  return {
    collectionId: stringValue(formData, "collectionId"),
    collectionSlug: stringValue(formData, "collectionSlug"),
    dayId: stringValue(formData, "dayId"),
    daySlug: stringValue(formData, "daySlug"),
    peopleIds: listValue(formData, "peopleIds"),
    peopleSlugs: listValue(formData, "peopleSlugs"),
    tags: listValue(formData, "tags"),
    caption: stringValue(formData, "caption"),
    location: stringValue(formData, "location"),
    capturedAt: stringValue(formData, "capturedAt"),
  };
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function listValue(formData: FormData, key: string) {
  const raw = stringValue(formData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
````

## src/app/api/media/convert/route.ts

``ts
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { isGuardResponse, verifyAdminRequest } from "@/src/lib/auth/adminGuard";
import { getMediaDocument, updateMediaReady, updateMediaStatus } from "@/src/lib/media/firestore";
import { processVideo } from "@/src/lib/media/processVideo";
import {
  cleanupTempDir,
  downloadStorageFile,
  makeTempDir,
  storagePathFor,
  uploadFileToStorage,
} from "@/src/lib/media/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const decoded = await verifyAdminRequest(request);
  if (isGuardResponse(decoded)) return decoded;

  const { mediaId } = (await request.json()) as { mediaId?: string };
  if (!mediaId) return NextResponse.json({ error: "mediaId is required" }, { status: 400 });

  try {
    await convertMediaById(mediaId);
    return NextResponse.json({ ok: true, mediaId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed while creating a browser-compatible MP4";
    await updateMediaStatus(mediaId, "failed", message).catch(() => undefined);
    return NextResponse.json({ error: message, mediaId }, { status: 500 });
  }
}

export async function convertMediaById(mediaId: string) {
  const media = await getMediaDocument(mediaId);
  if (!media) throw new Error("Media not found");
  if (media.type !== "video") throw new Error("Media is not a video");

  const tempDir = await makeTempDir();
  try {
    await updateMediaStatus(mediaId, "processing", null);
    const originalPath = join(tempDir, "original-input");
    await downloadStorageFile(media.originalStoragePath, originalPath);
    const processed = await processVideo(originalPath, tempDir);
    const videoMp4StoragePath = storagePathFor(mediaId, media.collectionSlug, "converted.mp4");
    const thumbnailStoragePath = processed.thumbnailPath
      ? storagePathFor(mediaId, media.collectionSlug, "video-thumbnail.jpg")
      : undefined;
    const videoMp4Url = await uploadFileToStorage(videoMp4StoragePath, processed.mp4Path, "video/mp4");
    const thumbnailUrl = processed.thumbnailPath && thumbnailStoragePath
      ? await uploadFileToStorage(thumbnailStoragePath, processed.thumbnailPath, "image/jpeg")
      : undefined;

    await updateMediaReady(mediaId, {
      videoMp4StoragePath,
      videoMp4Url,
      thumbnailStoragePath,
      thumbnailUrl,
      displayUrl: thumbnailUrl,
      width: processed.width,
      height: processed.height,
      durationSeconds: processed.durationSeconds,
    });
  } finally {
    await cleanupTempDir(tempDir);
  }
}
````

## src/app/api/media/[mediaId]/route.ts

``ts
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
````

## src/components/admin/RetryConversionButton.tsx

``ts
"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { firebaseAuth } from "@/src/lib/firebase/client";

export function RetryConversionButton({ mediaId, onRetried }: { mediaId: string; onRetried?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    if (!firebaseAuth?.currentUser) return;
    setLoading(true);
    setError("");
    try {
      const token = await firebaseAuth.currentUser.getIdToken();
      const response = await fetch("/api/media/retry-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mediaId }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Retry failed");
      onRetried?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Retry failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={retry}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
      >
        <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
        Retry
      </button>
      {error ? <p className="max-w-xs text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
````

## src/lib/media/processVideo.ts

``ts
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { existsSync } from "fs";
import { join } from "path";
import type { ProcessedVideo } from "@/src/lib/media/types";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

type ProbeData = {
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export async function probeVideo(inputPath: string): Promise<ProbeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      const stream = data.streams.find((item) => item.codec_type === "video");
      resolve({
        width: stream?.width,
        height: stream?.height,
        durationSeconds: Number(stream?.duration ?? data.format.duration ?? 0) || undefined,
      });
    });
  });
}

export async function processVideo(inputPath: string, tempDir: string): Promise<ProcessedVideo> {
  if (!ffmpegStatic) {
    throw new Error("FFmpeg binary was not found. Install ffmpeg-static or provide a system FFmpeg binary.");
  }
  if (!ffprobeStatic.path) {
    throw new Error("FFprobe binary was not found. Install ffprobe-static so duration and dimensions can be extracted.");
  }

  const mp4Path = join(tempDir, "converted.mp4");
  const thumbnailPath = join(tempDir, "thumbnail.jpg");

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-map 0:v:0",
          "-map 0:a?",
          "-map_metadata 0",
          "-sn",
          "-dn",
          "-c:v libx264",
          "-preset medium",
          "-crf 23",
          "-pix_fmt yuv420p",
          "-profile:v high",
          "-level 4.0",
          "-tag:v avc1",
          "-c:a aac",
          "-b:a 160k",
          "-movflags +faststart",
          "-vf scale='min(1920,iw)':-2",
          "-f mp4",
        ])
        .output(mp4Path)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
  } catch (error) {
    throw new Error(`FFmpeg could not create a browser-compatible H.264 MP4: ${messageFromError(error)}`);
  }

  await createThumbnail(inputPath, thumbnailPath);
  const metadata = await probeVideo(mp4Path).catch((error) => {
    throw new Error(`Converted MP4 was created, but FFprobe could not read its metadata: ${messageFromError(error)}`);
  });

  return {
    mp4Path,
    thumbnailPath: existsSync(thumbnailPath) ? thumbnailPath : undefined,
    ...metadata,
  };
}

async function createThumbnail(inputPath: string, outputPath: string) {
  try {
    await screenshot(inputPath, outputPath, "00:00:01.000");
  } catch {
    try {
      await screenshot(inputPath, outputPath, "00:00:00.000");
    } catch {
      return;
    }
  }
}

function screenshot(inputPath: string, outputPath: string, timestamp: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(timestamp)
      .frames(1)
      .outputOptions(["-vf scale='min(1280,iw)':-2"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
````

## src/lib/media/storage.ts

``ts
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { mkdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, extname, join } from "path";
import { adminStorage } from "@/src/lib/firebase/admin";

export function sanitizeFileName(fileName: string) {
  const ext = extname(fileName).toLowerCase();
  const stem = basename(fileName, ext)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${stem || "media"}${ext}`;
}

export function sanitizePathSegment(value: string | undefined, fallback: string) {
  const segment = value
    ?.toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return segment || fallback;
}

export function storagePathFor(mediaId: string, collectionSlug: string | undefined, fileName: string) {
  return `media/${sanitizePathSegment(collectionSlug, "uncategorised")}/${sanitizePathSegment(mediaId, "media")}/${sanitizeFileName(fileName)}`;
}

export async function makeTempDir() {
  const dir = join(tmpdir(), `digishare-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanupTempDir(dir: string) {
  await rm(dir, { recursive: true, force: true });
}

export async function writeTempFile(dir: string, fileName: string, buffer: Buffer) {
  const filePath = join(dir, sanitizeFileName(fileName));
  await writeFile(filePath, buffer);
  return filePath;
}

export async function uploadBufferToStorage(path: string, buffer: Buffer, contentType: string) {
  const bucket = adminStorage().bucket();
  const file = bucket.file(path);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000",
    },
  });
  return signedReadUrl(path);
}

export async function uploadFileToStorage(path: string, filePath: string, contentType: string) {
  const bucket = adminStorage().bucket();
  await bucket.upload(filePath, {
    destination: path,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000",
    },
  });
  return signedReadUrl(path);
}

export async function downloadStorageFile(path: string, destination: string) {
  await adminStorage().bucket().file(path).download({ destination });
  return destination;
}

export async function deleteStorageFiles(paths: Array<string | undefined>) {
  const bucket = adminStorage().bucket();
  await Promise.all(paths.filter(Boolean).map((path) => bucket.file(path as string).delete({ ignoreNotFound: true })));
}

export async function signedReadUrl(path: string) {
  const [url] = await adminStorage().bucket().file(path).getSignedUrl({
    action: "read",
    expires: "2100-01-01",
  });
  return url;
}

export function streamFromFile(filePath: string) {
  return createReadStream(filePath);
}
````

## src/lib/media/types.ts

``ts
import type { Timestamp } from "firebase-admin/firestore";

export type MediaType = "image" | "video";
export type MediaStatus = "uploading" | "processing" | "ready" | "failed" | "hidden";

export type MediaDocument = {
  id: string;
  collectionId?: string;
  collectionSlug?: string;
  dayId?: string;
  daySlug?: string;
  peopleIds?: string[];
  peopleSlugs?: string[];
  tags?: string[];
  type: MediaType;
  originalFileName: string;
  originalStoragePath: string;
  originalUrl: string;
  displayStoragePath?: string;
  displayUrl?: string;
  thumbnailStoragePath?: string;
  thumbnailUrl?: string;
  videoMp4StoragePath?: string;
  videoMp4Url?: string;
  caption?: string;
  location?: string;
  capturedAt?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  status: MediaStatus;
  processingError?: string | null;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSizeBytes?: number;
  sortOrder?: number;
};

export type UploadMetadata = {
  collectionId?: string;
  collectionSlug?: string;
  dayId?: string;
  daySlug?: string;
  peopleIds?: string[];
  peopleSlugs?: string[];
  tags?: string[];
  caption?: string;
  location?: string;
  capturedAt?: string;
};

export type ProcessedImage = {
  displayBuffer?: Buffer;
  thumbnailBuffer?: Buffer;
  width?: number;
  height?: number;
};

export type ProcessedVideo = {
  mp4Path: string;
  thumbnailPath?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

const DEFAULT_MAX_UPLOAD_MB = 120;

export function maxUploadBytes() {
  const configured = Number(process.env.DIGISHARE_MAX_UPLOAD_MB ?? process.env.MAX_UPLOAD_FILE_SIZE_MB);
  const megabytes = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_UPLOAD_MB;
  return Math.floor(megabytes * 1024 * 1024);
}

export const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
export const ACCEPTED_VIDEO_TYPES = new Set(["video/quicktime", "video/mp4", "video/x-m4v"]);
````

