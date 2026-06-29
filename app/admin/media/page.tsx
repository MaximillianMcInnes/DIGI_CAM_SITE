import { AdminMediaConsole } from "@/components/admin-media-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function AdminMediaPage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Media processing</h1>
        </div>
        <AdminMediaConsole />
      </AdminLayoutShell>
    </main>
  );
}
