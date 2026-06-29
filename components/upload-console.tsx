"use client";

import { Check, FileVideo, Image as ImageIcon, Loader2, Plus, UploadCloud, XCircle } from "lucide-react";
import { ProcessingBadge, StatusBadge } from "@/components/gallery-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { ADMIN_PASSWORD_HEADER, ADMIN_PASSWORD_STORAGE_KEY } from "@/lib/admin-password";
import { allowedPersonSlugs } from "@/lib/people";
import type { Collection, Day, Person } from "@/lib/types";
import { isImageFile, isVideoFile } from "@/lib/utils";

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
  const [selectedPeopleSlugs, setSelectedPeopleSlugs] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [camera, setCamera] = useState("");
  const [metadataInput, setMetadataInput] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);

  const selectedCollectionDoc = useMemo(
    () => collections.find((item) => item.id === selectedCollection),
    [collections, selectedCollection],
  );
  const collectionDays = days.filter((day) => day.collectionId === selectedCollection);
  const selectedDayDoc = days.find((day) => day.id === selectedDay);

  const adminHeaders = useCallback(() => {
    const password = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ?? "";
    return { [ADMIN_PASSWORD_HEADER]: password };
  }, []);

  const loadOptions = useCallback(async () => {
    const response = await fetch("/api/admin/options", { headers: adminHeaders() });
    if (!response.ok) return;
    const result = (await response.json()) as { collections: Collection[]; days: Day[]; people: Person[] };
    setCollections(result.collections);
    setDays(result.days);
    setPeople(result.people);
  }, [adminHeaders]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  async function createCollectionInline() {
    if (!newCollection.trim()) return;
    const response = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ title: newCollection, visibility: "unlisted" }),
    });
    const result = (await response.json().catch(() => ({}))) as { collection?: Collection };
    setNewCollection("");
    await loadOptions();
    if (result.collection?.id) setSelectedCollection(result.collection.id);
  }

  async function createDayInline() {
    if (!selectedCollectionDoc || !newDay.trim()) return;
    const response = await fetch("/api/admin/days", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ collectionId: selectedCollectionDoc.id, title: newDay }),
    });
    const result = (await response.json().catch(() => ({}))) as { day?: Day };
    setNewDay("");
    await loadOptions();
    if (result.day?.id) setSelectedDay(result.day.id);
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

  function selectedPeople() {
    const peopleSlugs = selectedPeopleSlugs.filter((slug) => allowedPersonSlugs.includes(slug));
    const peopleIds = people.filter((person) => peopleSlugs.includes(person.slug)).map((person) => person.id);
    return { peopleIds, peopleSlugs };
  }

  async function uploadOne(item: UploadItem) {
    if (!selectedCollectionDoc) return;

    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, status: "uploading", progress: 10, message: "Uploading original" } : candidate,
      ),
    );

    const processingTimer = window.setTimeout(() => {
      if (!isVideoFile(item.file)) return;
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: "processing",
                progress: 65,
                message: "Converting camera video to MP4...",
              }
            : candidate,
        ),
      );
    }, 1200);

    try {
      const { peopleIds, peopleSlugs } = selectedPeople();
      const tags = tagInput
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      const formData = new FormData();
      formData.set("file", item.file);
      formData.set("collectionId", selectedCollectionDoc.id);
      formData.set("collectionSlug", selectedCollectionDoc.slug);
      if (selectedDayDoc?.id) formData.set("dayId", selectedDayDoc.id);
      if (selectedDayDoc?.slug) formData.set("daySlug", selectedDayDoc.slug);
      formData.set("peopleIds", JSON.stringify(peopleIds));
      formData.set("peopleSlugs", JSON.stringify(peopleSlugs));
      formData.set("tags", JSON.stringify(tags));
      formData.set("title", title);
      formData.set("caption", caption);
      formData.set("notes", notes);
      formData.set("location", location);
      formData.set("capturedAt", capturedAt);
      formData.set("camera", camera);
      formData.set("metadata", JSON.stringify(parseMetadata(metadataInput)));

      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: adminHeaders(),
        body: formData,
      });

      const result = (await response.json()) as { error?: string; mediaId?: string };
      if (!response.ok) throw new Error(result.error ?? "Upload failed");

      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                progress: 100,
                status: "ready",
                message: isVideoFile(item.file) ? "Converted and ready" : "Ready",
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
    } finally {
      window.clearTimeout(processingTimer);
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
          <p className="mt-1 text-sm text-stone-600">Choose the album and event once, then batch upload the roll.</p>
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
          Event
          <select
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
            disabled={!selectedCollection}
            className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-stone-950 disabled:bg-stone-100"
          >
            <option value="">No event</option>
            {collectionDays.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <InlineCreate placeholder="New event title" value={newDay} onChange={setNewDay} onCreate={createDayInline} />

        <div>
          <p className="text-sm font-semibold text-stone-700">People</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {people.map((person) => (
              <label
                key={person.slug}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 has-[:checked]:border-stone-950 has-[:checked]:bg-stone-950 has-[:checked]:text-white"
              >
                <input
                  type="checkbox"
                  checked={selectedPeopleSlugs.includes(person.slug)}
                  onChange={(event) => {
                    setSelectedPeopleSlugs((current) =>
                      event.target.checked
                        ? [...current, person.slug]
                        : current.filter((slug) => slug !== person.slug),
                    );
                  }}
                  className="sr-only"
                />
                {person.displayName}
              </label>
            ))}
          </div>
        </div>
        <label className="block text-sm font-semibold text-stone-700">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Max in full flash mode"
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
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Captured date
            <input
              type="datetime-local"
              value={capturedAt}
              onChange={(event) => setCapturedAt(event.target.value)}
              className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Camera
            <input
              value={camera}
              onChange={(event) => setCamera(event.target.value)}
              placeholder="Canon, Sony, iPhone..."
              className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-stone-950"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold text-stone-700">
          Metadata
          <textarea
            value={metadataInput}
            onChange={(event) => setMetadataInput(event.target.value)}
            placeholder={"one per line\nlens: wide\nenergy: max"}
            rows={3}
            className="mt-2 w-full rounded-[18px] border border-stone-300 px-4 py-3 font-mono text-sm outline-none focus:border-stone-950"
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
        Multi-upload JPG, PNG, WEBP, HEIC, MOD, MOV, and MP4. Images are compressed client-side where possible.
      </p>
      <label className="mt-6 inline-flex cursor-pointer rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#284235]">
        Choose files
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.mod,.mov,.mp4,.m4v,.mpeg,.mpg,image/*,video/*"
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
              {collectionSlug && daySlug ? <a href={`/c/${collectionSlug}/day/${daySlug}`} className="hover:text-stone-950">Open event</a> : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
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
