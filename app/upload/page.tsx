import { UploadConsole } from "@/components/upload-console";
import { AdminLayoutShell } from "@/components/admin-sidebar";

export default function UploadPage() {
  return (
    <main>
      <AdminLayoutShell>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d2f3f]">Upload</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-950">Add a new roll</h1>
        </div>
        <UploadConsole />
      </AdminLayoutShell>
    </main>
  );
}
