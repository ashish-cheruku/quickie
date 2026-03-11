"use client";

import { getDatasetStats } from "@/lib/retrieval";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookMarked, BookOpen, Star, TrendingUp, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
  const stats = getDatasetStats();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col w-72 xl:w-80 p-5",
          "bg-[#0d0d0d] border-r border-zinc-800/60 transition-transform duration-300 ease-in-out",
          "lg:static lg:translate-x-0 lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close */}
        <Button
          variant="ghost"
          size="icon"
          className="self-end mb-3 lg:hidden text-zinc-500 hover:text-zinc-200 h-8 w-8"
          onClick={onClose}
        >
          <X size={16} />
        </Button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700">
            <BookMarked size={16} className="text-zinc-300" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
              Dataset
            </p>
            <p className="text-sm font-bold text-white leading-tight">
              Kindle Paranormal
            </p>
          </div>
        </div>

        <Separator className="mb-5 bg-zinc-800/60" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <StatCard
            icon={<BookOpen size={13} />}
            label="Total Books"
            value={String(stats.total)}
          />
          <StatCard
            icon={<TrendingUp size={13} />}
            label="Avg Rating"
            value={`${stats.avgRating} ★`}
            highlight
          />
          <StatCard
            icon={<Users size={13} />}
            label="Total Reviews"
            value={stats.totalReviews}
          />
          <StatCard
            icon={<Star size={13} />}
            label="Paid / Free"
            value={`${stats.paid} / ${stats.free}`}
          />
        </div>

        <Separator className="mb-5 bg-zinc-800/60" />

        {/* Top books */}
        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
            Top Books
          </p>
          <TopBookItem label="Paid #1" title={stats.topPaidBook ?? "—"} />
          <TopBookItem label="Free #1" title={stats.topFreeBook ?? "—"} isFree />
        </div>

        <Separator className="my-4 bg-zinc-800/60" />

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-zinc-600">Dataset loaded in memory</span>
        </div>
      </aside>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 space-y-1">
      <div
        className={cn(
          "flex items-center gap-1.5",
          highlight ? "text-zinc-300" : "text-zinc-600"
        )}
      >
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p
        className={cn(
          "text-sm font-bold leading-tight",
          highlight ? "text-gradient-white" : "text-zinc-200"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TopBookItem({
  label,
  title,
  isFree,
}: {
  label: string;
  title: string;
  isFree?: boolean;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex items-start gap-2">
      <Badge
        variant="secondary"
        className={cn(
          "shrink-0 text-[10px] px-1.5 py-0 mt-0.5 border font-medium",
          isFree
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-800/40"
            : "bg-zinc-800 text-zinc-300 border-zinc-700"
        )}
      >
        {label}
      </Badge>
      <p className="text-xs text-zinc-400 leading-snug line-clamp-3">{title}</p>
    </div>
  );
}
