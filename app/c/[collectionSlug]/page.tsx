import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { getCollectionBySlug, getDaysForCollection, getMediaForCollection, getPeopleBySlugs } from "@/lib/data";

export default async function CollectionPage({ params }: { params: Promise<{ collectionSlug: string }> }) {
  const { collectionSlug } = await params;
  const collection = await getCollectionBySlug(collectionSlug);
  if (!collection) notFound();

  const [days, media] = await Promise.all([
    getDaysForCollection(collection.slug),
    getMediaForCollection(collection.slug),
  ]);
  const people = await getPeopleBySlugs(media.flatMap((item) => item.peopleSlugs ?? []));

  return <GalleryShell collection={collection} days={days} media={media} people={people} />;
}
