"use client";

import { Eye, EyeOff, RotateCcw, Star, Tag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { ADMIN_PASSWORD_HEADER, ADMIN_PASSWORD_STORAGE_KEY } from "@/lib/admin-password";
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
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaNotes, setMediaNotes] = useState("");
  const [mediaLocation, setMediaLocation] = useState("");
  const [mediaCapturedAt, setMediaCapturedAt] = useState("");
  const [mediaCamera, setMediaCamera] = useState("");
  const [mediaMetadata, setMediaMetadata] = useState("");
  const [error, setError] = useState("");

  const selectedCollection = collections.find((item) => item.id === collectionId);
  const selectedDay = days.find((item) => item.id === dayId);
  const selectedPeople = people.filter((item) => peopleIds.includes(item.id));
  const collectionDays = days.filter((item) => item.collectionId === collectionId);
  const selectedMedia = useMemo(() => media.filter((item) => selected.includes(item.id)), [media, selected]);

  const adminHeaders = useCallback(() => {
    const password = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ?? "";
    return { [ADMIN_PASSWORD_HEADER]: password };
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/options", { headers: adminHeaders() });
    if (!response.ok) return;
    const result = (await response.json()) as {
      media: Media[];
      collections: Collection[];
      days: Day[];
      people: Person[];
    };
    setMedia([...result.media].sort((a, b) => String(b.uploadedAt ?? "").localeCompare(String(a.uploadedAt ?? ""))));
    setCollections(result.collections);
    setDays(result.days);
    setPeople(result.people);
  }, [adminHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function authedPost(url: string, body: unknown) {
    setBusy(url);
    setError("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
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

  async function bulk(action: "assign" | "add-tags" | "metadata" | "hide" | "unhide" | "delete" | "set-cover" | "reorder") {
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
      title: mediaTitle,
      caption: mediaCaption,
      notes: mediaNotes,
      location: mediaLocation,
      capturedAt: mediaCapturedAt,
      camera: mediaCamera,
      metadata: parseMetadata(mediaMetadata),
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
            <ToolButton onClick={() => bulk("metadata")} label="Save metadata" />
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
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <input
            value={mediaTitle}
            onChange={(event) => setMediaTitle(event.target.value)}
            placeholder="Title"
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
          <input
            value={mediaLocation}
            onChange={(event) => setMediaLocation(event.target.value)}
            placeholder="Location"
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
          <input
            value={mediaCamera}
            onChange={(event) => setMediaCamera(event.target.value)}
            placeholder="Camera"
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
          <input
            type="datetime-local"
            value={mediaCapturedAt}
            onChange={(event) => setMediaCapturedAt(event.target.value)}
            className="rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
          <textarea
            value={mediaCaption}
            onChange={(event) => setMediaCaption(event.target.value)}
            placeholder="Caption"
            rows={3}
            className="rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
          <textarea
            value={mediaNotes}
            onChange={(event) => setMediaNotes(event.target.value)}
            placeholder="Notes"
            rows={3}
            className="rounded-[18px] border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-950"
          />
          <textarea
            value={mediaMetadata}
            onChange={(event) => setMediaMetadata(event.target.value)}
            placeholder={"Metadata\niso: 400\nvibe: max"}
            rows={3}
            className="rounded-[18px] border border-stone-300 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-stone-950 lg:col-span-3"
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

function parseMetadata(input: string) {
  return Object.fromEntries(
    input
      .split("\n")
      .map((line) => line.split(":"))
      .filter(([key, value]) => key?.trim() && value?.trim())
      .map(([key, ...value]) => [key.trim(), value.join(":").trim()]),
  );
}
