import Link from "next/link";
import { FolderKanban, Images, Upload } from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";
import { AdminDashboardStats } from "@/components/admin-dashboard-stats";
import { AdminLayoutShell } from "@/components/admin-sidebar";
import { ShareLinkConsole } from "@/components/share-link-console";

export default function AdminPage() {
  return (
    <main>
      <AdminLayoutShell>
        <AdminGuard>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Archive control room</h1>
        </div>
        <AdminDashboardStats />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <AdminLink href="/upload" icon={<Upload />} title="Upload media" body="Batch upload photos, .MOV, and MP4 files." />
          <AdminLink href="/admin/collections" icon={<FolderKanban />} title="Collections" body="Create albums, days, covers, and people." />
          <AdminLink href="/admin/media" icon={<Images />} title="Media" body="Review status, failed conversions, and links." />
        </div>
        <div className="mt-6">
          <ShareLinkConsole />
        </div>
        </AdminGuard>
      </AdminLayoutShell>
    </main>
  );
}

function AdminLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="text-[#284235]">{icon}</div>
      <h2 className="mt-5 text-lg font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
    </Link>
  );
}
