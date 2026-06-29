import { notFound } from "next/navigation";
import { PersonProfileGallery } from "@/components/person-profile-gallery";
import { getCollectionsForMedia, getDaysForMedia, getMediaForPerson, getPersonBySlug } from "@/lib/data";
import { isAllowedPersonSlug } from "@/lib/people";

export default async function PersonPage({ params }: { params: Promise<{ personSlug: string }> }) {
  const { personSlug: rawPersonSlug } = await params;
  const personSlug = rawPersonSlug.toLowerCase();
  if (!isAllowedPersonSlug(personSlug)) notFound();

  const person = await getPersonBySlug(personSlug);
  if (!person) notFound();

  const media = await getMediaForPerson(person.slug);
  const [collections, days] = await Promise.all([getCollectionsForMedia(media), getDaysForMedia(media)]);

  return <PersonProfileGallery person={person} media={media} collections={collections} days={days} />;
}
