# Frontend Changed/New Files

Only files changed or added for the Airbnb-style frontend polish pass are included below.

## File Tree

```text
app/globals.css
app/layout.tsx
app/page.tsx
app/c/[collectionSlug]/page.tsx
app/c/[collectionSlug]/day/[daySlug]/page.tsx
app/share/[shareId]/page.tsx
app/upload/page.tsx
app/admin/page.tsx
app/admin/collections/page.tsx
app/admin/days/page.tsx
app/admin/people/page.tsx
app/admin/media/page.tsx
app/api/admin/media/bulk/route.ts
components/admin-collections-console.tsx
components/admin-media-console.tsx
components/admin-sidebar.tsx
components/collection-card.tsx
components/gallery-actions.tsx
components/gallery-shell.tsx
components/gallery-ui.tsx
components/media-grid.tsx
components/person-profile-gallery.tsx
components/upload-console.tsx
lib/data.ts
```

## Files

### app/globals.css

`$lang
@import "tailwindcss";

:root {
  --background: #fbfaf7;
  --foreground: #17130f;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
}

html {
  scroll-behavior: smooth;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 420ms ease both;
}

button,
a,
input,
select,
textarea {
  letter-spacing: 0;
}

::selection {
  background: #284235;
  color: white;
}
```

### app/layout.tsx

`$lang
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/gallery-ui";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DigiShare | Private digicam galleries",
  description: "Private premium photo and video sharing for digicam collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ToastProvider>
          <SiteHeader />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

### app/page.tsx

`$lang
import Link from "next/link";
import { Camera, Lock, Upload } from "lucide-react";
import { CollectionCard } from "@/components/collection-card";
import { AdminMetricCard } from "@/components/gallery-ui";
import { getCollections } from "@/lib/data";

export default async function Home() {
  const collections = await getCollections();
  const totalMedia = collections.reduce((sum, item) => sum + item.mediaCount, 0);
  const totalDays = collections.reduce((sum, item) => sum + item.dayCount, 0);

  return (
    <main>
      <section className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8 lg:py-10">
        <div className="flex flex-col justify-end rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-stone-950 text-white">
            <Camera size={20} />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#8d2f3f]">DigiCam Social</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-normal text-stone-950 sm:text-7xl">
            Private rolls for your favourite people.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
            Disposable-camera nostalgia, polished gallery links, and a private admin room for all the .MOV chaos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#284235]"
            >
              <Upload size={16} />
              Upload a roll
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:-translate-y-0.5 hover:border-stone-950"
            >
              <Lock size={16} />
              Admin room
            </Link>
          </div>
        </div>

        <div className="grid min-h-[560px] grid-cols-6 grid-rows-6 gap-3">
          {collections[0]?.coverImageUrl ? (
            <img
              src={collections[0].coverImageUrl}
              alt=""
              className="col-span-6 row-span-4 h-full w-full rounded-[32px] object-cover shadow-[0_24px_80px_rgba(28,25,23,0.18)] sm:col-span-4 sm:row-span-6"
            />
          ) : null}
          <div className="col-span-3 row-span-2 rounded-[28px] bg-[#284235] p-5 text-white shadow-xl sm:col-span-2 sm:row-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Archive</p>
            <p className="mt-8 text-5xl font-semibold">{totalMedia}</p>
            <p className="mt-2 text-sm text-white/70">photos and clips</p>
          </div>
          <div className="col-span-3 row-span-2 rounded-[28px] bg-stone-950 p-5 text-white shadow-xl sm:col-span-2 sm:row-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Days</p>
            <p className="mt-8 text-5xl font-semibold">{totalDays}</p>
            <p className="mt-2 text-sm text-white/70">mini stories</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminMetricCard label="Collections" value={collections.length} />
          <AdminMetricCard label="Frames" value={totalMedia} />
          <AdminMetricCard label="Share-ready" value="Private" />
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Collections</p>
              <h2 className="mt-2 text-3xl font-semibold text-stone-950">Albums that feel like places</h2>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <CollectionCard key={collection.id} collection={collection} priority={index === 0} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
```

### app/c/[collectionSlug]/page.tsx

`$lang
import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { getCollectionBySlug, getDaysForCollection, getMediaForCollection, getPeopleBySlugs } from "@/lib/data";

export default async function CollectionPage({ params }: { params: Promise<{ collectionSlug: string }> }) {
  const { collectionSlug } = await params;
  const collection = await getCollectionBySlug(collectionSlug);
  if (!collection) notFound();

  const [days, media] = await Promise.all([
    getDaysForCollection(collection.slug),
    getMediaForCollection(collection.slug),
  ]);
  const people = await getPeopleBySlugs(media.flatMap((item) => item.peopleSlugs ?? []));

  return <GalleryShell collection={collection} days={days} media={media} people={people} />;
}
```

### app/c/[collectionSlug]/day/[daySlug]/page.tsx

`$lang
import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { getCollectionBySlug, getDayBySlug, getMediaForDay, getPeopleBySlugs } from "@/lib/data";

export default async function DayPage({
  params,
}: {
  params: Promise<{ collectionSlug: string; daySlug: string }>;
}) {
  const { collectionSlug, daySlug } = await params;
  const [collection, day] = await Promise.all([
    getCollectionBySlug(collectionSlug),
    getDayBySlug(collectionSlug, daySlug),
  ]);
  if (!collection || !day) notFound();

  const media = await getMediaForDay(collectionSlug, daySlug);
  const people = await getPeopleBySlugs(media.flatMap((item) => item.peopleSlugs ?? []));

  return <GalleryShell collection={collection} day={day} media={media} people={people} />;
}
```

### app/share/[shareId]/page.tsx

`$lang
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { SharePasswordGate } from "@/components/share-password-gate";
import { getPeopleBySlugs, getShareById, getShareBundle, incrementShareView } from "@/lib/data";

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const share = await getShareById(shareId);
  if (!share) notFound();

  const cookieStore = await cookies();
  if (share.passwordHash && cookieStore.get(`digishare_share_${shareId}`)?.value !== "ok") {
    return <SharePasswordGate shareId={shareId} />;
  }

  const bundle = await getShareBundle(shareId);
  if (!bundle) notFound();
  await incrementShareView(shareId);
  const people = await getPeopleBySlugs(bundle.media.flatMap((item) => item.peopleSlugs ?? []));

  return (
    <GalleryShell
      collection={"collection" in bundle ? bundle.collection : undefined}
      day={"day" in bundle ? bundle.day : undefined}
      person={"person" in bundle ? bundle.person : undefined}
      days={bundle.days}
      media={bundle.media}
      people={people}
      allowDownload={bundle.share.allowDownload}
      allowOriginalQuality={bundle.share.allowOriginalQuality}
      shareMode
    />
  );
}
```

### app/upload/page.tsx

`$lang
import { UploadConsole } from "@/components/upload-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function UploadPage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Upload</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Add a new roll</h1>
        </div>
        <UploadConsole />
      </AdminLayoutShell>
    </main>
  );
}
```

### app/admin/page.tsx

`$lang
import Link from "next/link";
import { FolderKanban, Images, Upload } from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import { AdminDashboardStats } from "@/components/admin-dashboard-stats";
import { AdminLayoutShell } from "@/components/admin-sidebar";
import { ShareLinkConsole } from "@/components/share-link-console";

export default function AdminPage() {
  return (
    <main>
      <AdminLayoutShell>
        <AdminGuard>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Archive control room</h1>
        </div>
        <AdminDashboardStats />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <AdminLink href="/upload" icon={<Upload />} title="Upload media" body="Batch upload photos, .MOV, and MP4 files." />
          <AdminLink href="/admin/collections" icon={<FolderKanban />} title="Collections" body="Create albums, days, covers, and people." />
          <AdminLink href="/admin/media" icon={<Images />} title="Media" body="Review status, failed conversions, and links." />
        </div>
        <div className="mt-6">
          <ShareLinkConsole />
        </div>
        </AdminGuard>
      </AdminLayoutShell>
    </main>
  );
}

function AdminLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="text-[#284235]">{icon}</div>
      <h2 className="mt-5 text-lg font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
    </Link>
  );
}
```

### app/admin/collections/page.tsx

`$lang
import { AdminCollectionsConsole } from "@/components/admin-collections-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function AdminCollectionsPage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Collections and people</h1>
        </div>
        <AdminCollectionsConsole />
      </AdminLayoutShell>
    </main>
  );
}
```

### app/admin/days/page.tsx

`$lang
import { AdminCollectionsConsole } from "@/components/admin-collections-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function AdminDaysPage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Manage days</h1>
        </div>
        <AdminCollectionsConsole initialFocus="days" />
      </AdminLayoutShell>
    </main>
  );
}
```

### app/admin/people/page.tsx

`$lang
import { AdminCollectionsConsole } from "@/components/admin-collections-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function AdminPeoplePage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Manage people</h1>
        </div>
        <AdminCollectionsConsole initialFocus="people" />
      </AdminLayoutShell>
    </main>
  );
}
```

### app/admin/media/page.tsx

`$lang
import { AdminMediaConsole } from "@/components/admin-media-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function AdminMediaPage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Media processing</h1>
        </div>
        <AdminMediaConsole />
      </AdminLayoutShell>
    </main>
  );
}
```

### app/api/admin/media/bulk/route.ts

`$lang
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
    const coverImageUrl = media?.thumbnailUrl || media?.displayUrl || media?.videoMp4Url || media?.originalUrl || "";
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
```

### components/admin-collections-console.tsx

`$lang
"use client";

import { addDoc, collection, getDocs, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { ArrowDown, ArrowUp, CalendarDays, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { auth, db } from "@/lib/firebase/client";
import type { Collection, Day, Person, Visibility } from "@/lib/types";
import { slugify } from "@/lib/utils";

export function AdminCollectionsConsole({ initialFocus = "collections" }: { initialFocus?: "collections" | "days" | "people" }) {
  return (
    <AdminGuard>
      <CollectionsWorkspace initialFocus={initialFocus} />
    </AdminGuard>
  );
}

function CollectionsWorkspace({ initialFocus }: { initialFocus: "collections" | "days" | "people" }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("unlisted");
  const [personName, setPersonName] = useState("");
  const [personBio, setPersonBio] = useState("");
  const [personAvatarUrl, setPersonAvatarUrl] = useState("");
  const [dayTitle, setDayTitle] = useState("");
  const [dayDate, setDayDate] = useState("");
  const [dayCollectionId, setDayCollectionId] = useState("");

  async function load() {
    if (!db) return;
    const [collectionSnap, daySnap, peopleSnap] = await Promise.all([
      getDocs(collection(db, "collections")),
      getDocs(collection(db, "days")),
      getDocs(collection(db, "people")),
    ]);
    setCollections(collectionSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Collection));
    setDays(daySnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Day));
    setPeople(peopleSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Person));
  }

  useEffect(() => {
    load();
  }, []);

  async function createCollection() {
    if (!db || !auth?.currentUser || !title.trim()) return;
    const ref = await addDoc(collection(db, "collections"), {
      slug: slugify(title),
      title: title.trim(),
      description,
      visibility,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
      mediaCount: 0,
      dayCount: 0,
    });
    await updateDoc(doc(db, "collections", ref.id), { id: ref.id });
    setTitle("");
    setDescription("");
    await load();
  }

  async function createPerson() {
    if (!db || !personName.trim()) return;
    const ref = await addDoc(collection(db, "people"), {
      slug: slugify(personName),
      displayName: personName.trim(),
      bio: personBio,
      avatarUrl: personAvatarUrl,
      createdAt: serverTimestamp(),
      mediaCount: 0,
    });
    await updateDoc(doc(db, "people", ref.id), { id: ref.id });
    setPersonName("");
    setPersonBio("");
    setPersonAvatarUrl("");
    await load();
  }

  async function createDay() {
    if (!db || !dayTitle.trim() || !dayCollectionId) return;
    const parent = collections.find((item) => item.id === dayCollectionId);
    if (!parent) return;
    const ref = await addDoc(collection(db, "days"), {
      collectionId: parent.id,
      collectionSlug: parent.slug,
      slug: slugify(dayTitle),
      title: dayTitle.trim(),
      date: dayDate,
      description: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      mediaCount: 0,
      sortOrder: days.filter((item) => item.collectionId === parent.id).length + 1,
    });
    await updateDoc(doc(db, "days", ref.id), { id: ref.id });
    await updateDoc(doc(db, "collections", parent.id), {
      dayCount: days.filter((item) => item.collectionId === parent.id).length + 1,
      updatedAt: serverTimestamp(),
    });
    setDayTitle("");
    setDayDate("");
    await load();
  }

  async function moveDay(day: Day, direction: -1 | 1) {
    if (!db) return;
    const siblings = days
      .filter((item) => item.collectionId === day.collectionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = siblings.findIndex((item) => item.id === day.id);
    const swap = siblings[index + direction];
    if (!swap) return;
    await Promise.all([
      updateDoc(doc(db, "days", day.id), { sortOrder: swap.sortOrder, updatedAt: serverTimestamp() }),
      updateDoc(doc(db, "days", swap.id), { sortOrder: day.sortOrder, updatedAt: serverTimestamp() }),
    ]);
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">Create collection</h2>
        <div className="mt-5 space-y-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summer 2026"
            autoFocus={initialFocus === "collections"}
            className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short album description"
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as Visibility)}
            className="w-full rounded-full border border-stone-300 bg-white px-4 py-3 outline-none focus:border-stone-950"
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
          <button onClick={createCollection} className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
            <Plus size={16} />
            Create collection
          </button>
        </div>

        <div className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="text-xl font-semibold text-stone-950">Create person</h2>
          <div className="mt-4 space-y-3">
            <input
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Max"
              autoFocus={initialFocus === "people"}
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <input
              value={personAvatarUrl}
              onChange={(event) => setPersonAvatarUrl(event.target.value)}
              placeholder="Avatar URL"
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <textarea
              value={personBio}
              onChange={(event) => setPersonBio(event.target.value)}
              placeholder="Bio"
              rows={3}
              className="w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <button onClick={createPerson} className="inline-flex items-center gap-2 rounded-full bg-[#284235] px-5 py-3 text-sm font-semibold text-white">
              <Save size={16} />
              Save person
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="text-xl font-semibold text-stone-950">Create day</h2>
          <div className="mt-4 space-y-3">
            <select
              value={dayCollectionId}
              onChange={(event) => setDayCollectionId(event.target.value)}
              className="w-full rounded-full border border-stone-300 bg-white px-4 py-3 outline-none focus:border-stone-950"
            >
              <option value="">Select collection</option>
              {collections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <input
              value={dayTitle}
              onChange={(event) => setDayTitle(event.target.value)}
              placeholder="Paris Day 1"
              autoFocus={initialFocus === "days"}
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <input
              type="date"
              value={dayDate}
              onChange={(event) => setDayDate(event.target.value)}
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <button onClick={createDay} className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
              <CalendarDays size={16} />
              Create day
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {collections.map((item) => (
          <article key={item.id} className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{item.title}</h2>
                <p className="mt-1 text-sm text-stone-500">/c/{item.slug}</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                {item.visibility}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
              <span>{item.mediaCount} media</span>
              <span>{days.filter((day) => day.collectionId === item.id).length} days</span>
            </div>
          </article>
        ))}

        <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">People</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {people.map((person) => (
              <a key={person.id} href={`/u/${person.slug}`} className="rounded-full bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
                {person.displayName}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">Days</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[...days].sort((a, b) => a.sortOrder - b.sortOrder).map((day) => (
              <div
                key={day.id}
                className="rounded-[8px] border border-stone-200 bg-[#fbfaf7] p-3 text-sm transition hover:border-stone-950"
              >
                <a href={`/c/${day.collectionSlug}/day/${day.slug}`}>
                  <span className="block font-semibold text-stone-950">{day.title}</span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {day.collectionSlug} {day.date ? `- ${day.date}` : ""}
                  </span>
                </a>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => moveDay(day, -1)}
                    className="flex size-8 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveDay(day, 1)}
                    className="flex size-8 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

### components/admin-media-console.tsx

`$lang
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
    const token = await auth.currentUser.getIdToken();
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setBusy("");
    setSelected([]);
    await load();
  }

  async function retry(mediaId: string) {
    await authedPost("/api/media/retry", { mediaId });
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
```

### components/admin-sidebar.tsx

`$lang
import Link from "next/link";
import { CalendarDays, FolderKanban, Images, LayoutDashboard, Upload, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/admin/collections", label: "Collections", icon: FolderKanban },
  { href: "/admin/days", label: "Days", icon: CalendarDays },
  { href: "/admin/people", label: "People", icon: Users },
  { href: "/admin/media", label: "Media", icon: Images },
];

export function AdminSidebar() {
  return (
    <aside className="rounded-[28px] border border-stone-200 bg-white p-3 shadow-sm lg:sticky lg:top-20">
      <nav className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
```

### components/collection-card.tsx

`$lang
import Link from "next/link";
import { CalendarDays, Camera, Image as ImageIcon, MapPin } from "lucide-react";
import { VisibilityPill } from "@/components/gallery-ui";
import type { Collection, Day } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

export function CollectionCard({ collection, priority }: { collection: Collection; priority?: boolean }) {
  return (
    <Link href={`/c/${collection.slug}`} className="group block animate-fade-up">
      <article className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_16px_50px_rgba(28,25,23,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(28,25,23,0.14)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          {collection.coverImageUrl ? (
            <img
              src={collection.coverImageUrl}
              alt=""
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <ImageIcon />
            </div>
          )}
          <div className="absolute left-4 top-4">
            <VisibilityPill visibility={collection.visibility} />
          </div>
          <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
            {collection.mediaCount} frames
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-stone-950">{collection.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{collection.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} />
              {collection.dayCount} days
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Camera size={13} />
              Digi roll
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function DayCard({ day }: { day: Day }) {
  return (
    <Link href={`/c/${day.collectionSlug}/day/${day.slug}`} className="group block">
      <article className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[5/3] overflow-hidden bg-stone-100">
          {day.coverImageUrl ? (
            <img
              src={day.coverImageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <CalendarDays />
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-950 shadow-sm">
            Day {day.sortOrder}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d2f3f]">
            <MapPin size={13} />
            {prettyDate(day.date) || "Undated"}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-stone-950">{day.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{day.description}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{day.mediaCount} files</p>
        </div>
      </article>
    </Link>
  );
}
```

### components/gallery-actions.tsx

`$lang
"use client";

import { Copy, Download, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

export function GalleryActions({
  allowDownload,
  downloadUrl,
  compact,
}: {
  allowDownload: boolean;
  downloadUrl?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => (typeof window === "undefined" ? "" : window.location.href), []);

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ url: shareUrl, title: document.title });
      return;
    }
    await copyLink();
  }

  return (
    <div className={compact ? "grid grid-cols-3 gap-2" : "mt-8 grid grid-cols-3 gap-2"}>
      <button
        onClick={nativeShare}
        className={
          compact
            ? "flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            : "flex h-11 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        }
        title="Share"
      >
        <Share2 size={16} />
      </button>
      <button
        onClick={copyLink}
        className={
          compact
            ? "flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            : "flex h-11 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        }
        title={copied ? "Copied" : "Copy link"}
      >
        <Copy size={16} />
      </button>
      {allowDownload && downloadUrl ? (
        <a
          href={downloadUrl}
          download
          className={
            compact
              ? "flex h-11 items-center justify-center rounded-full bg-white text-stone-950 transition hover:bg-white/85"
              : "flex h-11 items-center justify-center rounded-full bg-stone-950 text-white transition hover:bg-[#284235]"
          }
          title="Download"
        >
          <Download size={16} />
        </a>
      ) : (
        <span className={compact ? "flex h-11 items-center justify-center rounded-full bg-white/10 text-white/40" : "flex h-11 items-center justify-center rounded-full bg-stone-200 text-stone-400"}>
          <Download size={16} />
        </span>
      )}
    </div>
  );
}
```

### components/gallery-shell.tsx

`$lang
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
    : media[0]?.videoMp4Url ?? media[0]?.displayUrl ?? media[0]?.originalUrl;

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
```

### components/gallery-ui.tsx

`$lang
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
  const src = media.videoMp4Url ?? media.displayUrl ?? media.originalUrl;
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
  const image = media.thumbnailUrl ?? media.displayUrl ?? media.originalUrl;
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
```

### components/media-grid.tsx

`$lang
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
  const source = media.type === "video" ? media.videoMp4Url ?? media.displayUrl : media.displayUrl ?? media.originalUrl;
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
```

### components/person-profile-gallery.tsx

`$lang
"use client";

import { useMemo, useState } from "react";
import { Camera, Folder, UserRound } from "lucide-react";
import { ShareDialog } from "@/components/gallery-ui";
import { MediaGrid } from "@/components/media-grid";
import type { Collection, Day, Media, Person } from "@/lib/types";

export function PersonProfileGallery({
  person,
  media,
  collections,
  days,
}: {
  person: Person;
  media: Media[];
  collections: Collection[];
  days: Day[];
}) {
  const [collectionSlug, setCollectionSlug] = useState("all");
  const [daySlug, setDaySlug] = useState("all");

  const availableDays = useMemo(() => {
    return days.filter((day) => collectionSlug === "all" || day.collectionSlug === collectionSlug);
  }, [collectionSlug, days]);

  const filtered = useMemo(() => {
    return media.filter((item) => {
      if (collectionSlug !== "all" && item.collectionSlug !== collectionSlug) return false;
      if (daySlug !== "all" && item.daySlug !== daySlug) return false;
      return true;
    });
  }, [collectionSlug, daySlug, media]);

  return (
    <main>
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-[#fbfaf7] p-4 shadow-sm">
            <div className="aspect-square overflow-hidden rounded-[28px] bg-stone-200">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-stone-500">
                  <UserRound size={52} />
                </div>
              )}
            </div>
            <div className="pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Person</p>
              <h1 className="mt-2 text-4xl font-semibold text-stone-950">{person.displayName}</h1>
              <p className="mt-3 text-sm leading-6 text-stone-600">{person.bio}</p>
            </div>
          </div>

          <div className="self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Appears in</p>
            <h2 className="mt-3 max-w-3xl text-5xl font-semibold tracking-normal text-stone-950">
              {media.length} frames across {collections.length} collections.
            </h2>
            <div className="mt-6">
              <ShareDialog title={`Share ${person.displayName}`} triggerLabel="Share person" />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <ProfileStat icon={<Camera size={17} />} label="Media" value={media.length} />
              <ProfileStat icon={<Folder size={17} />} label="Collections" value={collections.length} />
              <ProfileStat icon={<UserRound size={17} />} label="Days" value={days.length} />
            </div>
          </div>
        </div>
      </section>

      {collections.length ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap gap-3">
            {collections.map((collection) => (
              <a
                key={collection.id}
                href={`/c/${collection.slug}`}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
              >
                {collection.title}
              </a>
            ))}
          </div>

          <div className="mb-6 grid gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2">
            <label className="text-sm font-semibold text-stone-700">
              Collection
              <select
                value={collectionSlug}
                onChange={(event) => {
                  setCollectionSlug(event.target.value);
                  setDaySlug("all");
                }}
                className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 outline-none focus:border-stone-950"
              >
                <option value="all">All collections</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.slug}>
                    {collection.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-stone-700">
              Day
              <select
                value={daySlug}
                onChange={(event) => setDaySlug(event.target.value)}
                className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 outline-none focus:border-stone-950"
              >
                <option value="all">All days</option>
                {availableDays.map((day) => (
                  <option key={day.id} value={day.slug}>
                    {day.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <MediaGrid media={filtered} allowDownload={false} />
        </section>
      ) : null}
    </main>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-[#284235]">{icon}</div>
      <p className="mt-3 text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}
```

### components/upload-console.tsx

`$lang
"use client";

import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { Check, FileVideo, Image as ImageIcon, Loader2, Plus, UploadCloud, XCircle } from "lucide-react";
import { ProcessingBadge, StatusBadge } from "@/components/gallery-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { auth, db, storage } from "@/lib/firebase/client";
import { imageDimensions, resizeImage } from "@/lib/media-client";
import type { Collection, Day, Person } from "@/lib/types";
import { fileExt, isImageFile, isVideoFile, slugify } from "@/lib/utils";

type UploadStatus = "queued" | "uploading" | "processing" | "ready" | "failed";

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  message?: string;
};

export function UploadConsole() {
  return (
    <AdminGuard>
      <UploadWorkspace />
    </AdminGuard>
  );
}

function UploadWorkspace() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [newDay, setNewDay] = useState("");
  const [personInput, setPersonInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);

  const selectedCollectionDoc = useMemo(
    () => collections.find((item) => item.id === selectedCollection),
    [collections, selectedCollection],
  );
  const collectionDays = days.filter((day) => day.collectionId === selectedCollection);
  const selectedDayDoc = days.find((day) => day.id === selectedDay);

  const loadOptions = useCallback(async () => {
    if (!db) return;
    const [collectionSnap, daySnap, peopleSnap] = await Promise.all([
      getDocs(collection(db, "collections")),
      getDocs(collection(db, "days")),
      getDocs(collection(db, "people")),
    ]);
    setCollections(collectionSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Collection));
    setDays(daySnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Day));
    setPeople(peopleSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Person));
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  async function createCollectionInline() {
    if (!db || !auth?.currentUser || !newCollection.trim()) return;
    const slug = slugify(newCollection);
    const refDoc = doc(collection(db, "collections"));
    const data: Collection = {
      id: refDoc.id,
      slug,
      title: newCollection.trim(),
      description: "",
      visibility: "unlisted",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: auth.currentUser.uid,
      mediaCount: 0,
      dayCount: 0,
    };
    await setDoc(refDoc, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    setNewCollection("");
    setSelectedCollection(refDoc.id);
    await loadOptions();
  }

  async function createDayInline() {
    if (!db || !auth?.currentUser || !selectedCollectionDoc || !newDay.trim()) return;
    const refDoc = doc(collection(db, "days"));
    const data: Day = {
      id: refDoc.id,
      collectionId: selectedCollectionDoc.id,
      collectionSlug: selectedCollectionDoc.slug,
      slug: slugify(newDay),
      title: newDay.trim(),
      description: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mediaCount: 0,
      sortOrder: collectionDays.length + 1,
    };
    await setDoc(refDoc, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await updateDoc(doc(db, "collections", selectedCollectionDoc.id), {
      dayCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    setNewDay("");
    setSelectedDay(refDoc.id);
    await loadOptions();
  }

  function addFiles(fileList: FileList | File[]) {
    const accepted = Array.from(fileList).filter((file) => isImageFile(file) || isVideoFile(file));
    setItems((current) => [
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "queued" as const,
      })),
      ...current,
    ]);
  }

  async function ensurePeople() {
    if (!db || !auth?.currentUser) return { peopleIds: [], peopleSlugs: [] };
    const names = personInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const peopleIds: string[] = [];
    const peopleSlugs: string[] = [];

    for (const name of names) {
      const slug = slugify(name);
      const existing = people.find((item) => item.slug === slug);
      if (existing) {
        peopleIds.push(existing.id);
        peopleSlugs.push(existing.slug);
        continue;
      }

      const snap = await getDocs(query(collection(db, "people"), where("slug", "==", slug)));
      if (!snap.empty) {
        peopleIds.push(snap.docs[0].id);
        peopleSlugs.push(slug);
        continue;
      }

      const personRef = doc(collection(db, "people"));
      await setDoc(personRef, {
        id: personRef.id,
        slug,
        displayName: name,
        createdAt: serverTimestamp(),
        mediaCount: 0,
      });
      peopleIds.push(personRef.id);
      peopleSlugs.push(slug);
    }

    return { peopleIds, peopleSlugs };
  }

  async function uploadOne(item: UploadItem) {
    if (!db || !storage || !auth?.currentUser || !selectedCollectionDoc) return;
    const liveDb = db;
    const liveStorage = storage;

    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, status: "uploading", message: "Uploading original" } : candidate,
      ),
    );

    try {
      const { peopleIds, peopleSlugs } = await ensurePeople();
      const tags = tagInput
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      const type = isVideoFile(item.file) ? "video" : "image";
      const mediaRef = doc(collection(liveDb, "media"));
      const basePath = `media/${selectedCollectionDoc.slug}/${mediaRef.id}`;
      const originalStoragePath = `${basePath}/original.${fileExt(item.file.name)}`;
      const uploadTask = uploadBytesResumable(ref(liveStorage, originalStoragePath), item.file, {
        contentType: item.file.type || undefined,
      });

      const originalUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setItems((current) =>
              current.map((candidate) => (candidate.id === item.id ? { ...candidate, progress } : candidate)),
            );
          },
          reject,
          async () => resolve(await getDownloadURL(uploadTask.snapshot.ref)),
        );
      });

      let displayUrl = "";
      let displayStoragePath = "";
      let thumbnailUrl = "";
      let thumbnailStoragePath = "";
      const dimensions = type === "image" ? await imageDimensions(item.file) : {};

      if (type === "image") {
        const [displayBlob, thumbBlob] = await Promise.all([
          resizeImage(item.file, 1800, 0.84),
          resizeImage(item.file, 640, 0.78),
        ]);
        if (displayBlob) {
          displayStoragePath = `${basePath}/display.jpg`;
          const snap = await uploadBytes(ref(liveStorage, displayStoragePath), displayBlob, {
            contentType: "image/jpeg",
          });
          displayUrl = await getDownloadURL(snap.ref);
        }
        if (thumbBlob) {
          thumbnailStoragePath = `${basePath}/thumbnail.jpg`;
          const snap = await uploadBytes(ref(liveStorage, thumbnailStoragePath), thumbBlob, {
            contentType: "image/jpeg",
          });
          thumbnailUrl = await getDownloadURL(snap.ref);
        }
      }

      await setDoc(mediaRef, {
        id: mediaRef.id,
        collectionId: selectedCollectionDoc.id,
        collectionSlug: selectedCollectionDoc.slug,
        collectionVisibility: selectedCollectionDoc.visibility,
        dayId: selectedDayDoc?.id ?? "",
        daySlug: selectedDayDoc?.slug ?? "",
        peopleIds,
        peopleSlugs,
        tags,
        type,
        originalFileName: item.file.name,
        originalStoragePath,
        originalUrl,
        displayStoragePath,
        displayUrl: displayUrl || originalUrl,
        thumbnailStoragePath,
        thumbnailUrl: thumbnailUrl || displayUrl || originalUrl,
        caption,
        location,
        uploadedAt: serverTimestamp(),
        uploadedBy: auth.currentUser.uid,
        status: type === "video" ? "processing" : "ready",
        width: dimensions.width ?? null,
        height: dimensions.height ?? null,
        fileSizeBytes: item.file.size,
        sortOrder: Date.now(),
      });

      await updateDoc(doc(liveDb, "collections", selectedCollectionDoc.id), {
        mediaCount: increment(1),
        coverImageUrl: selectedCollectionDoc.coverImageUrl || thumbnailUrl || displayUrl || originalUrl,
        updatedAt: serverTimestamp(),
      });

      if (selectedDayDoc) {
        await updateDoc(doc(liveDb, "days", selectedDayDoc.id), {
          mediaCount: increment(1),
          coverImageUrl: selectedDayDoc.coverImageUrl || thumbnailUrl || displayUrl || originalUrl,
          updatedAt: serverTimestamp(),
        });
      }

      await Promise.all(
        peopleIds.map((id) => updateDoc(doc(liveDb, "people", id), { mediaCount: increment(1) }).catch(() => undefined)),
      );

      if (type === "video") {
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id ? { ...candidate, status: "processing", message: "Calling converter" } : candidate,
          ),
        );
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/media/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mediaId: mediaRef.id }),
        });
      }

      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                progress: 100,
                status: type === "video" ? "processing" : "ready",
                message: type === "video" ? "Video queued for MP4 conversion" : "Ready",
              }
            : candidate,
        ),
      );
    } catch (error) {
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: "failed",
                message: error instanceof Error ? error.message : "Upload failed",
              }
            : candidate,
        ),
      );
    }
  }

  async function startUpload() {
    for (const item of items.filter((candidate) => candidate.status === "queued" || candidate.status === "failed")) {
      await uploadOne(item);
    }
    await loadOptions();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <section className="space-y-4 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Organise upload</h2>
          <p className="mt-1 text-sm text-stone-600">Choose the album structure once, then batch upload the roll.</p>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Collection
          <select
            value={selectedCollection}
            onChange={(event) => {
              setSelectedCollection(event.target.value);
              setSelectedDay("");
            }}
            className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-stone-950"
          >
            <option value="">Select collection</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <InlineCreate
          placeholder="New collection title"
          value={newCollection}
          onChange={setNewCollection}
          onCreate={createCollectionInline}
        />

        <label className="block text-sm font-semibold text-stone-700">
          Day
          <select
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
            disabled={!selectedCollection}
            className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-stone-950 disabled:bg-stone-100"
          >
            <option value="">No day</option>
            {collectionDays.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <InlineCreate placeholder="New day title" value={newDay} onChange={setNewDay} onCreate={createDayInline} />

        <label className="block text-sm font-semibold text-stone-700">
          People
          <input
            value={personInput}
            onChange={(event) => setPersonInput(event.target.value)}
            placeholder="Max, Sasha, group"
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Tags
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="beach, night, paris"
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Caption
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Location
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Paris, Brighton, London"
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
        </label>
      </section>

      <section className="space-y-4">
        <UploadDropzone onFiles={addFiles} />

        <button
          onClick={startUpload}
          disabled={!selectedCollection || items.length === 0}
          className="w-full rounded-full bg-[#284235] px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-950 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Start upload
        </button>

        <UploadQueue items={items} collectionSlug={selectedCollectionDoc?.slug} daySlug={selectedDayDoc?.slug} />
      </section>
    </div>
  );
}

function InlineCreate({
  value,
  onChange,
  onCreate,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-950"
      />
      <button
        onClick={onCreate}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white"
      >
        <Plus size={17} />
      </button>
    </div>
  );
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "ready") return <Check className="text-[#284235]" size={18} />;
  if (status === "failed") return <XCircle className="text-[#8d2f3f]" size={18} />;
  if (status === "uploading" || status === "processing") return <Loader2 className="animate-spin text-stone-500" size={18} />;
  return null;
}

export function UploadDropzone({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
      className="rounded-[32px] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm transition hover:border-stone-950"
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#284235]/10 text-[#284235]">
        <UploadCloud size={28} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-stone-950">Drop digicam files here</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
        Multi-upload JPG, PNG, WEBP, HEIC, MOV, and MP4. Images are compressed client-side where possible.
      </p>
      <label className="mt-6 inline-flex cursor-pointer rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#284235]">
        Choose files
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.mov,.mp4,image/*,video/*"
          className="sr-only"
          onChange={(event) => event.target.files && onFiles(event.target.files)}
        />
      </label>
    </div>
  );
}

export function UploadQueue({
  items,
  collectionSlug,
  daySlug,
}: {
  items: UploadItem[];
  collectionSlug?: string;
  daySlug?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
              {isVideoFile(item.file) ? <FileVideo size={18} /> : <ImageIcon size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-950">{item.file.name}</p>
              <p className="text-xs text-stone-500">{item.message ?? item.status}</p>
            </div>
            {item.status === "processing" ? <ProcessingBadge label="Processing" /> : <StatusBadge status={item.status} />}
            <StatusIcon status={item.status} />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-[#284235] transition-all" style={{ width: `${item.progress}%` }} />
          </div>
          {item.status === "ready" || item.status === "processing" ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
              {collectionSlug ? <a href={`/c/${collectionSlug}`} className="hover:text-stone-950">Open collection</a> : null}
              {collectionSlug && daySlug ? <a href={`/c/${collectionSlug}/day/${daySlug}`} className="hover:text-stone-950">Open day</a> : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
```

### lib/data.ts

`$lang
import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { demoCollections, demoDays, demoMedia, demoPeople, demoShares } from "@/lib/demo-data";
import type { Collection, Day, Media, Person, Share } from "@/lib/types";

function serialise<T extends Record<string, unknown>>(id: string, data: DocumentData): T {
  const output: Record<string, unknown> = { id, ...data };
  for (const [key, value] of Object.entries(output)) {
    if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
      output[key] = value.toMillis();
    }
  }
  return output as T;
}

function ready(media: Media[]) {
  return media.filter((item) => item.status === "ready");
}

function sortMedia(media: Media[]) {
  return [...media].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
}

function sortDays(days: Day[]) {
  return [...days].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCollections(): Promise<Collection[]> {
  const db = getAdminDb();
  if (!db) return demoCollections;

  try {
    const snap = await db.collection("collections").get();
    return snap.docs
      .map((doc) => serialise<Collection>(doc.id, doc.data()))
      .filter((collection) => collection.visibility !== "private")
      .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
  } catch {
    return demoCollections;
  }
}

function shareIsExpired(share: Share) {
  if (!share.expiresAt) return false;
  const expires = typeof share.expiresAt === "number" ? new Date(share.expiresAt) : new Date(share.expiresAt);
  return !Number.isNaN(expires.getTime()) && expires.getTime() < Date.now();
}

export async function getCollectionBySlug(
  slug: string,
  options: { includePrivate?: boolean } = {},
): Promise<Collection | null> {
  const db = getAdminDb();
  if (!db) return demoCollections.find((item) => item.slug === slug) ?? null;

  try {
    const snap = await db.collection("collections").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const collection = serialise<Collection>(doc.id, doc.data());
    return collection.visibility === "private" && !options.includePrivate ? null : collection;
  } catch {
    return demoCollections.find((item) => item.slug === slug) ?? null;
  }
}

export async function getDaysForCollection(collectionSlug: string): Promise<Day[]> {
  const db = getAdminDb();
  if (!db) return sortDays(demoDays.filter((item) => item.collectionSlug === collectionSlug));

  try {
    const snap = await db.collection("days").where("collectionSlug", "==", collectionSlug).get();
    return sortDays(snap.docs.map((doc) => serialise<Day>(doc.id, doc.data())));
  } catch {
    return sortDays(demoDays.filter((item) => item.collectionSlug === collectionSlug));
  }
}

export async function getDayBySlug(collectionSlug: string, daySlug: string): Promise<Day | null> {
  const db = getAdminDb();
  if (!db) {
    return demoDays.find((item) => item.collectionSlug === collectionSlug && item.slug === daySlug) ?? null;
  }

  try {
    const snap = await db
      .collection("days")
      .where("collectionSlug", "==", collectionSlug)
      .where("slug", "==", daySlug)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return serialise<Day>(doc.id, doc.data());
  } catch {
    return demoDays.find((item) => item.collectionSlug === collectionSlug && item.slug === daySlug) ?? null;
  }
}

export async function getMediaForCollection(collectionSlug: string): Promise<Media[]> {
  const db = getAdminDb();
  if (!db) return sortMedia(ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug)));

  try {
    const snap = await db.collection("media").where("collectionSlug", "==", collectionSlug).get();
    return sortMedia(ready(snap.docs.map((doc) => serialise<Media>(doc.id, doc.data()))));
  } catch {
    return sortMedia(ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug)));
  }
}

export async function getMediaForDay(collectionSlug: string, daySlug: string): Promise<Media[]> {
  const db = getAdminDb();
  if (!db) {
    return sortMedia(
      ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug && item.daySlug === daySlug)),
    );
  }

  try {
    const snap = await db
      .collection("media")
      .where("collectionSlug", "==", collectionSlug)
      .where("daySlug", "==", daySlug)
      .get();
    return sortMedia(ready(snap.docs.map((doc) => serialise<Media>(doc.id, doc.data()))));
  } catch {
    return sortMedia(
      ready(demoMedia.filter((item) => item.collectionSlug === collectionSlug && item.daySlug === daySlug)),
    );
  }
}

export async function getPersonBySlug(slug: string): Promise<Person | null> {
  const db = getAdminDb();
  if (!db) return demoPeople.find((item) => item.slug === slug) ?? null;

  try {
    const snap = await db.collection("people").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return serialise<Person>(doc.id, doc.data());
  } catch {
    return demoPeople.find((item) => item.slug === slug) ?? null;
  }
}

export async function getPeopleBySlugs(slugs: string[]): Promise<Person[]> {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return [];
  const db = getAdminDb();
  if (!db) return demoPeople.filter((item) => unique.includes(item.slug));

  try {
    const people = await Promise.all(unique.map((slug) => getPersonBySlug(slug)));
    return people.filter(Boolean) as Person[];
  } catch {
    return demoPeople.filter((item) => unique.includes(item.slug));
  }
}

export async function getMediaForPerson(personSlug: string): Promise<Media[]> {
  const db = getAdminDb();
  if (!db) return sortMedia(ready(demoMedia.filter((item) => item.peopleSlugs?.includes(personSlug))));

  try {
    const snap = await db.collection("media").where("peopleSlugs", "array-contains", personSlug).get();
    return sortMedia(ready(snap.docs.map((doc) => serialise<Media>(doc.id, doc.data()))));
  } catch {
    return sortMedia(ready(demoMedia.filter((item) => item.peopleSlugs?.includes(personSlug))));
  }
}

export async function getMediaById(mediaId: string): Promise<Media | null> {
  const db = getAdminDb();
  if (!db) return demoMedia.find((item) => item.id === mediaId && item.status === "ready") ?? null;

  try {
    const doc = await db.collection("media").doc(mediaId).get();
    if (!doc.exists) return null;
    const media = serialise<Media>(doc.id, doc.data() ?? {});
    return media.status === "ready" ? media : null;
  } catch {
    return demoMedia.find((item) => item.id === mediaId && item.status === "ready") ?? null;
  }
}

export async function getCollectionsForMedia(media: Media[]): Promise<Collection[]> {
  const slugs = [...new Set(media.map((item) => item.collectionSlug).filter(Boolean))] as string[];
  const collections = await Promise.all(slugs.map((slug) => getCollectionBySlug(slug)));
  return collections.filter(Boolean) as Collection[];
}

export async function getDaysForMedia(media: Media[]): Promise<Day[]> {
  const pairs = [...new Set(media.map((item) => `${item.collectionSlug ?? ""}/${item.daySlug ?? ""}`))].filter((pair) =>
    pair.endsWith("/") ? false : true,
  );
  const days = await Promise.all(
    pairs.map((pair) => {
      const [collectionSlug, daySlug] = pair.split("/");
      return getDayBySlug(collectionSlug, daySlug);
    }),
  );
  return days.filter(Boolean) as Day[];
}

export async function getShareById(shareId: string): Promise<Share | null> {
  const db = getAdminDb();
  if (!db) return demoShares.find((item) => item.shareId === shareId) ?? null;

  try {
    const snap = await db.collection("shares").where("shareId", "==", shareId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return serialise<Share>(doc.id, doc.data());
  } catch {
    return demoShares.find((item) => item.shareId === shareId) ?? null;
  }
}

export async function getShareBundle(shareId: string) {
  const share = await getShareById(shareId);
  if (!share || shareIsExpired(share)) return null;

  if (share.targetType === "collection" && share.targetSlug) {
    const collection = await getCollectionBySlug(share.targetSlug, { includePrivate: true });
    if (!collection) return null;
    const [days, media] = await Promise.all([
      getDaysForCollection(collection.slug),
      getMediaForCollection(collection.slug),
    ]);
    return { share, collection, days, media };
  }

  if (share.targetType === "person" && share.targetSlug) {
    const person = await getPersonBySlug(share.targetSlug);
    if (!person) return null;
    const media = await getMediaForPerson(person.slug);
    return { share, person, days: [], media };
  }

  if (share.targetType === "day" && share.targetSlug) {
    const [collectionSlug, daySlug] = share.targetSlug.split("/");
    const [collection, day, media] = await Promise.all([
      getCollectionBySlug(collectionSlug, { includePrivate: true }),
      getDayBySlug(collectionSlug, daySlug),
      getMediaForDay(collectionSlug, daySlug),
    ]);
    if (!collection || !day) return null;
    return { share, collection, day, days: [], media };
  }

  if (share.targetType === "media") {
    const mediaItem = await getMediaById(share.targetId);
    if (!mediaItem) return null;
    return { share, days: [], media: [mediaItem] };
  }

  return null;
}

export async function incrementShareView(shareId: string) {
  const db = getAdminDb();
  if (!db) return;
  try {
    const snap = await db.collection("shares").where("shareId", "==", shareId).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({ viewCount: FieldValue.increment(1) });
    }
  } catch {
    return;
  }
}
```
