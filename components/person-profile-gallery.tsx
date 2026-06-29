"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Camera, Folder, UserRound } from "lucide-react";
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
  const filteredPhotos = filtered.filter((item) => item.type === "image");
  const filteredVideos = filtered.filter((item) => item.type === "video");

  return (
    <main>
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8 lg:py-10">
          <div className="overflow-hidden rounded-[18px] border border-stone-200 bg-[#fbfaf7] p-3 shadow-sm">
            <div className="aspect-square overflow-hidden rounded-[14px] bg-stone-200">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-stone-500">
                  <UserRound size={52} />
                </div>
              )}
            </div>
            <div className="pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d8382f]">Max roll person</p>
              <h1 className="mt-2 text-4xl font-semibold text-stone-950">{person.displayName}</h1>
              <p className="mt-3 text-sm leading-6 text-stone-600">{person.bio}</p>
            </div>
          </div>

          <div className="self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Appears in</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl">
              {media.length} frames, {days.length} events, a suspicious amount of main-character energy.
            </h2>
            <div className="mt-6">
              <ShareDialog title={`Share ${person.displayName}`} triggerLabel="Share person" />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <ProfileStat icon={<Camera size={17} />} label="Media" value={media.length} />
              <ProfileStat icon={<Folder size={17} />} label="Collections" value={collections.length} />
              <ProfileStat icon={<CalendarDays size={17} />} label="Events" value={days.length} />
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

          <section className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d8382f]">Events</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableDays.map((event) => (
                <a
                  key={event.id}
                  href={`/c/${event.collectionSlug}/day/${event.slug}`}
                  className="rounded-[18px] border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    {event.date || "undated"}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-stone-950">{event.title}</h3>
                  <p className="mt-2 text-sm text-stone-600">{event.location ?? event.collectionSlug}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Photos</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">Still frames</h2>
            <div className="mt-5">
              <MediaGrid media={filteredPhotos} allowDownload={false} />
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Videos</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">Moving proof</h2>
            <div className="mt-5">
              <MediaGrid media={filteredVideos} allowDownload={false} />
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-[#284235]">{icon}</div>
      <p className="mt-3 text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}
