import Link from "next/link";
import type { DashboardModuleStatus, DashboardStatusTone } from "@/lib/types";

const toneClasses: Record<DashboardStatusTone, string> = {
  ready: "border-emerald-500/30 bg-emerald-500/8 text-emerald-200",
  pending: "border-sky-500/30 bg-sky-500/8 text-sky-200",
  warning: "border-amber-500/30 bg-amber-500/8 text-amber-200",
  danger: "border-rose-500/30 bg-rose-500/8 text-rose-200",
};

type ModuleCardProps = {
  module: DashboardModuleStatus;
};

export function ModuleCard({ module }: ModuleCardProps) {
  const content = (
    <article className="flex min-h-56 flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/35 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {module.label}
          </p>
          <h2 className="mt-3 text-lg font-semibold text-white">
            {module.title}
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses[module.tone]}`}
        >
          {module.value}
        </span>
      </div>
      <div className="mt-8">
        <p className="text-sm leading-6 text-zinc-400">{module.detail}</p>
        <span className="mt-5 inline-flex h-10 items-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition group-hover:bg-cyan-200">
          {module.cta ?? "Open dashboard"}
        </span>
      </div>
    </article>
  );

  if (!module.href) {
    return content;
  }

  return (
    <Link className="group block focus:outline-none" href={module.href}>
      {content}
    </Link>
  );
}
