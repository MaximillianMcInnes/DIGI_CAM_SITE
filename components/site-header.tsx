import Link from "next/link";
import { Camera, Lock, Upload } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fbfaf7]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-stone-950">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#d8382f] text-white">
            <Camera size={18} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide">Max Roll</span>
            <span className="block text-[11px] uppercase tracking-[0.24em] text-stone-500">MOD lab</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950 sm:flex"
          >
            <Lock size={15} />
            Admin
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-full bg-[#d8382f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-950"
          >
            <Upload size={15} />
            Upload
          </Link>
        </nav>
      </div>
    </header>
  );
}
