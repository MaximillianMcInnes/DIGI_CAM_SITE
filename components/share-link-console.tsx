"use client";

import { Copy, Link2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_PASSWORD_HEADER, ADMIN_PASSWORD_STORAGE_KEY } from "@/lib/admin-password";
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

  const adminHeaders = useCallback(() => {
    const password = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ?? "";
    return { [ADMIN_PASSWORD_HEADER]: password };
  }, []);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/options", { headers: adminHeaders() });
      if (!response.ok) return;
      const result = (await response.json()) as {
        collections: Collection[];
        days: Day[];
        people: Person[];
        media: Media[];
      };
      setCollections(result.collections);
      setDays(result.days);
      setPeople(result.people);
      setMedia(result.media);
    }
    load();
  }, [adminHeaders]);

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
    if (!targetId) return;
    const target = options.find((item) => item.id === targetId);
    const response = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
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
          autoComplete="new-password"
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
