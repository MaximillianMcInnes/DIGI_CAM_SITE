# DigiShare Full Project Export

Generated from source files in this workspace. package-lock.json, .next, node_modules, and binary assets are intentionally omitted.

## File Tree

```text
.env.example
app/admin/collections/page.tsx
app/admin/media/page.tsx
app/admin/page.tsx
app/api/admin/media/bulk/route.ts
app/api/media/convert/route.ts
app/api/media/retry/route.ts
app/api/shares/route.ts
app/api/shares/verify/route.ts
app/c/[collectionSlug]/day/[daySlug]/page.tsx
app/c/[collectionSlug]/page.tsx
app/favicon.ico
app/globals.css
app/layout.tsx
app/login/page.tsx
app/page.tsx
app/share/[shareId]/page.tsx
app/u/[personSlug]/page.tsx
app/upload/page.tsx
components/admin-collections-console.tsx
components/admin-dashboard-stats.tsx
components/admin-guard.tsx
components/admin-media-console.tsx
components/collection-card.tsx
components/gallery-actions.tsx
components/gallery-shell.tsx
components/media-grid.tsx
components/person-profile-gallery.tsx
components/share-link-console.tsx
components/share-password-gate.tsx
components/site-header.tsx
components/upload-console.tsx
eslint.config.mjs
firebase.json
firestore.indexes.json
firestore.rules
lib/data.ts
lib/demo-data.ts
lib/firebase/admin.ts
lib/firebase/client.ts
lib/media-client.ts
lib/security.ts
lib/types.ts
lib/utils.ts
next.config.ts
package.json
postcss.config.mjs
README.md
storage.rules
tsconfig.json
worker/Dockerfile
worker/index.js
worker/package.json
worker/README.md
```

## Files

### .env.example

`$lang
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aiscend-14a48
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aiscend-14a48.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

ADMIN_EMAILS=you@example.com
FIREBASE_SERVICE_ACCOUNT_JSON=
CLOUD_RUN_CONVERTER_URL=
CONVERTER_SHARED_SECRET=
```

### app/admin/collections/page.tsx

`$lang
import { AdminCollectionsConsole } from "@/components/admin-collections-console";

export default function AdminCollectionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
        <h1 className="mt-2 text-4xl font-semibold text-stone-950">Collections and people</h1>
      </div>
      <AdminCollectionsConsole />
    </main>
  );
}
```

### app/admin/media/page.tsx

`$lang
import { AdminMediaConsole } from "@/components/admin-media-console";

export default function AdminMediaPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
        <h1 className="mt-2 text-4xl font-semibold text-stone-950">Media processing</h1>
      </div>
      <AdminMediaConsole />
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
import { ShareLinkConsole } from "@/components/share-link-console";

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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
    <Link href={href} className="rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-lg">
      <div className="text-[#284235]">{icon}</div>
      <h2 className="mt-5 text-lg font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
    </Link>
  );
}
```

### app/api/admin/media/bulk/route.ts

`$lang
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage, isAdminEmail, verifyBearerToken } from "@/lib/firebase/admin";

type BulkAction = "assign" | "hide" | "unhide" | "delete" | "set-cover" | "reorder";

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

### app/api/media/convert/route.ts

`$lang
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, isAdminEmail, verifyBearerToken } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  const decoded = await verifyBearerToken(request.headers.get("authorization"));
  if (!decoded || !isAdminEmail(decoded.email)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { mediaId } = (await request.json()) as { mediaId?: string };
  if (!mediaId) return NextResponse.json({ error: "mediaId is required" }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });

  await db.collection("media").doc(mediaId).update({
    status: "processing",
    processingError: FieldValue.delete(),
  });

  const converterUrl = process.env.CLOUD_RUN_CONVERTER_URL;
  if (!converterUrl) {
    return NextResponse.json({ ok: true, queued: false, note: "CLOUD_RUN_CONVERTER_URL is not set yet" });
  }

  const response = await fetch(converterUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.CONVERTER_SHARED_SECRET ? { "x-worker-secret": process.env.CONVERTER_SHARED_SECRET } : {}),
    },
    body: JSON.stringify({ mediaId }),
  });

  if (!response.ok) {
    const message = await response.text();
    await db.collection("media").doc(mediaId).update({
      status: "failed",
      processingError: message || `Converter returned ${response.status}`,
    });
    return NextResponse.json({ error: "Converter failed to queue", detail: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, queued: true });
}
```

### app/api/media/retry/route.ts

`$lang
export { POST } from "@/app/api/media/convert/route";
```

### app/api/shares/route.ts

`$lang
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, isAdminEmail, verifyBearerToken } from "@/lib/firebase/admin";
import { hashSharePassword } from "@/lib/security";

export async function POST(request: NextRequest) {
  const decoded = await verifyBearerToken(request.headers.get("authorization"));
  if (!decoded || !isAdminEmail(decoded.email)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

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
    createdBy: decoded.uid,
    viewCount: 0,
  });

  return NextResponse.json({ shareId, url: `/share/${shareId}` });
}
```

### app/api/shares/verify/route.ts

`$lang
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
```

### app/c/[collectionSlug]/day/[daySlug]/page.tsx

`$lang
import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { getCollectionBySlug, getDayBySlug, getMediaForDay } from "@/lib/data";

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

  return <GalleryShell collection={collection} day={day} media={media} />;
}
```

### app/c/[collectionSlug]/page.tsx

`$lang
import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { getCollectionBySlug, getDaysForCollection, getMediaForCollection } from "@/lib/data";

export default async function CollectionPage({ params }: { params: Promise<{ collectionSlug: string }> }) {
  const { collectionSlug } = await params;
  const collection = await getCollectionBySlug(collectionSlug);
  if (!collection) notFound();

  const [days, media] = await Promise.all([
    getDaysForCollection(collection.slug),
    getMediaForCollection(collection.slug),
  ]);

  return <GalleryShell collection={collection} days={days} media={media} />;
}
```

### app/favicon.ico

`$lang
         (  F          (  n  00     (-  –           ¾F  (                                                           $   ]   º   º   ]   $                                           ò   ÿ   ÿ   ÿ   ÿ   ò                               8   à   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   à   8                  â   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   â              ¡   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ¡       #   ô   ÿ   ÿOOOÿ®®®ÿ«««ÿ«««ÿ«««ÿ«««ÿ­­­ÿgggÿ   ÿ   ÿ   ô   #   Y   ÿ   ÿ   ÿÿíííÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿýýýÿ555ÿ   ÿ   ÿ   ÿ   Y   »   ÿ   ÿ   ÿ   ÿkkkÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿŽŽŽÿ   ÿ   ÿ   ÿ   ÿ   »   »   ÿ   ÿ   ÿ   ÿ			ÿÍÍÍÿÿÿÿÿÿÿÿÿäääÿÿ   ÿ   ÿ   ÿ   ÿ   »   Y   ÿ   ÿ   ÿ   ÿ   ÿJJJÿýýýÿÿÿÿÿkkkÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Y   #   ô   ÿ   ÿ   ÿ   ÿÿ¶¶¶ÿÕÕÕÿ			ÿ   ÿ   ÿ   ÿ   ÿ   ô   #       ¡   ÿ   ÿ   ÿ   ÿ   ÿ111ÿDDDÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ¡              â   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   â                  8   à   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   à   8                               ò   ÿ   ÿ   ÿ   ÿ   ò                                           $   ]   º   º   ]   $                                                                                                                                                                                                                                                                                    (       @                                                                               ,   U      è   è      U   ,                                                                                      *   …   Ò   ù   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ù   Ò   …   *                                                                      –   ó   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ó   –                                                          Q   á   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   á   Q                                               r   û   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   û   r                                       r   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   r                               O   û   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   û   O                          ä   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ã                      —   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   —               (   õ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ô   '           †   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ888ÿ‹‹‹ÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿˆˆˆÿ‰‰‰ÿ___ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   †          Ô   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿîîîÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿSSSÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Ô      +   ú   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿhhhÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ®®®ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ú   +   T   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿËËËÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿôôôÿ,,,ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   T   ‚   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿGGGÿýýýÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ      é   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ­­­ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿäääÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   é   é   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ+++ÿóóóÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿjjjÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   é      ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ‹‹‹ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÌÌÌÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ‚   T   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿãããÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿýýýÿIIIÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   T   +   ú   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿhhhÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ¯¯¯ÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ú   +      Ô   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿËËËÿÿÿÿÿÿÿÿÿôôôÿ,,,ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Ô          †   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿGGGÿýýýÿÿÿÿÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   †           '   ô   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ±±±ÿìììÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   õ   (               —   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ333ÿ___ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   —                      ã   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ä                          O   û   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   û   O                               r   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   r                                       r   û   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   û   r                                               Q   á   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   á   Q                                                          –   ó   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ó   –                                                                      *   …   Ò   ù   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ù   Ò   …   *                                                                                      ,   U      è   è      U   ,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (   0   `           -                                                                                             	   (   L   j   ³   ø   ÷   ³   j   K   (   	                                                                                                                                          V       Ø   ø   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ø   Ø       U                                                                                                                      %   ‹   á   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   á   ‹   &                                                                                                      ‹   ï   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ï   ‹                                                                                          Q   Ü   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Ü   R                                                                              Š   þ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   þ   Š                                                                     ­   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ­                                                             ¸   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ¸                                                     ®   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ®                                              Š   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Š                                       P   ý   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ý   O                                  ß   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ß                              ‹   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ‹                       #   ñ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ñ   #                   Œ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ‹                  ä   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ$$$ÿhhhÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿeeeÿPPPÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ä              U   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿëëëÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿsssÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   U           ¡   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿeeeÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÌÌÌÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ¡       	   Ú   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿÉÉÉÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿýýýÿHHHÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Ú   	   (   ù   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿEEEÿüüüÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ®®®ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ø   (   K   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿªªªÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿôôôÿ,,,ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   L   j   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ)))ÿòòòÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿŒŒŒÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   j   ´   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿˆˆˆÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿãããÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ³   ø   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿáááÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿiiiÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ø   ø   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿeeeÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿËËËÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ø   ³   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿÉÉÉÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿýýýÿHHHÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ´   j   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿEEEÿüüüÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ®®®ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   j   L   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿªªªÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿôôôÿ,,,ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   K   (   ø   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ)))ÿòòòÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿŒŒŒÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ù   (   	   Ú   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿˆˆˆÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿãããÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Ú   	       ¡   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿáááÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿiiiÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ¡           U   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿeeeÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÌÌÌÿÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   U              ä   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿÿÉÉÉÿÿÿÿÿÿÿÿÿýýýÿHHHÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ä                  ‹   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿEEEÿüüüÿÿÿÿÿ®®®ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Œ                   #   ñ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ¬¬¬ÿûûûÿ,,,ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ñ   #                       ‹   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ222ÿ}}}ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ‹                              ß   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ß                                  O   ý   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ý   P                                       Š   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Š                                              ®   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ®                                                     ¸   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ¸                                                             ­   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ­                                                                     Š   þ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   þ   Š                                                                              R   Ü   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   Ü   Q                                                                                          ‹   ï   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ï   ‹                                                                                                      &   ‹   á   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   á   ‹   %                                                                                                                      U       Ø   ø   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ÿ   ø   Ø       V                                                                                                                                          	   (   K   j   ³   ÷   ø   ³   j   L   (   	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ‰PNG

   IHDR         \r¨f   sRGB ®Îé   8eXIfMM *    ‡i                                D"8s  IDATxí]	°Õ™n”]<QVA–èÄh$	ÊNŒŽ13*ˆq°ÂdªÄ©I¡ˆ˜D“L2“ª(Î(Ô˜2ÖÄ™ÑG	‹Áq_@å±ˆà†ŠxÈ›ï»Ð¾{o÷½½ÓýýUß{}»OŸå;çÿûôùÏ9ÝÂ‘d®(Dg Ð8	èôN º]€î@ hx¥?v ÀNà3à=`;ð6ð.ð&°àuâà  ±”6‰P©Ð½€Á@ÿÃ RÓ PùiZqÊ^DNãà€wp¼Ø¼ÐXÐhÐ˜Hg@ÀÌ
:Ùâ|ð5` p"@À'¼É²™s{ëpü*ð2ÀÞ…Ä d Ò¯Œ–È|(0ø
0 à“>Kò
³xX¬6 IJÈ ¤C|?$KENØ}Ï“|ŠÂòµáàöh $	2 Ù|/§Â . Nz ’#¼ÃW€eÀ
à5€ã’ˆÜ¶ˆúà;Ày •¾ ñgàs©h^  IÄÈ DL(¢;¸8 ÒHjg€cH|x 1 ËR"Œa€ïôÓ• GÁÙ@…è9`/`%0èHÄ@jð½~,° ÛK
Ÿ,t).ÎèI‘ˆDèT¦Oû)~º°Vìu$b èª›ÐU%¥7“ƒ¨›ù _É$b 8Aç×À€ßøJö3` 510wQñ?¤øvrðÑá:ü2þKÄ@ ¤øv*{%#í‚AZ€å’^(õÏ=ñ³g \ãÀWƒÛ€É!:àß,`à6ýÏ643:@’c.FÙŸ¤ðùä€u?Ð<'áÝ€ƒ€”_Üvp: É8Q¾›
IñÅ·p{3ÎóÐkHÈ¢ŒG¡ž¼•®cñÑ¼<62&‹
×2uCÁÿàÚòæ•­ßâ¤Tø3Ú
½ê€›…;î¼”ªd/~m€½.ø’XÆ@{äw.°ð«d]G•Ú {lKÜàEbœÿý(P©RuMüTÛC›ÒÚÃÀdäï])¿Œ_Lmà=Äû=@bœÍ÷K€ÛGUkÙ^œUÓØÆØÖøš)1€È»gÕT¢ÂŠ¯°m`9Ú\Ú®³ÀQþÍ@ØÊÔýâ°–6ð:ÚžÕ^›w¬òï¸E—D¤Á ç	ü5°àºëÄFÐ,ßÜ
ðX"Òd€mð<€nB~òì@´¸÷µt×tx‹»ü;ÚfÞ>ñ“ªíI8µˆ»¿8Ó¸C1Ûª$B¸•§e†©Ý+þ’jl«ÜEZÃÇ& ©ÊS:â:Š6°möë´ÿ\G1¥ç`¢¨Å!“nl»lÃÆŠÉ^€Q`í·@OcÙSÆÄ@e¸Í·º¹ç¤qbªp•ÿãS†Ä@upšº±FÀD@å¿Ð“¿º†¦Ðæ2@#À¹ÆõL3 £A’”$H2Ç _hž¶FH#rq(íÿOàDƒò¤¬ˆ¨àrunGOWaêbŠ &–SgDñ3ÀEDçto§*Ç¤šú¡Ä9kŠÝ~)¿•¡,$Â x¿RŸ1˜vàK áÀ9€DäU(ðw®&LEÒäê©»€S)¹é3ÐY8x8 $.i€(íŒÄK¬Å€YœŽìðaÈ]­—´À4”ôÇ€	c‰“®Å@3¸fà€ó•4Æ Æ¢„ÿÐ/*bàüþ Çþ˜$!I€~‡Ø7ÉB*-1`	o Ÿ º	‘$»àÇ¡D‹¾‰”L‰ˆûàòß êJ"’äÀOQ¢Ë)•ö2@#Ðx4‰"$e ¨ø·Iö8’àOiˆ8ø"Ý ¼GäÞ8[xÄt<ñ.´´7&‚m&ØŽR^‹³tq÷ Ø•á.¾§ÅYÅ-2È ½d§ ûã*_Üà&d|j\™W¼b ãôGùö«â*gœ¯ £‘é‡ÄF4ã"IñŠØƒ´/ b1q€NÈðãÀY€Dˆp¼ŒÛ9îãpÑ}w\¯ ó‘Ô¤£“Ó1 j`€èOûŸî­xK=€ÑHñ÷ ÷A“ˆ1Ÿ#¾
D:U8jÀõýtù©ë$b bžA||ØU¼Q¿ü26%ªÌ)1 Šè…_Àê¢³!~DÙàºæ• ¿à+b >A´Ü:]ÑE$ˆ£50òGDhRÑtèÐÁéÝ»wRÉ)ðPÇ ‘èn$‘ 3ÜÖë@bS§Nu–,Yâ´jÕÊ²œç:»¡ôÜ;ÀáÀßó@£`Ç|ã–-[)“'OVýÙÕ†©sFxÚ®“âÛ¥øn}Í›7¯ üü³~ýúÆºº:»ŒÀQ—©J_¤ÎUKj8–q0xðàÆ;v4 Ìž=[õhW=¾	Ýë	¤&·!e5Ë8hÑ¢EãÝwß]¤üüñá‡6öïß_õiW}þSZÚ?	¿/`Ÿ;vlã¾}ûŽ2 <±hÑ" »À§ÐAî¹‘¸ÜÕX,ã mÛ¶+V¬(©ü<¹wïÞÆ#F¨^íª×;“ÖþaHðc ûà”)SÊ*¿{aùòåpÊØc89(Ñ^€žþö4Ž&E¦ÛoÃ†®žWü/· uÆ=±^€žþ*?{k^·_EíÇÅúúz¹íªgö† UI-‹è{WU*
œ:pû9.tÚ·o(/Ýºus>ûì3ç‰'ž^Rg€ßäÚžGâÌI_D®‘»žåÜ~~½ ¹­{øúÙ?N0‘7½SêØ.Æ×¸ÿ~?}/y]nA;êØ£‹³ã2 ]ñFOB2C?·_I­÷œ”[Ð:°:Ú=#ÀOzKé-ã ˆÛÏ£ï%å´®Ý?jÐþIÀ®†PÛ¯¤æ{NÊ-hUÝÿt•:™œƒ˜øõ ,â ·ŸG×KÊ-hUÛç¢cƒhP7 ÿÎ¡Â˜Á@µn?¿\Ó-¸k×.¹ýˆ2ã:õú ð`ÙáF„Û=ý-á V·_ÉG¿ç¤Ü‚Vé Ýõ}¢0 WIù­ªøFºýÊ­öóèsM‡rZÕ8pJ¸QÜ*@OK8ëöó³
rZ¥ÔÝ–a, ßûwË ØSéW^y¥Ÿ‡¾.· 5íat7ÔØÝ¤üÖTv#Ý~7n­àA"¸üòËÕ+´£WøèpMÂÅ/ªhK8ˆÒíçgä´F/^„·«ÅŒÀM{e ì¨èR›|ú)qØë7Ýt“æ?8'àµ€KùíP~ºýî¹çž°ú\õýrÚÑ> Ç·Uk ØeP÷ß|ë^xÇéöó³
‹/V/Àüvòô™¯ôå„ä¢*×pâvûù ¹­Ð¾ÊŸ]JûË}óˆk8(•ˆÎÅÇÀÄ‰Ñ£GÇ—€OÌmÚ´q,X oúð”òe.â˜^ ¡QxÐÓßp’tûùõä4^_ƒN—{à†¾øÅyÄ2 †s¤ÛÏÏ Ð-Ø¹sgµsÛÌÐiêv‘”Z8
!~PJ?Œc€«ýîºë®À›|Æ] ®Ü½{·³zõê¸“Rüµ1pnãÔàzïí¥º¼tlpû9³fÍrºvíjTæ®¿þzß4*OÊLã‹~•øÑçžÔ•3˜ƒ4Ý~~¯r­;ÔmêxYŒ+üÀ€€¡¤íöó3 r­;Ômêx“4à÷Å:7]ÕqLš4)U·Ÿ!rú1”êuê6¿ìÕ$ÍÀ7›®èÀ8ºwïîÌ™3Ç¸|5Ï>?î\zé¥ÍOë·œëÍ†× ðø,ïE›ÅÀŒ3œš•©2¹¹å–[œººº2Wu:E¾‚´›¼^p.H1cJºtû]}õÕB˜uéÔSOu®ºŠ»ÉIc€Ož¥òÄ%ƒ  ÆAZ«ýüüü®kµ ‘ºD?Ç5 Þ@Q×À ÿé3Àwê+®¸"ýŒT™ÎSÀžUÞ¥à13Àî?ûâ5 M'Ý‹úŸ>pûþZµj•~fjÈ×ˆ×¡Ô‚n©¦±>× ðÿi5D¤[bf íÕ~a‹'·`Xc¹Ÿã -¼1ók¢›½ÿÄI«ýüÞ÷ý®kµ QºÅ¯|ókßMËé(92È@’t°ÉíçÇÝ‚X-èL×“a€úN4€“qÜž'$f0@·@V„nA›Ü˜Yá½L9:â|/^sÇ ú—	¨Ó)0`êj¿°T\wÝuZ-–ÄèîÂ¨\ 	@Ñ:¦±cítûùœ{È-èÇRb×û1%× ôI,Y%T‘ÛÝ~‡‹rú1”ØõÂCŸ€,¼$–´*Ë€é«ýÊf<à¹0zþŽ¥èhÕFü„û¦ ·Ÿ«ý|â€¯8Z-èCRü—¹Tg× ÐHRf€‹glYí–ª¹sçÊ-–Äp÷Ó'+ŽÃèî¶mµ_Ø’gÍÍ–îçC¿{ ô	òÃ’”ÈªÛÏÎ™3gÊ-èGR|×¹7`G€Þñ¥¡˜ƒ0U·Ÿ_ÙµZÐ¡Ø¯ŸD )À±ó\>¬»ýÊ—üÐ¹ýŠõz N–¤Ä@ÖÝ~~´Ê-èÇP¬×{rs€¿´@¬<—Žœ›|.]ºÔ¸|”Îm|gûõëç¬_¿Þyå•WâKD1—bàM½”¢%¡s\“·Ÿ¥rú1Ëõnì\–Æ’„"-É Ý`.4æÛ~%3™àI}[0A²$µ“= -Ò>BH"G®Û^r„­<ÂEBGÝi Ú%”˜’9Ì@^Ý~~@«ýŠüú1Üì€†@’ tû-[¶ÌèÏ{%@CÙ$ðmAgüøñÎš5kÊ†Ñ…ÈøœŠ/åŒOÿˆlßäÓ¿„áBÐ@.X°À±uäp¥Oüî6œ—x²9MPn¿`ß·o_§¾¾^nÁ`t…
¥§(úª»™ƒ\rûùsÆAÒyóæéÛ‚þT…¡@h
ƒE0lØ0çÎ;ïtÚµÓ˜kÆ¸N ¡¡ÁYµjUà
S#ì|^ã½º- |¢ÝpÃN—.…­ØÞ¥`×^{­zLñ6ƒƒ4 ŸÄ›†bç¨öe—]&"ªd€sÎœ9UÞ¥àU0ð!ÀÁ*nPÐ*`—ÿæ›oÖ¨v•¼¹Ái8GåþÔÿhh ØmœŠÍËÀäÉ“sÏ=×{JÇU0ÀÕ‚óçÏwZ·æþ’ˆø”ƒ€ì›ö8bEzôèá,Y²Dïþ![CŸ>}œ7:k×®“noÆÀfö >jvR?#b€ƒXˆ(¶üFÃAT¾FÕÕióêˆ[Á{ì°zvÄç>º¡C‡Êía+[0B2Dµœ=€íG~ë(
øÄºñÆÕõ‚LO×\sÜ‚>"8|‹`[)
&Lp8ø'‰–öäŒ”Óí4 oGeÎ#£ÛÀlÙ’_\“DÍ€Ü‚‘2ZØl¢Üi´9ŽŒtäÈ‘9f Þ¢Ë-¿œ¼‹=€‡YÌyˆn?uQã¯}XÍ¬ÍsAïi >=ŒÐ1æ=RÉí+à +­Ü‚¡¸.2 šŠKì«·ßôéÓCÆ¢Ûƒ20hÐ ‡Ë«%53À5@…MA¹%˜¦×Ì£ãÈí‚¼·j[õä9Î;¸û _(¯ú§¿µ0ÀÕ~rûÕÂ\¸{ômÁPüÜÿ®x#TT9¾™n?¾Êí—N# á•×¥&î}× ¬¯)
ÝTVL¯!¸ßÔjÁªë`ïp ß8@RrûUAVŒAå¬šÜ=¸ã-Þå€÷pLHª`@n¿*ÈŠ1¨Ü‚U“Ëõ?}w ]ìH2@·ß´iÓ†V°¸ [Ë¯%àôÿ‚ëß5 8±)Ð­
T`€›|rZbZ-¸.Ö!da+@× ðÎçßžó€Zígf[0p½¼æ†ô žä¤ I´Égr¸$· o%PÇ_rCyÀVœ|ß½ ÿ¥à"mòYšÎÊ-è[ lÚÄk xAã ø“Û¯9]¢[pÒ¤IåÈ¨¬pP“ÇÏk ŠºFeÙÌÈígHEødƒnAm"Z–$Žõ5}„›‚zå8üéô2røX›|– ÅàSÜ»w¯³råJƒs™JÖ~T›fþz{ ÌÍ« ÷xÐj?jµàQ•EÝnò ðjsÀùÁ|GxÐ·ý<dXt(·àQ•EÝ.¬p¯47 Üð)÷¢þ;…Ïysµ_«V­D‡…È-XTiÔí¢ý?› †~¼è–œÿÛÏî ·`Qý=Vô?šòú^à
€‚¹ºý–.]ª|XÞ
ômÁB~€¿?ŠÆøJõ ÞD —·äüÜ~Ùh rê‘óÿ©ÛERªÀ…AÝ€óŠBæìÝ~wÜq‡Ó¾}ûœ•<›Å•[Ð¹5ûdóÚ-Õ`˜5 ?KqÝ~l4’ì0@·à)§œ’/I‚®(¼œà‡Ø‹ü…¥nÎê9¹ý²Y³4èœ!˜CÙˆ2×—*w9ÀÀGKÝõsî&Ÿrûe³¦súé¶? 6Ù8JÊ |(òuwOä´d°&K)‡nA¾Ê?RšÒn@7,·º8Á=‘õÿrûe½†•nÁM›69k×òM7óÂéý·J•´R€]†e¥nÊê9¹ý²Z³Ååâ /?áž“o>ŒÒó•¾¤”rzrÒÀ óó`åöóV{ö»uëæ4448«V­Êra÷ p³ îõQRZ”<{ädK.F9•½#~Tâ¾ûîs.¾øâìN%*Ë ÀðáÃuë8G&“²¥ì/W:*x%á{Ã}@¦ »‚lõõõNc#çAIòÀÀ±Ç›õiÞ÷£Ë*?ëØ¯À0}€g€ãùC"Ä€pÛ¯³€Šßû¨4è–’Ò(bÀ8€_QùY” €áîr7'€—ˆ`·ÿî ùj ¸6à… *Œ©3ÀWögƒä"¨àl¢¡Âˆ1:ì±Sg}%È  	¹¥P?÷„þ‹1`›£¯ÉYÐ ãâŽ"‹‚Dª0b@¤Æ Ýö”Ÿ9¬¦Àðý¾[tá‰F1À‡ôp`kÐ\UÓ`œÜRø·A#W81 e`)RÛZMŠÕö ÷€[uæ‰F0ð	rq.ÀÕ¥Ú #^ð=C"Ä€9P'«R~f½– ï
pn€zdC"Òe ¦§?³\K€÷½¨@&$b }jzú3Ûµö x/{èÄ1 Ra€#ÿ|÷çÆŸUK­= &Ä^€æTM¹n‘2À9ÿ5)?s¦Àû{O'ó‡DˆDà’ßo [kMÕoK0¿xÿŒ ÜTd‚_@]b ræ ÆGÃÄ¶À´; «€¯ò‡DˆDàêÜ1ÀgaRÛ`ÚÜ'`0ˆÂ  ‰>\ë/ù„ñ½fÐùƒøñ÷„ŽÅ€ˆß!fn÷Z¢|bŸ†ÜðU .t®åà¤ŸÑÀÚrª9Å+€›ý‘­€±î	ýb rnEŒDk”= æé8àÀÙü!b RžClã€PÞEÙ`¼ÜŒK†'~ß@‰ Ë}*°!`ø@Á¢6 Lô ;À	$b@DÃÀ?#šÈgÞFý
àµV”ˆ1ŽvýÇ;ÃEsôÝQ¹›ÇÌ=É®ö4¿ ßb@TÅÀn„þ!¹ò3q¼0^ÊV€ã c ‰µ1ðÜ¶´¶[ýïŠëÀM¹=8IˆÝ‰Õ1@Ú…@Cu··`N¸oÀã WJÄ€Æ WúÑåÇe÷±Iœ¯ n¦¹Nàmà¯€¸ÆÜ´ô_d(Ä4`EÜ…IÂ °¯œ"ÌµË1 *3ð+\þEå Ñ\MâÀÍ)g	rÁ¦
»Œè¿8š>õ¿pô?vIÒ °0€Ç€~ü!b ˆ­øÅ$'Ó%"I¿“¿ŽRýÀi1 Ž0°‡? S~&Ô Ór…ä’Æ€¤{ nô_˜ÄÀÈÌLà?’ÎT€eäÔÆŽÀ7ùC"rÎÀOQ~"qIË ° O 8?$b §Ü‹rÿ#@×_â’v¼JÌ™‚£/¹é3ð'dá/ÈÖ÷W[¤¤›ço'Nüðlóú-2Î Ûüå@jÊO~Óî0”À2` HÄ@ÆØ„òÐ+–ª¤ÝpOB® ÞuOè¿È(lãS€Ô•Ÿü¦9Èô½ò~ðcß:x/èXd„.ðù°Æ”ò˜d ÈÉVày@F $H2Å •Ÿïü+M*•i€Ül8O@F $H2Á •Ÿå®2­4& r´POÀ´Ö¢üÔÂ€ûä7NùYS ó¶ øÀYƒ1`ðã;ÿJS3n² g['‘@W@"la`32Ên?'ûHB2p
îhÄm€mu ‰“×j@F@˜ÜV ²­Z!¦¿xIä”ÉÿH®y™Ñ±)üù>ÀåZ!6 ºà”aÎ`äþ‚¦ÌdDV$9f€ëù	pM¿6»I¨!LG:\LdrwPyË~ýPá§%Ôæ•L3Æá7çTKÑÄAm€mo|³6©Ÿ	3Ðé-Òh J3¿¼?Ž67 á¶yr¶”"€ûþàgÈÎ4. $±1À÷ý_¼[*Š¸&¸¤˜S/õdq´Îìãä‰ÁCÞâh Š3¿¼>Š6Å¶%±€¶Èã\€#´RZq¦ð=lK|Å”XÆÀXäWSˆe j5 /¡ýÐÓ$±˜:äýv@½‚ †€Î8Ð×d„1(‡z2~Fà)´ùö3¢ôÍ‹ÁÞÀl€®C¿† ëùâè#´‰›í=².\Lt? %Ñ N$9b %Ê:àþƒ2ùä€u	 É1|-˜	ldòÁ÷œœt $b À@?ü¥·@† »FàcÔïÏ^€D”d€[9ýà zÙà€ŠÏ:
HÄ@ ¾ŒP2v )~ ¦®@•àüïŸz5°Ç|€úÒ¿R«ÖµªàÁ|`# W39Ø‚ºá<î"-±0Àï\<ìdÒå€uÀoGLz 1œGp°à—e’å€¯d‹ .øjHÄ@jôFÊ3€•@ c{s<ÿùJ&	É@‹÷ëöb¸ÙÀw‹  ²§ ©nÁµàvðœ²û< ‰ˆ€ˆˆ,M;œû*p>p!0hHüà{=•ž»ðüxà]IÄÈ DLh™èÚâ<'¡Œh8Ç@V Á#ïã˜Jÿ°àfû IŒÈ ÄHn…¨ûãWŸ}àNÆt[uò$Ÿ¢°›§å þ@’ 2 	’]&)Ž† #€3ˆ“,	=%¯TôÕÀkÀ&à  I‰€”ˆ÷I¶®Ó³ð Ù[8	è	´L–]È]tïTðgõÀ6à-@b2 U†OVºã: A?€¯} .iî|	àxCœÂ÷rvßw; ÎÀ#ê>éi 8_b82 †WP€ìÑõè Ž {'n¯áÓ8ðz;€Æ¤yÝŽsŸ œÃ@¥¦¼P¡·o|ÂSùih $3ðÿ@ß¹jìŠá    IEND®B`‚
```

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
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
```

### app/login/page.tsx

`$lang
"use client";

import Link from "next/link";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { Camera, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, googleProvider, isFirebaseConfigured, missingFirebaseConfig } from "@/lib/firebase/client";

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[8px] border border-stone-200 bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-950 text-white">
          <Camera />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-stone-950">DigiShare login</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Admin accounts can upload, organise, retry conversions, and create share links.
        </p>

        {!isFirebaseConfigured ? (
          <p className="mt-6 rounded-[8px] bg-[#8d2f3f]/10 p-3 text-sm text-[#5f1f2b]">
            Missing Firebase env vars: {missingFirebaseConfig.join(", ")}
          </p>
        ) : user ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-[8px] bg-[#284235]/10 p-3 text-sm font-medium text-[#284235]">{user.email}</p>
            <Link href="/upload" className="inline-flex w-full justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
              Go to upload
            </Link>
            <button
              onClick={() => auth && signOut(auth)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => auth && signInWithPopup(auth, googleProvider)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
          >
            <LogIn size={16} />
            Continue with Google
          </button>
        )}
      </section>
    </main>
  );
}
```

### app/page.tsx

`$lang
import { CollectionCard } from "@/components/collection-card";
import { getCollections } from "@/lib/data";

export default async function Home() {
  const collections = await getCollections();

  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-16">
        <div className="self-end pb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d2f3f]">DigiCam Social</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-normal text-stone-950 sm:text-7xl">
            Private rolls for your favourite people.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
            Upload digicam photos and .MOV clips, organise them into collections, days, people, tags, and share clean
            gallery links without the social-network noise.
          </p>
        </div>
        <div className="grid min-h-[420px] grid-cols-5 grid-rows-5 gap-3">
          {collections[0]?.coverImageUrl ? (
            <img
              src={collections[0].coverImageUrl}
              alt=""
              className="col-span-5 row-span-3 h-full w-full rounded-[8px] object-cover shadow-xl sm:col-span-3 sm:row-span-5"
            />
          ) : null}
          <div className="col-span-3 row-span-2 rounded-[8px] bg-[#284235] p-5 text-white sm:col-span-2 sm:row-span-3">
            <p className="text-sm font-medium text-white/70">Archive status</p>
            <p className="mt-6 text-4xl font-semibold">{collections.reduce((sum, item) => sum + item.mediaCount, 0)}</p>
            <p className="mt-2 text-sm text-white/70">photos and clips indexed</p>
          </div>
          {collections[1]?.coverImageUrl ? (
            <img
              src={collections[1].coverImageUrl}
              alt=""
              className="col-span-2 row-span-2 h-full w-full rounded-[8px] object-cover shadow-lg"
            />
          ) : null}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Collections</p>
              <h2 className="mt-2 text-3xl font-semibold text-stone-950">Albums that feel like places</h2>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
```

### app/share/[shareId]/page.tsx

`$lang
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { SharePasswordGate } from "@/components/share-password-gate";
import { getShareById, getShareBundle, incrementShareView } from "@/lib/data";

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

  return (
    <GalleryShell
      collection={"collection" in bundle ? bundle.collection : undefined}
      day={"day" in bundle ? bundle.day : undefined}
      person={"person" in bundle ? bundle.person : undefined}
      days={bundle.days}
      media={bundle.media}
      allowDownload={bundle.share.allowDownload}
      allowOriginalQuality={bundle.share.allowOriginalQuality}
      shareMode
    />
  );
}
```

### app/u/[personSlug]/page.tsx

`$lang
import { notFound } from "next/navigation";
import { PersonProfileGallery } from "@/components/person-profile-gallery";
import { getCollectionsForMedia, getDaysForMedia, getMediaForPerson, getPersonBySlug } from "@/lib/data";

export default async function PersonPage({ params }: { params: Promise<{ personSlug: string }> }) {
  const { personSlug } = await params;
  const person = await getPersonBySlug(personSlug);
  if (!person) notFound();

  const media = await getMediaForPerson(person.slug);
  const [collections, days] = await Promise.all([getCollectionsForMedia(media), getDaysForMedia(media)]);

  return <PersonProfileGallery person={person} media={media} collections={collections} days={days} />;
}
```

### app/upload/page.tsx

`$lang
import { UploadConsole } from "@/components/upload-console";

export default function UploadPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Upload</p>
        <h1 className="mt-2 text-4xl font-semibold text-stone-950">Add a new roll</h1>
      </div>
      <UploadConsole />
    </main>
  );
}
```

### components/admin-collections-console.tsx

`$lang
"use client";

import { addDoc, collection, getDocs, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { CalendarDays, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { auth, db } from "@/lib/firebase/client";
import type { Collection, Day, Person, Visibility } from "@/lib/types";
import { slugify } from "@/lib/utils";

export function AdminCollectionsConsole() {
  return (
    <AdminGuard>
      <CollectionsWorkspace />
    </AdminGuard>
  );
}

function CollectionsWorkspace() {
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

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">Create collection</h2>
        <div className="mt-5 space-y-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summer 2026"
            className="w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short album description"
            rows={4}
            className="w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
          />
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as Visibility)}
            className="w-full rounded-[8px] border border-stone-300 bg-white px-3 py-3 outline-none focus:border-stone-950"
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
              className="w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
            />
            <input
              value={personAvatarUrl}
              onChange={(event) => setPersonAvatarUrl(event.target.value)}
              placeholder="Avatar URL"
              className="w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
            />
            <textarea
              value={personBio}
              onChange={(event) => setPersonBio(event.target.value)}
              placeholder="Bio"
              rows={3}
              className="w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
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
              className="w-full rounded-[8px] border border-stone-300 bg-white px-3 py-3 outline-none focus:border-stone-950"
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
              className="w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
            />
            <input
              type="date"
              value={dayDate}
              onChange={(event) => setDayDate(event.target.value)}
              className="w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
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
          <article key={item.id} className="rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm">
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

        <div className="rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">People</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {people.map((person) => (
              <a key={person.id} href={`/u/${person.slug}`} className="rounded-full bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
                {person.displayName}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">Days</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {days.map((day) => (
              <a
                key={day.id}
                href={`/c/${day.collectionSlug}/day/${day.slug}`}
                className="rounded-[8px] border border-stone-200 bg-[#fbfaf7] p-3 text-sm transition hover:border-stone-950"
              >
                <span className="block font-semibold text-stone-950">{day.title}</span>
                <span className="mt-1 block text-xs text-stone-500">
                  {day.collectionSlug} {day.date ? `- ${day.date}` : ""}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

### components/admin-dashboard-stats.tsx

`$lang
"use client";

import { collection, getDocs } from "firebase/firestore";
import { CalendarDays, FolderKanban, Images, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import type { Media } from "@/lib/types";

export function AdminDashboardStats() {
  const [stats, setStats] = useState({
    collections: 0,
    days: 0,
    people: 0,
    media: 0,
    processing: 0,
    failed: 0,
  });

  useEffect(() => {
    async function load() {
      if (!db) return;
      const [collections, days, people, media] = await Promise.all([
        getDocs(collection(db, "collections")),
        getDocs(collection(db, "days")),
        getDocs(collection(db, "people")),
        getDocs(collection(db, "media")),
      ]);
      const mediaRows = media.docs.map((item) => item.data() as Media);
      setStats({
        collections: collections.size,
        days: days.size,
        people: people.size,
        media: media.size,
        processing: mediaRows.filter((item) => item.status === "processing").length,
        failed: mediaRows.filter((item) => item.status === "failed").length,
      });
    }
    load();
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Stat icon={<FolderKanban size={16} />} label="Collections" value={stats.collections} />
      <Stat icon={<CalendarDays size={16} />} label="Days" value={stats.days} />
      <Stat icon={<Users size={16} />} label="People" value={stats.people} />
      <Stat icon={<Images size={16} />} label="Media" value={stats.media} />
      <Stat icon={<Images size={16} />} label="Processing" value={stats.processing} />
      <Stat icon={<Images size={16} />} label="Failed" value={stats.failed} tone="danger" />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <div className="rounded-[8px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className={tone === "danger" ? "text-[#8d2f3f]" : "text-[#284235]"}>{icon}</div>
      <p className="mt-3 text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}
```

### components/admin-guard.tsx

`$lang
"use client";

import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, googleProvider, isAllowedAdmin, isFirebaseConfigured, missingFirebaseConfig } from "@/lib/firebase/client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl rounded-[8px] border border-[#8d2f3f]/30 bg-[#8d2f3f]/10 p-6 text-[#5f1f2b]">
        <h1 className="text-xl font-semibold">Firebase config needed</h1>
        <p className="mt-2 text-sm leading-6">
          Add these environment variables before admin upload can connect: {missingFirebaseConfig.join(", ")}.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 text-center text-stone-500">Checking your session...</div>;
  }

  if (!user || !isAllowedAdmin(user.email)) {
    return (
      <div className="mx-auto max-w-md rounded-[8px] border border-stone-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-950">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Sign in with an authorised Google account to upload and organise the private archive.
        </p>
        <button
          onClick={() => auth && signInWithPopup(auth, googleProvider)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
        >
          <LogIn size={16} />
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-[8px] border border-stone-200 bg-white p-3 text-sm text-stone-600">
        <span>Signed in as {user.email}</span>
        <button onClick={() => auth && signOut(auth)} className="flex items-center gap-2 rounded-full px-3 py-2 font-medium text-stone-900">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
```

### components/admin-media-console.tsx

`$lang
"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Eye, EyeOff, RotateCcw, Star, Trash2 } from "lucide-react";
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

  async function bulk(action: "assign" | "hide" | "unhide" | "delete" | "set-cover" | "reorder") {
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
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[8px] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">Bulk edit</h2>
            <p className="text-sm text-stone-500">{selected.length} selected</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToolButton onClick={() => bulk("assign")} label="Assign" />
            <ToolButton onClick={() => bulk("hide")} label="Hide" icon={<EyeOff size={15} />} />
            <ToolButton onClick={() => bulk("unhide")} label="Unhide" icon={<Eye size={15} />} />
            <ToolButton onClick={() => bulk("set-cover")} label="Set cover" icon={<Star size={15} />} />
            <ToolButton onClick={() => bulk("reorder")} label="Reorder" />
            <ToolButton onClick={() => bulk("delete")} label="Delete" icon={<Trash2 size={15} />} danger />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <select
            value={collectionId}
            onChange={(event) => {
              setCollectionId(event.target.value);
              setDayId("");
            }}
            className="rounded-[8px] border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-stone-950"
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
            className="rounded-[8px] border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-stone-950"
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
            className="rounded-[8px] border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-stone-950"
          >
            <option value="">No person change</option>
            {people.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-sm">
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
            <div className="size-16 overflow-hidden rounded-[8px] bg-stone-100">
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

### components/collection-card.tsx

`$lang
import Link from "next/link";
import { CalendarDays, Image as ImageIcon } from "lucide-react";
import type { Collection, Day } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link href={`/c/${collection.slug}`} className="group block">
      <article className="overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="aspect-[4/3] overflow-hidden bg-stone-100">
          {collection.coverImageUrl ? (
            <img
              src={collection.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <ImageIcon />
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-950">{collection.title}</h2>
            <span className="rounded-full bg-[#284235]/10 px-2.5 py-1 text-xs font-semibold text-[#284235]">
              {collection.visibility}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-stone-600">{collection.description}</p>
          <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
            <span>{collection.mediaCount} files</span>
            <span>{collection.dayCount} days</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function DayCard({ day }: { day: Day }) {
  return (
    <Link href={`/c/${day.collectionSlug}/day/${day.slug}`} className="group block">
      <article className="overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-sm transition hover:shadow-lg">
        <div className="aspect-[5/3] overflow-hidden bg-stone-100">
          {day.coverImageUrl ? (
            <img
              src={day.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <CalendarDays />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d2f3f]">
            {prettyDate(day.date)}
          </div>
          <h3 className="mt-2 text-base font-semibold text-stone-950">{day.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{day.description}</p>
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
}: {
  allowDownload: boolean;
  downloadUrl?: string;
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
    <div className="mt-8 grid grid-cols-3 gap-2">
      <button
        onClick={nativeShare}
        className="flex h-11 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        title="Share"
      >
        <Share2 size={16} />
      </button>
      <button
        onClick={copyLink}
        className="flex h-11 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        title={copied ? "Copied" : "Copy link"}
      >
        <Copy size={16} />
      </button>
      {allowDownload && downloadUrl ? (
        <a
          href={downloadUrl}
          download
          className="flex h-11 items-center justify-center rounded-full bg-stone-950 text-white transition hover:bg-[#284235]"
          title="Download"
        >
          <Download size={16} />
        </a>
      ) : (
        <span className="flex h-11 items-center justify-center rounded-full bg-stone-200 text-stone-400">
          <Download size={16} />
        </span>
      )}
    </div>
  );
}
```

### components/gallery-shell.tsx

`$lang
import { CalendarDays, Image as ImageIcon, Users } from "lucide-react";
import { GalleryActions } from "@/components/gallery-actions";
import type { Collection, Day, Media, Person } from "@/lib/types";
import { prettyDate } from "@/lib/utils";
import { DayCard } from "@/components/collection-card";
import { MediaGrid } from "@/components/media-grid";

type GalleryShellProps = {
  collection?: Collection;
  day?: Day;
  person?: Person;
  days?: Day[];
  media: Media[];
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
  shareMode,
  allowDownload = true,
  allowOriginalQuality = false,
}: GalleryShellProps) {
  const title = day?.title ?? person?.displayName ?? collection?.title ?? "DigiShare";
  const description = day?.description ?? person?.bio ?? collection?.description;
  const cover = day?.coverImageUrl ?? person?.avatarUrl ?? collection?.coverImageUrl ?? media[0]?.displayUrl;
  const subtitle = day?.date ? prettyDate(day.date) : shareMode ? "Shared gallery link" : "Private digicam archive";
  const videoCount = media.filter((item) => item.type === "video").length;
  const downloadUrl = allowOriginalQuality
    ? media[0]?.originalUrl
    : media[0]?.videoMp4Url ?? media[0]?.displayUrl ?? media[0]?.originalUrl;

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative min-h-[360px] overflow-hidden rounded-[8px] bg-stone-200 sm:min-h-[520px]">
            {cover ? (
              <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-stone-500">
                <ImageIcon size={36} />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-5 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">{subtitle}</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal sm:text-6xl">{title}</h1>
            </div>
          </div>
          <aside className="flex flex-col justify-between rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-sm leading-7 text-stone-600">{description}</p>
              <dl className="mt-8 grid grid-cols-3 gap-3">
                <Stat icon={<ImageIcon size={17} />} label="Files" value={media.length} />
                <Stat icon={<CalendarDays size={17} />} label="Days" value={days.length || (day ? 1 : 0)} />
                <Stat icon={<Users size={17} />} label="Videos" value={videoCount} />
              </dl>
            </div>
            <GalleryActions allowDownload={allowDownload} downloadUrl={downloadUrl} />
          </aside>
        </div>
      </section>

      {days.length > 0 ? (
        <section className="border-y border-stone-200 bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Days</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-950">Browse the roll by day</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {days.map((item) => (
                <DayCard key={item.id} day={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Media</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">Gallery</h2>
          </div>
        </div>
        <MediaGrid media={media} allowDownload={allowDownload} allowOriginalQuality={allowOriginalQuality} />
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-stone-200 bg-[#fbfaf7] p-3">
      <div className="text-[#284235]">{icon}</div>
      <dt className="mt-3 text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-stone-950">{value}</dd>
    </div>
  );
}
```

### components/media-grid.tsx

`$lang
"use client";

import { useMemo, useState } from "react";
import { Download, Film, Loader2, Search, Tag, UserRound, X } from "lucide-react";
import type { Media } from "@/lib/types";
import { cn, formatBytes, prettyDate } from "@/lib/utils";

type Filter = "all" | "image" | "video";

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
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return media.filter((item) => {
      if (filter !== "all" && item.type !== filter) return false;
      const haystack = [
        item.caption,
        item.location,
        item.daySlug,
        ...(item.tags ?? []),
        ...(item.peopleSlugs ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [filter, media, query]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-500 sm:max-w-sm">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by person, tag, day..."
            className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
        </div>
        <div className="grid grid-cols-3 rounded-full border border-stone-300 bg-white p-1 text-sm font-semibold text-stone-600">
          {(["all", "image", "video"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={cn(
                "rounded-full px-4 py-2 capitalize transition",
                filter === item ? "bg-stone-950 text-white" : "hover:text-stone-950",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-[8px] border border-stone-200 bg-white text-left shadow-sm transition hover:shadow-xl"
            >
              <div className={cn("relative overflow-hidden bg-stone-100", index % 4 === 0 ? "aspect-[4/5]" : "aspect-[4/3]")}>
                {item.status === "processing" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-stone-500">
                    <Loader2 className="animate-spin" />
                    <span className="text-sm font-medium">Processing MP4</span>
                  </div>
                ) : item.status === "failed" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#8d2f3f]/10 text-[#8d2f3f]">
                    <Film />
                    <span className="text-sm font-semibold">Conversion failed</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={item.thumbnailUrl ?? item.displayUrl ?? item.originalUrl}
                      alt={item.caption ?? item.originalFileName}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    {item.type === "video" ? (
                      <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/70 text-white">
                        <Film size={16} />
                      </span>
                    ) : null}
                  </>
                )}
              </div>
              <div className="space-y-2 p-3">
                {item.caption ? <p className="text-sm font-medium text-stone-950">{item.caption}</p> : null}
                <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                  {item.location ? <span>{item.location}</span> : null}
                  {item.capturedAt ? <span>{prettyDate(item.capturedAt)}</span> : null}
                  {item.fileSizeBytes ? <span>{formatBytes(item.fileSizeBytes)}</span> : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          No media matches this filter.
        </div>
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
    <div className="fixed inset-0 z-50 bg-stone-950/95 p-3 text-white sm:p-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{media.caption ?? media.originalFileName}</p>
            <p className="text-xs text-white/60">{media.location}</p>
          </div>
          <button onClick={onClose} className="flex size-10 items-center justify-center rounded-full bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-[8px] bg-black">
          {media.status === "processing" ? (
            <div className="flex h-full items-center justify-center gap-3 text-white/70">
              <Loader2 className="animate-spin" />
              Processing video
            </div>
          ) : media.type === "video" ? (
            <video className="h-full w-full object-contain" src={source} poster={media.thumbnailUrl} controls autoPlay />
          ) : (
            <img src={source} alt={media.caption ?? ""} className="h-full w-full object-contain" />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <div className="flex flex-wrap items-center gap-3">
            {media.peopleSlugs?.map((person) => (
              <span key={person} className="flex items-center gap-1">
                <UserRound size={14} />
                {person}
              </span>
            ))}
            {media.tags?.map((tag) => (
              <span key={tag} className="flex items-center gap-1">
                <Tag size={14} />
                {tag}
              </span>
            ))}
          </div>
          {allowDownload && downloadSource ? (
            <a href={downloadSource} download className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-stone-950">
              <Download size={15} />
              Download
            </a>
          ) : null}
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
          <div className="overflow-hidden rounded-[8px] border border-stone-200 bg-[#fbfaf7] p-4 shadow-sm">
            <div className="aspect-square overflow-hidden rounded-[8px] bg-stone-200">
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

          <div className="mb-6 grid gap-3 rounded-[8px] border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2">
            <label className="text-sm font-semibold text-stone-700">
              Collection
              <select
                value={collectionSlug}
                onChange={(event) => {
                  setCollectionSlug(event.target.value);
                  setDaySlug("all");
                }}
                className="mt-2 w-full rounded-[8px] border border-stone-300 bg-white px-3 py-3 outline-none focus:border-stone-950"
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
                className="mt-2 w-full rounded-[8px] border border-stone-300 bg-white px-3 py-3 outline-none focus:border-stone-950"
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
    <div className="rounded-[8px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-[#284235]">{icon}</div>
      <p className="mt-3 text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}
```

### components/share-link-console.tsx

`$lang
"use client";

import { collection, getDocs } from "firebase/firestore";
import { Copy, Link2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import type { Collection, Day, Media, Person, ShareTargetType } from "@/lib/types";

export function ShareLinkConsole() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [targetType, setTargetType] = useState<ShareTargetType>("collection");
  const [targetId, setTargetId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowOriginalQuality, setAllowOriginalQuality] = useState(false);
  const [createdUrl, setCreatedUrl] = useState("");

  useEffect(() => {
    async function load() {
      if (!db) return;
      const [collectionSnap, daySnap, peopleSnap, mediaSnap] = await Promise.all([
        getDocs(collection(db, "collections")),
        getDocs(collection(db, "days")),
        getDocs(collection(db, "people")),
        getDocs(collection(db, "media")),
      ]);
      setCollections(collectionSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Collection));
      setDays(daySnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Day));
      setPeople(peopleSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Person));
      setMedia(mediaSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Media));
    }
    load();
  }, []);

  const options = useMemo(() => {
    if (targetType === "collection") {
      return collections.map((item) => ({ id: item.id, label: item.title, slug: item.slug }));
    }
    if (targetType === "day") {
      return days.map((item) => ({ id: item.id, label: `${item.collectionSlug} / ${item.title}`, slug: `${item.collectionSlug}/${item.slug}` }));
    }
    if (targetType === "person") {
      return people.map((item) => ({ id: item.id, label: item.displayName, slug: item.slug }));
    }
    return media.map((item) => ({ id: item.id, label: item.originalFileName, slug: item.id }));
  }, [collections, days, media, people, targetType]);

  async function createShare() {
    if (!auth?.currentUser || !targetId) return;
    const target = options.find((item) => item.id === targetId);
    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        targetType,
        targetId,
        targetSlug: target?.slug,
        expiresAt: expiresAt || undefined,
        password: password || undefined,
        allowDownload,
        allowOriginalQuality,
      }),
    });
    const result = (await response.json()) as { url?: string };
    if (result.url) {
      const absolute = `${window.location.origin}${result.url}`;
      setCreatedUrl(absolute);
      await navigator.clipboard.writeText(absolute);
    }
  }

  return (
    <section className="rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-stone-950 text-white">
          <Link2 size={17} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Create share link</h2>
          <p className="text-sm text-stone-500">Collection, day, person, or single media with expiry and password options.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <select
          value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value as ShareTargetType);
            setTargetId("");
          }}
          className="rounded-[8px] border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-stone-950"
        >
          <option value="collection">Collection</option>
          <option value="day">Day</option>
          <option value="person">Person</option>
          <option value="media">Media</option>
        </select>
        <select
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          className="rounded-[8px] border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-stone-950"
        >
          <option value="">Select target</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          className="rounded-[8px] border border-stone-300 px-3 py-3 text-sm outline-none focus:border-stone-950"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Optional password"
          className="rounded-[8px] border border-stone-300 px-3 py-3 text-sm outline-none focus:border-stone-950"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-stone-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={allowDownload} onChange={(event) => setAllowDownload(event.target.checked)} />
          Allow downloads
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowOriginalQuality}
            onChange={(event) => setAllowOriginalQuality(event.target.checked)}
          />
          Original quality
        </label>
      </div>

      <button onClick={createShare} className="mt-5 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
        Create and copy link
      </button>

      {createdUrl ? (
        <button
          onClick={() => navigator.clipboard.writeText(createdUrl)}
          className="mt-4 flex w-full items-center gap-2 rounded-[8px] bg-[#284235]/10 p-3 text-left text-sm font-medium text-[#284235]"
        >
          <Copy size={15} />
          {createdUrl}
        </button>
      ) : null}
    </section>
  );
}
```

### components/share-password-gate.tsx

`$lang
"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

export function SharePasswordGate({ shareId }: { shareId: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/shares/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId, password }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("That password did not work.");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-[8px] border border-stone-200 bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-950 text-white">
          <Lock size={20} />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-stone-950">Private share</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">Enter the password to view this gallery link.</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-6 w-full rounded-[8px] border border-stone-300 px-3 py-3 text-center outline-none focus:border-stone-950"
          placeholder="Password"
        />
        {error ? <p className="mt-3 text-sm font-medium text-[#8d2f3f]">{error}</p> : null}
        <button
          disabled={loading}
          className="mt-5 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-stone-300"
        >
          {loading ? "Checking..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}
```

### components/site-header.tsx

`$lang
import Link from "next/link";
import { Camera, Lock, Upload } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fbfaf7]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-stone-950">
          <span className="flex size-9 items-center justify-center rounded-full bg-stone-950 text-white">
            <Camera size={18} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide">DigiShare</span>
            <span className="block text-[11px] uppercase tracking-[0.24em] text-stone-500">Private rolls</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950 sm:flex"
          >
            <Lock size={15} />
            Admin
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#284235]"
          >
            <Upload size={15} />
            Upload
          </Link>
        </nav>
      </div>
    </header>
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
      <section className="space-y-4 rounded-[8px] border border-stone-200 bg-white p-5 shadow-sm">
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
            className="mt-2 w-full rounded-[8px] border border-stone-300 bg-white px-3 py-3 text-stone-950 outline-none focus:border-stone-950"
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
            className="mt-2 w-full rounded-[8px] border border-stone-300 bg-white px-3 py-3 text-stone-950 outline-none focus:border-stone-950 disabled:bg-stone-100"
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
            className="mt-2 w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Tags
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="beach, night, paris"
            className="mt-2 w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Caption
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Location
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Paris, Brighton, London"
            className="mt-2 w-full rounded-[8px] border border-stone-300 px-3 py-3 outline-none focus:border-stone-950"
          />
        </label>
      </section>

      <section className="space-y-4">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
          className="rounded-[8px] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm"
        >
          <UploadCloud className="mx-auto text-[#284235]" size={34} />
          <h2 className="mt-4 text-xl font-semibold text-stone-950">Drop digicam files here</h2>
          <p className="mt-2 text-sm text-stone-600">JPG, JPEG, PNG, WEBP, HEIC, MOV, and MP4 are accepted.</p>
          <label className="mt-5 inline-flex cursor-pointer rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
            Choose files
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.heic,.mov,.mp4,image/*,video/*"
              className="sr-only"
              onChange={(event) => event.target.files && addFiles(event.target.files)}
            />
          </label>
        </div>

        <button
          onClick={startUpload}
          disabled={!selectedCollection || items.length === 0}
          className="w-full rounded-full bg-[#284235] px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-950 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Start upload
        </button>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-[8px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                  {isVideoFile(item.file) ? <FileVideo size={18} /> : <ImageIcon size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-950">{item.file.name}</p>
                  <p className="text-xs text-stone-500">{item.message ?? item.status}</p>
                </div>
                <StatusIcon status={item.status} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-[#284235]" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
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
        className="min-w-0 flex-1 rounded-[8px] border border-stone-300 px-3 py-3 text-sm outline-none focus:border-stone-950"
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
```

### eslint.config.mjs

`$lang
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
];

export default eslintConfig;
```

### firebase.json

`$lang
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### firestore.indexes.json

`$lang
{
  "indexes": [
    {
      "collectionGroup": "days",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "collectionSlug", "order": "ASCENDING" },
        { "fieldPath": "sortOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "media",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "collectionSlug", "order": "ASCENDING" },
        { "fieldPath": "sortOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "media",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "peopleSlugs", "arrayConfig": "CONTAINS" },
        { "fieldPath": "sortOrder", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### firestore.rules

`$lang
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() && request.auth.token.email in [
        "you@example.com"
      ];
    }

    function publicVisibility(value) {
      return value in ["public", "unlisted"];
    }

    match /collections/{id} {
      allow read: if publicVisibility(resource.data.visibility) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /days/{id} {
      allow read: if isAdmin() || publicVisibility(get(/databases/$(database)/documents/collections/$(resource.data.collectionId)).data.visibility);
      allow create, update, delete: if isAdmin();
    }

    match /people/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /media/{id} {
      allow read: if isAdmin() || (
        resource.data.status == "ready" &&
        publicVisibility(resource.data.collectionVisibility)
      );
      allow create, update, delete: if isAdmin();
    }

    match /shares/{id} {
      allow read, create, update, delete: if isAdmin();
    }
  }
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

### lib/demo-data.ts

`$lang
import type { Collection, Day, Media, Person, Share } from "@/lib/types";

export const demoCollections: Collection[] = [
  {
    id: "summer-2026",
    slug: "summer-2026",
    title: "Summer 2026",
    description: "Pocket-camera frames, balcony dinners, beach clips, and the best accidental portraits.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85",
    visibility: "public",
    createdAt: "2026-06-01",
    updatedAt: "2026-06-21",
    createdBy: "demo",
    mediaCount: 18,
    dayCount: 3,
  },
  {
    id: "london-nights",
    slug: "london-nights",
    title: "London Nights",
    description: "Low-light flash, late trains, table photos, and small proof that everyone was there.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1800&q=85",
    visibility: "unlisted",
    createdAt: "2026-05-15",
    updatedAt: "2026-05-20",
    createdBy: "demo",
    mediaCount: 11,
    dayCount: 2,
  },
];

export const demoDays: Day[] = [
  {
    id: "paris-day-1",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    slug: "paris-day-1",
    title: "Paris Day 1",
    date: "2026-06-14",
    description: "First roll energy: cafes, river light, and too many test shots.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=85",
    createdAt: "2026-06-14",
    updatedAt: "2026-06-14",
    mediaCount: 7,
    sortOrder: 1,
  },
  {
    id: "beach-roll",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    slug: "beach-roll",
    title: "Beach Roll",
    date: "2026-06-17",
    description: "Washed-out noon, blue towels, and little MP4 memories.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85",
    createdAt: "2026-06-17",
    updatedAt: "2026-06-17",
    mediaCount: 6,
    sortOrder: 2,
  },
  {
    id: "after-dark",
    collectionId: "london-nights",
    collectionSlug: "london-nights",
    slug: "after-dark",
    title: "After Dark",
    date: "2026-05-18",
    description: "Flash reflections and velvet shadows.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=85",
    createdAt: "2026-05-18",
    updatedAt: "2026-05-18",
    mediaCount: 5,
    sortOrder: 1,
  },
];

export const demoPeople: Person[] = [
  {
    id: "max",
    slug: "max",
    displayName: "Max",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    bio: "Usually behind the camera, occasionally caught in the mirror.",
    createdAt: "2026-05-01",
    mediaCount: 9,
  },
  {
    id: "friends",
    slug: "friends",
    displayName: "Friends",
    avatarUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80",
    bio: "The recurring cast.",
    createdAt: "2026-05-01",
    mediaCount: 14,
  },
];

export const demoMedia: Media[] = [
  {
    id: "m1",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    dayId: "paris-day-1",
    daySlug: "paris-day-1",
    peopleSlugs: ["max"],
    tags: ["street", "cover"],
    type: "image",
    originalFileName: "DSC_0101.JPG",
    originalStoragePath: "demo/DSC_0101.JPG",
    originalUrl:
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1600&q=85",
    displayUrl:
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1600&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=600&q=75",
    caption: "First frame out of the station.",
    location: "Paris",
    capturedAt: "2026-06-14",
    uploadedBy: "demo",
    status: "ready",
    width: 1600,
    height: 1100,
    fileSizeBytes: 4200000,
    sortOrder: 1,
  },
  {
    id: "m2",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    dayId: "paris-day-1",
    daySlug: "paris-day-1",
    peopleSlugs: ["friends"],
    tags: ["food", "night"],
    type: "image",
    originalFileName: "DSC_0144.JPG",
    originalStoragePath: "demo/DSC_0144.JPG",
    originalUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=85",
    displayUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=75",
    caption: "Dinner evidence.",
    location: "Paris",
    capturedAt: "2026-06-14",
    uploadedBy: "demo",
    status: "ready",
    width: 1600,
    height: 1066,
    fileSizeBytes: 5100000,
    sortOrder: 2,
  },
  {
    id: "m3",
    collectionId: "summer-2026",
    collectionSlug: "summer-2026",
    dayId: "beach-roll",
    daySlug: "beach-roll",
    peopleSlugs: ["max", "friends"],
    tags: ["beach", "video"],
    type: "video",
    originalFileName: "MOV_0208.MOV",
    originalStoragePath: "demo/MOV_0208.MOV",
    originalUrl: "",
    videoMp4Url:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=600&q=75",
    displayUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=85",
    caption: "Tiny clip from the waterline.",
    location: "Brighton",
    capturedAt: "2026-06-17",
    uploadedBy: "demo",
    status: "ready",
    durationSeconds: 18,
    fileSizeBytes: 38000000,
    sortOrder: 3,
  },
  {
    id: "m4",
    collectionId: "london-nights",
    collectionSlug: "london-nights",
    dayId: "after-dark",
    daySlug: "after-dark",
    peopleSlugs: ["friends"],
    tags: ["flash", "night"],
    type: "image",
    originalFileName: "DSC_0307.JPG",
    originalStoragePath: "demo/DSC_0307.JPG",
    originalUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=85",
    displayUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=75",
    caption: "Everyone in one blurry rectangle.",
    location: "London",
    capturedAt: "2026-05-18",
    uploadedBy: "demo",
    status: "ready",
    width: 1600,
    height: 1067,
    fileSizeBytes: 4700000,
    sortOrder: 1,
  },
];

export const demoShares: Share[] = [
  {
    id: "abc123",
    shareId: "abc123",
    targetType: "collection",
    targetId: "summer-2026",
    targetSlug: "summer-2026",
    allowDownload: true,
    allowOriginalQuality: false,
    createdAt: "2026-06-20",
    createdBy: "demo",
    viewCount: 24,
  },
];
```

### lib/firebase/admin.ts

`$lang
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
  const allowed = (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(email.toLowerCase());
}
```

### lib/firebase/client.ts

`$lang
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`);

export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

export const app: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();

export const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedAdmin(email?: string | null) {
  if (!email) return false;
  if (adminEmails.length === 0) return true;
  return adminEmails.includes(email.toLowerCase());
}
```

### lib/media-client.ts

`$lang
export async function resizeImage(file: File, maxWidth: number, quality = 0.82): Promise<Blob | null> {
  if (!file.type.startsWith("image/") || file.type.includes("heic")) return null;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

export async function imageDimensions(file: File) {
  if (!file.type.startsWith("image/") || file.type.includes("heic")) return {};
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return {};
  return { width: bitmap.width, height: bitmap.height };
}
```

### lib/security.ts

`$lang
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function hashSharePassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${digest}`;
}

export function verifySharePassword(password: string, storedHash?: string) {
  if (!storedHash) return true;
  const [salt, digest] = storedHash.split(":");
  if (!salt || !digest) return false;
  const candidate = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  if (candidate.length !== digest.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(digest));
}
```

### lib/types.ts

`$lang
export type Visibility = "public" | "private" | "unlisted";
export type MediaType = "image" | "video";
export type MediaStatus = "uploading" | "processing" | "ready" | "failed" | "hidden";
export type ShareTargetType = "collection" | "day" | "person" | "media";

export type SerializableDate = string | number | null | undefined;

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverImageUrl?: string;
  visibility: Visibility;
  createdAt?: SerializableDate;
  updatedAt?: SerializableDate;
  createdBy: string;
  mediaCount: number;
  dayCount: number;
};

export type Day = {
  id: string;
  collectionId: string;
  collectionSlug: string;
  slug: string;
  title: string;
  date?: string;
  description?: string;
  coverMediaId?: string;
  coverImageUrl?: string;
  createdAt?: SerializableDate;
  updatedAt?: SerializableDate;
  mediaCount: number;
  sortOrder: number;
};

export type Person = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: SerializableDate;
  mediaCount: number;
};

export type Media = {
  id: string;
  collectionId?: string;
  collectionSlug?: string;
  collectionVisibility?: Visibility;
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
  capturedAt?: SerializableDate;
  uploadedAt?: SerializableDate;
  uploadedBy: string;
  status: MediaStatus;
  processingError?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSizeBytes?: number;
  sortOrder?: number;
};

export type Share = {
  id: string;
  shareId: string;
  targetType: ShareTargetType;
  targetId: string;
  targetSlug?: string;
  expiresAt?: SerializableDate;
  passwordHash?: string;
  allowDownload: boolean;
  allowOriginalQuality: boolean;
  createdAt?: SerializableDate;
  createdBy: string;
  viewCount: number;
};

export type GalleryBundle = {
  collection?: Collection;
  day?: Day;
  person?: Person;
  days: Day[];
  media: Media[];
};
```

### lib/utils.ts

`$lang
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function prettyDate(value?: string | number | null) {
  if (!value) return "";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isVideoFile(file: File) {
  return file.type.startsWith("video/") || /\.(mov|mp4|m4v|avi)$/i.test(file.name);
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
}

export function fileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "bin";
}

export function formatBytes(bytes?: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
```

### next.config.ts

`$lang
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### package.json

`$lang
{
  "name": "digi_cam_site",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "firebase": "^12.15.0",
    "firebase-admin": "^13.10.0",
    "lucide-react": "^1.22.0",
    "next": "^15.5.19",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "sharp": "^0.35.2",
    "tailwind-merge": "^3.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^15.5.19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### postcss.config.mjs

`$lang
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### README.md

`$lang
# DigiCam Social / DigiShare

Premium private digicam-style photo and video sharing built with Next.js 15, TypeScript, Tailwind CSS, Firebase Auth, Firestore, Storage, Firebase Admin, and a Cloud Run FFmpeg conversion worker.

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
- `CLOUD_RUN_CONVERTER_URL`
- `CONVERTER_SHARED_SECRET`

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

## Video Conversion Worker

The worker lives in `worker/`. Deploy it to Cloud Run with FFmpeg installed from the Dockerfile, then set `CLOUD_RUN_CONVERTER_URL` in the web app. Use the same `CONVERTER_SHARED_SECRET` in the web app and worker.

The worker stores original videos, converted MP4s, thumbnails, duration, dimensions, file size metadata, and marks failures as `status: "failed"` for retry from `/admin/media`.

## Admin Features

- Dashboard stats for collections, days, people, media, processing videos, and failed videos.
- Manage collections, days, and people.
- Drag/drop upload with inline collection/day creation and people/tag/caption/location assignment.
- Bulk media assign, hide, unhide, delete, set cover, reorder, and retry conversion.
- Share links for collection, day, person, or media with optional expiry, optional password, download toggle, and original-quality toggle.
```

### storage.rules

`$lang
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.token.email in [
        "you@example.com"
      ];
    }

    function readyPublicMedia(mediaId) {
      return firestore.exists(/databases/(default)/documents/media/$(mediaId)) &&
        firestore.get(/databases/(default)/documents/media/$(mediaId)).data.status == "ready" &&
        firestore.get(/databases/(default)/documents/media/$(mediaId)).data.collectionVisibility in ["public", "unlisted"];
    }

    match /media/{collectionSlug}/{mediaId}/{fileName} {
      allow read: if isAdmin() || readyPublicMedia(mediaId);
      allow write, delete: if isAdmin();
    }
  }
}
```

### tsconfig.json

`$lang
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### worker/Dockerfile

`$lang
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY index.js ./

ENV PORT=8080
CMD ["npm", "start"]
```

### worker/index.js

`$lang
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import express from "express";
import admin from "firebase-admin";

const exec = promisify(execFile);
const app = express();
app.use(express.json({ limit: "1mb" }));

if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "digishare-converter" });
});

app.post("/", async (req, res) => {
  const secret = process.env.CONVERTER_SHARED_SECRET;
  if (secret && req.header("x-worker-secret") !== secret) {
    res.status(401).json({ error: "Unauthorised" });
    return;
  }

  const { mediaId } = req.body ?? {};
  if (!mediaId) {
    res.status(400).json({ error: "mediaId is required" });
    return;
  }

  const mediaRef = db.collection("media").doc(mediaId);
  const snap = await mediaRef.get();
  if (!snap.exists) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  const media = snap.data();
  const workspace = await mkdtemp(join(tmpdir(), "digishare-"));
  const inputPath = join(workspace, "input");
  const outputPath = join(workspace, "output.mp4");
  const thumbPath = join(workspace, "thumbnail.jpg");

  try {
    await mediaRef.update({ status: "processing", processingError: admin.firestore.FieldValue.delete() });
    await bucket.file(media.originalStoragePath).download({ destination: inputPath });

    await exec("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-map_metadata",
      "0",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    await exec("ffmpeg", ["-y", "-ss", "00:00:01", "-i", inputPath, "-frames:v", "1", "-vf", "scale=720:-1", thumbPath]);

    const basePath = `media/${media.collectionSlug || "uncategorised"}/${mediaId}`;
    const mp4StoragePath = `${basePath}/converted.mp4`;
    const thumbnailStoragePath = `${basePath}/video-thumbnail.jpg`;

    await bucket.upload(outputPath, {
      destination: mp4StoragePath,
      metadata: { contentType: "video/mp4", cacheControl: "public,max-age=31536000" },
    });
    await bucket.upload(thumbPath, {
      destination: thumbnailStoragePath,
      metadata: { contentType: "image/jpeg", cacheControl: "public,max-age=31536000" },
    });

    const [mp4Url] = await bucket.file(mp4StoragePath).getSignedUrl({
      action: "read",
      expires: "2100-01-01",
    });
    const [thumbnailUrl] = await bucket.file(thumbnailStoragePath).getSignedUrl({
      action: "read",
      expires: "2100-01-01",
    });

    let probe = {};
    try {
      const { stdout } = await exec("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration",
        "-of",
        "json",
        outputPath,
      ]);
      const parsed = JSON.parse(stdout);
      probe = parsed.streams?.[0] ?? {};
    } catch {
      probe = {};
    }

    await mediaRef.update({
      status: "ready",
      videoMp4StoragePath: mp4StoragePath,
      videoMp4Url: mp4Url,
      thumbnailStoragePath,
      thumbnailUrl,
      displayUrl: thumbnailUrl,
      width: Number(probe.width) || null,
      height: Number(probe.height) || null,
      durationSeconds: Number(probe.duration) || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ ok: true, mediaId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown conversion error";
    await mediaRef.update({
      status: "failed",
      processingError: message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(500).json({ error: message });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`DigiShare converter listening on ${process.env.PORT || 8080}`);
});
```

### worker/package.json

`$lang
{
  "name": "digishare-converter-worker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "firebase-admin": "^13.6.0"
  }
}
```

### worker/README.md

`$lang
# DigiShare Cloud Run converter

This worker receives `{ "mediaId": "..." }`, downloads the original Firebase Storage object, converts it to MP4 with FFmpeg, captures a JPEG thumbnail, uploads both outputs, and updates the matching Firestore `media` document.

Deploy it with the same Firebase project credentials used by AIScend and set:

- `FIREBASE_STORAGE_BUCKET`
- `GOOGLE_APPLICATION_CREDENTIALS` or Cloud Run service account permissions
- `CONVERTER_SHARED_SECRET` if you want the Next.js API route to authenticate worker calls

Point the web app at the deployed URL with `CLOUD_RUN_CONVERTER_URL`.
```
