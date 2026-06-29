import Link from "next/link";
import { Upload } from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <AdminGuard>
        <div className="mx-auto max-w-md rounded-[8px] border border-stone-200 bg-white p-6 text-center shadow-xl">
          <h1 className="text-3xl font-semibold text-stone-950">Admin unlocked</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            You can now upload, organise, retry conversions, and create share links.
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
          >
            <Upload size={16} />
            Go to upload
          </Link>
        </div>
      </AdminGuard>
    </main>
  );
}

