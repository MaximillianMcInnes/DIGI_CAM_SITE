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
        item.title,
        item.caption,
        item.notes,
        item.location,
        item.camera,
        item.daySlug,
        item.originalFileName,
        ...Object.values(item.metadata ?? {}),
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
            <p className="mt-1 truncate text-sm font-semibold">{media.title ?? media.caption ?? media.originalFileName}</p>
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
            {media.camera ? <span>{media.camera}</span> : null}
            {media.fileSizeBytes ? <span>{formatBytes(media.fileSizeBytes)}</span> : null}
          </div>
          <DownloadButton href={downloadSource} disabled={!allowDownload} />
        </div>
        {media.notes || Object.keys(media.metadata ?? {}).length ? (
          <div className="mt-3 grid gap-2 text-xs text-white/65 sm:grid-cols-[1fr_auto]">
            {media.notes ? <p className="leading-5">{media.notes}</p> : <span />}
            {Object.keys(media.metadata ?? {}).length ? (
              <dl className="flex flex-wrap gap-2">
                {Object.entries(media.metadata ?? {}).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="rounded-full bg-white/10 px-3 py-1">
                    <dt className="inline font-semibold">{key}: </dt>
                    <dd className="inline">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
