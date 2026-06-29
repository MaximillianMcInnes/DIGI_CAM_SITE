import Link from "next/link";
import { Lock, Upload } from "lucide-react";
import { MovConverter } from "@/components/mov-converter";

export default function Home() {
  return (
    <main>
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <MovConverter />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600 shadow-sm">
          <span>Need to add clips to the private archive?</span>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#284235]"
            >
              <Upload size={15} />
              Upload
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-950"
            >
              <Lock size={15} />
              Admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

