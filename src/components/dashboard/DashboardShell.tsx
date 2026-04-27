import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ConflictRiskPanel } from "@/components/conflicts/ConflictRiskPanel";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { MockGithubEventsPanel } from "@/components/github/MockGithubEventsPanel";
import { PresencePanel } from "@/components/sprint/PresencePanel";
import { SprintBoard } from "@/components/sprint/SprintBoard";
import { SprintTimerPanel } from "@/components/timer/SprintTimerPanel";
import { getDashboardModules, getFoundationStats } from "@/lib/mock/dashboard";
import { mockSprintSession } from "@/lib/mock/session";

export function DashboardShell() {
  const session = mockSprintSession;
  const dashboardModules = getDashboardModules(session);
  const foundationStats = getFoundationStats(session);

  return (
    <main className="min-h-screen bg-[#090a0f] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
              LiveSprint
            </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              Core sprint state, ready for real-time sync.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
              Phase 2 adds the typed domain model, reducer-driven session
              updates, seed data, and tests that will support the WebSocket
              layer next.
          </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            {foundationStats.map((stat) => (
              <div
                className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                key={stat.label}
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-sm font-semibold text-zinc-100">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
          {dashboardModules.map((module) => (
              <ModuleCard key={module.title} module={module} />
          ))}
        </section>

        <section className="grid flex-1 gap-5 pb-6 xl:grid-cols-[1.6fr_0.9fr]">
          <SprintBoard session={session} />

          <aside className="grid content-start gap-5">
            <PresencePanel session={session} />
            <SprintTimerPanel timer={session.timer} />
            <ActivityFeed session={session} />
            <ConflictRiskPanel session={session} />
            <MockGithubEventsPanel session={session} />
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Session
                  </p>
                  <h2 className="mt-3 text-lg font-semibold text-white">
                    MVP Readiness
                  </h2>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/8 px-3 py-1 text-xs font-medium text-cyan-200">
                  Foundation
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  "Core sprint domain types",
                  "Typed event model",
                  "Pure session reducer",
                  "Seeded session state",
                ].map((item) => (
                  <div
                    className="flex items-center justify-between border-b border-white/8 pb-3 text-sm last:border-b-0 last:pb-0"
                    key={item}
                  >
                    <span className="text-zinc-300">{item}</span>
                    <span className="text-emerald-300">Ready</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
