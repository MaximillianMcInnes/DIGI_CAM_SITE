"use client";

import { ArrowDown, ArrowUp, CalendarDays, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { ADMIN_PASSWORD_HEADER, ADMIN_PASSWORD_STORAGE_KEY } from "@/lib/admin-password";
import { allowedPeople } from "@/lib/people";
import type { Collection, Day, Person, Visibility } from "@/lib/types";

export function AdminCollectionsConsole({ initialFocus = "collections" }: { initialFocus?: "collections" | "days" | "people" }) {
  return (
    <AdminGuard>
      <CollectionsWorkspace initialFocus={initialFocus} />
    </AdminGuard>
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

function CollectionsWorkspace({ initialFocus }: { initialFocus: "collections" | "days" | "people" }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [albumLocation, setAlbumLocation] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [albumNotes, setAlbumNotes] = useState("");
  const [albumCoverImageUrl, setAlbumCoverImageUrl] = useState("");
  const [albumMetadata, setAlbumMetadata] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("unlisted");
  const [personName, setPersonName] = useState("");
  const [personBio, setPersonBio] = useState("");
  const [personAvatarUrl, setPersonAvatarUrl] = useState("");
  const [dayTitle, setDayTitle] = useState("");
  const [dayDate, setDayDate] = useState("");
  const [dayLocation, setDayLocation] = useState("");
  const [dayDescription, setDayDescription] = useState("");
  const [dayNotes, setDayNotes] = useState("");
  const [dayCoverImageUrl, setDayCoverImageUrl] = useState("");
  const [dayMetadata, setDayMetadata] = useState("");
  const [dayCollectionId, setDayCollectionId] = useState("");

  const adminHeaders = useCallback(() => {
    const password = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ?? "";
    return { [ADMIN_PASSWORD_HEADER]: password };
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/options", { headers: adminHeaders() });
    if (!response.ok) return;
    const result = (await response.json()) as { collections: Collection[]; days: Day[]; people: Person[] };
    setCollections(result.collections);
    setDays(result.days);
    setPeople(result.people);
  }, [adminHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  async function createCollection() {
    if (!title.trim()) return;
    await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({
        title,
        subtitle,
        description,
        location: albumLocation,
        dateRange,
        notes: albumNotes,
        coverImageUrl: albumCoverImageUrl,
        metadata: parseMetadata(albumMetadata),
        visibility,
      }),
    });
    setTitle("");
    setSubtitle("");
    setDescription("");
    setAlbumLocation("");
    setDateRange("");
    setAlbumNotes("");
    setAlbumCoverImageUrl("");
    setAlbumMetadata("");
    await load();
  }

  async function createPerson() {
    if (!personName.trim()) return;
    await fetch("/api/admin/people", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ displayName: personName, bio: personBio, avatarUrl: personAvatarUrl }),
    });
    setPersonName("");
    setPersonBio("");
    setPersonAvatarUrl("");
    await load();
  }

  async function createDay() {
    if (!dayTitle.trim() || !dayCollectionId) return;
    await fetch("/api/admin/days", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({
        collectionId: dayCollectionId,
        title: dayTitle,
        date: dayDate,
        location: dayLocation,
        description: dayDescription,
        notes: dayNotes,
        coverImageUrl: dayCoverImageUrl,
        metadata: parseMetadata(dayMetadata),
      }),
    });
    setDayTitle("");
    setDayDate("");
    setDayLocation("");
    setDayDescription("");
    setDayNotes("");
    setDayCoverImageUrl("");
    setDayMetadata("");
    await load();
  }

  async function moveDay(day: Day, direction: -1 | 1) {
    const siblings = days
      .filter((item) => item.collectionId === day.collectionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = siblings.findIndex((item) => item.id === day.id);
    const swap = siblings[index + direction];
    if (!swap) return;
    await fetch("/api/admin/days", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({
        dayId: day.id,
        swapDayId: swap.id,
        sortOrder: day.sortOrder,
        swapSortOrder: swap.sortOrder,
      }),
    });
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
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Tiny title under the album name"
            className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short album description"
            rows={4}
            className="w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={albumLocation}
              onChange={(event) => setAlbumLocation(event.target.value)}
              placeholder="Location"
              className="rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <input
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              placeholder="Date range"
              className="rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
          </div>
          <input
            value={albumCoverImageUrl}
            onChange={(event) => setAlbumCoverImageUrl(event.target.value)}
            placeholder="Cover photo URL"
            className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
          <textarea
            value={albumNotes}
            onChange={(event) => setAlbumNotes(event.target.value)}
            placeholder="Private notes / Max lore"
            rows={3}
            className="w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
          />
          <textarea
            value={albumMetadata}
            onChange={(event) => setAlbumMetadata(event.target.value)}
            placeholder={"Metadata, one per line\ncamera: Canon IXUS\nvibe: flash chaos"}
            rows={3}
            className="w-full rounded-[18px] border border-stone-300 px-4 py-3 font-mono text-sm outline-none focus:border-stone-950"
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
              placeholder="Max or Eliza"
              autoFocus={initialFocus === "people"}
              list="allowed-people"
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <datalist id="allowed-people">
              {allowedPeople.map((person) => (
                <option key={person.slug} value={person.displayName} />
              ))}
            </datalist>
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
          <h2 className="text-xl font-semibold text-stone-950">Create event</h2>
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
              placeholder="Paris night one"
              autoFocus={initialFocus === "days"}
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <input
              type="date"
              value={dayDate}
              onChange={(event) => setDayDate(event.target.value)}
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <input
              value={dayLocation}
              onChange={(event) => setDayLocation(event.target.value)}
              placeholder="Event location"
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <input
              value={dayCoverImageUrl}
              onChange={(event) => setDayCoverImageUrl(event.target.value)}
              placeholder="Event cover photo URL"
              className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <textarea
              value={dayDescription}
              onChange={(event) => setDayDescription(event.target.value)}
              placeholder="Event description"
              rows={3}
              className="w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <textarea
              value={dayNotes}
              onChange={(event) => setDayNotes(event.target.value)}
              placeholder="Event notes"
              rows={3}
              className="w-full rounded-[18px] border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
            <textarea
              value={dayMetadata}
              onChange={(event) => setDayMetadata(event.target.value)}
              placeholder={"Event metadata\nweather: loud\nplaylist: Max mix"}
              rows={3}
              className="w-full rounded-[18px] border border-stone-300 px-4 py-3 font-mono text-sm outline-none focus:border-stone-950"
            />
            <button onClick={createDay} className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
              <CalendarDays size={16} />
              Create event
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
          <h2 className="text-lg font-semibold text-stone-950">Events</h2>
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
