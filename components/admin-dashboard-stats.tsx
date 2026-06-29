"use client";

import { CalendarDays, FolderKanban, Images, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ADMIN_PASSWORD_HEADER, ADMIN_PASSWORD_STORAGE_KEY } from "@/lib/admin-password";
import type { Collection, Day, Media, Person } from "@/lib/types";

export function AdminDashboardStats() {
  const [stats, setStats] = useState({
    collections: 0,
    days: 0,
    people: 0,
    media: 0,
    processing: 0,
    failed: 0,
  });

  useEffect(() => {
    async function load() {
      const password = window.localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ?? "";
      const response = await fetch("/api/admin/options", { headers: { [ADMIN_PASSWORD_HEADER]: password } });
      if (!response.ok) return;
      const result = (await response.json()) as {
        collections: Collection[];
        days: Day[];
        people: Person[];
        media: Media[];
      };
      setStats({
        collections: result.collections.length,
        days: result.days.length,
        people: result.people.length,
        media: result.media.length,
        processing: result.media.filter((item) => item.status === "processing").length,
        failed: result.media.filter((item) => item.status === "failed").length,
      });
    }
    load();
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Stat icon={<FolderKanban size={16} />} label="Collections" value={stats.collections} />
      <Stat icon={<CalendarDays size={16} />} label="Events" value={stats.days} />
      <Stat icon={<Users size={16} />} label="People" value={stats.people} />
      <Stat icon={<Images size={16} />} label="Media" value={stats.media} />
      <Stat icon={<Images size={16} />} label="Processing" value={stats.processing} />
      <Stat icon={<Images size={16} />} label="Failed" value={stats.failed} tone="danger" />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <div className="rounded-[8px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className={tone === "danger" ? "text-[#8d2f3f]" : "text-[#284235]"}>{icon}</div>
      <p className="mt-3 text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}
