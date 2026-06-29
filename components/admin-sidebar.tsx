import Link from "next/link";
import { CalendarDays, FolderKanban, Images, LayoutDashboard, Upload, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/admin/collections", label: "Collections", icon: FolderKanban },
  { href: "/admin/days", label: "Events", icon: CalendarDays },
  { href: "/admin/people", label: "People", icon: Users },
  { href: "/admin/media", label: "Media", icon: Images },
];

export function AdminSidebar() {
  return (
    <aside className="rounded-[28px] border border-stone-200 bg-white p-3 shadow-sm lg:sticky lg:top-20">
      <nav className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
