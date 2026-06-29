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
              {collection.mediaCount} files
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
              {collection.dayCount} events
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Camera size={13} />
              Max roll
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
            Event {day.sortOrder}
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
