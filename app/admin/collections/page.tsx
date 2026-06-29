import { AdminCollectionsConsole } from "@/components/admin-collections-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function AdminCollectionsPage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Collections and people</h1>
        </div>
        <AdminCollectionsConsole />
      </AdminLayoutShell>
    </main>
  );
}
