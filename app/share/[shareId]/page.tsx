import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GalleryShell } from "@/components/gallery-shell";
import { SharePasswordGate } from "@/components/share-password-gate";
import { getPeopleBySlugs, getShareById, getShareBundle, incrementShareView } from "@/lib/data";

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const share = await getShareById(shareId);
  if (!share) notFound();

  const cookieStore = await cookies();
  if (share.passwordHash && cookieStore.get(`digishare_share_${shareId}`)?.value !== "ok") {
    return <SharePasswordGate shareId={shareId} />;
  }

  const bundle = await getShareBundle(shareId);
  if (!bundle) notFound();
  await incrementShareView(shareId);
  const people = await getPeopleBySlugs(bundle.media.flatMap((item) => item.peopleSlugs ?? []));

  return (
    <GalleryShell
      collection={"collection" in bundle ? bundle.collection : undefined}
      day={"day" in bundle ? bundle.day : undefined}
      person={"person" in bundle ? bundle.person : undefined}
      days={bundle.days}
      media={bundle.media}
      people={people}
      allowDownload={bundle.share.allowDownload}
      allowOriginalQuality={bundle.share.allowOriginalQuality}
      shareMode
    />
  );
}
