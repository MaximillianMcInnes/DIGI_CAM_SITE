import { CalendarDays, Camera, Film, Image as ImageIcon, MapPin, NotebookText } from "lucide-react";
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
  const notes = day?.notes ?? collection?.notes;
  const cover = day?.coverImageUrl ?? person?.avatarUrl ?? collection?.coverImageUrl ?? media[0]?.displayUrl;
  const subtitle = day?.date
    ? prettyDate(day.date)
    : collection?.subtitle || collection?.dateRange || (shareMode ? "Shared private link" : "Max roll archive");
  const videos = media.filter((item) => item.type === "video");
  const photos = media.filter((item) => item.type === "image");
  const videoCount = videos.length;
  const photoCount = photos.length;
  const featuredPeople = people.length ? people : [];
  const downloadUrl = allowOriginalQuality
    ? media[0]?.originalUrl
    : media[0]?.type === "video"
      ? media[0]?.videoMp4Url
      : media[0]?.displayUrl ?? media[0]?.originalUrl;

  return (
    <main>
      <section className="mx-auto max-w-[1480px] px-3 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[18px] bg-stone-950 shadow-[0_22px_70px_rgba(28,25,23,0.18)]">
          <div className="min-h-[540px] lg:min-h-[640px]">
            {cover ? (
              <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-200 text-stone-500">
                <ImageIcon size={44} />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/88 via-black/28 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur">
                  {subtitle}
                </span>
                <span className="rounded-full bg-[#d8382f] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]">
                  Max mode
                </span>
              </div>
              <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                <div>
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-normal sm:text-6xl lg:text-7xl">{title}</h1>
                  {description ? <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">{description}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    {collection?.location || day?.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} />
                        {day?.location ?? collection?.location}
                      </span>
                    ) : null}
                    {notes ? (
                      <span className="inline-flex items-center gap-1.5">
                        <NotebookText size={13} />
                        notes saved
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[18px] border border-white/15 bg-white/12 p-3 backdrop-blur-xl sm:p-4">
                  <dl className="grid grid-cols-3 gap-2">
                    <Stat icon={<CalendarDays size={16} />} label="Events" value={days.length || (day ? 1 : 0)} />
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
        <section className="border-y border-stone-200 bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d8382f]">Events</p>
                <h2 className="mt-2 text-3xl font-semibold text-stone-950">Where the roll happened</h2>
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

      {notes ? (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-[18px] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d8382f]">Notes</p>
            <p className="mt-3 text-sm leading-7 text-stone-700">{notes}</p>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Photos</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">The still frames</h2>
          </div>
        </div>
        <div className={day ? "border-l border-stone-200 pl-4 sm:pl-6" : ""}>
          <MediaGrid media={photos} allowDownload={allowDownload} allowOriginalQuality={allowOriginalQuality} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#284235]">Videos</p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-950">The moving evidence</h2>
          </div>
        </div>
        <div className={day ? "border-l border-stone-200 pl-4 sm:pl-6" : ""}>
          <MediaGrid media={videos} allowDownload={allowDownload} allowOriginalQuality={allowOriginalQuality} />
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[14px] bg-white/12 p-3">
      <div className="text-white/80">{icon}</div>
      <dt className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-white">{value}</dd>
    </div>
  );
}
