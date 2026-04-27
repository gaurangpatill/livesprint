"use client";

import { useMemo, useState } from "react";
import {
  activityFilterLabels,
  formatStoredActivityEvent,
  getActivityCategory,
  type ActivityFilter,
} from "@/lib/events";
import type { ActivityEvent, SprintSession } from "@/lib/types";

type ActivityFeedProps = {
  session: SprintSession;
};

const filters: ActivityFilter[] = [
  "all",
  "tasks",
  "users",
  "timer",
  "git",
  "conflicts",
];

const categoryClasses: Record<Exclude<ActivityFilter, "all">, string> = {
  tasks: "border-cyan-400/30 bg-cyan-400/8 text-cyan-100",
  users: "border-emerald-400/30 bg-emerald-400/8 text-emerald-100",
  timer: "border-violet-400/30 bg-violet-400/8 text-violet-100",
  git: "border-sky-400/30 bg-sky-400/8 text-sky-100",
  conflicts: "border-rose-400/30 bg-rose-400/8 text-rose-100",
};

const categoryMarkers: Record<Exclude<ActivityFilter, "all">, string> = {
  tasks: "T",
  users: "U",
  timer: "P",
  git: "G",
  conflicts: "!",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getActorInitials(actorName: string) {
  return actorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LS";
}

function sortActivity(events: ActivityEvent[]) {
  return [...events].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function ActivityFeed({ session }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const visibleEvents = useMemo(() => {
    return sortActivity(session.activity).filter((event) => {
      if (activeFilter === "all") {
        return true;
      }

      return getActivityCategory(event.type) === activeFilter;
    });
  }, [activeFilter, session.activity]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Activity Feed
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              Live event timeline
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Server-accepted sprint events, ordered newest first.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-zinc-300">
            {session.activity.length} total
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              className={`h-8 rounded border px-3 text-xs font-medium transition ${
                activeFilter === filter
                  ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {activityFilterLabels[filter]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {visibleEvents.length > 0 ? (
          <ol className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-white/10">
            {visibleEvents.map((event) => {
              const presentation = formatStoredActivityEvent(event, session);
              const marker = categoryMarkers[presentation.category];

              return (
                <li className="relative flex gap-3" key={event.id}>
                  <div
                    className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${categoryClasses[presentation.category]}`}
                  >
                    {marker}
                  </div>
                  <article className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-white/8 text-[11px] font-semibold text-zinc-200">
                          {getActorInitials(presentation.actorName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {presentation.actorName}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-500">
                            {event.type}
                          </p>
                        </div>
                      </div>
                      <time
                        className="text-xs text-zinc-500"
                        dateTime={event.createdAt}
                      >
                        {formatTimestamp(event.createdAt)}
                      </time>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${categoryClasses[presentation.category]}`}
                      >
                        {presentation.label}
                      </span>
                      {event.taskId ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
                          {presentation.taskTitle}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {presentation.message}
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-zinc-500">
            No {activityFilterLabels[activeFilter].toLowerCase()} events yet.
          </div>
        )}
      </div>
    </section>
  );
}
