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
