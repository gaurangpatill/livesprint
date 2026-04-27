"use client";

import { useState, type FormEvent } from "react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ConflictRiskPanel } from "@/components/conflicts/ConflictRiskPanel";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { MockGithubEventsPanel } from "@/components/github/MockGithubEventsPanel";
import { PresencePanel } from "@/components/sprint/PresencePanel";
import { SprintBoard } from "@/components/sprint/SprintBoard";
import { SprintTimerPanel } from "@/components/timer/SprintTimerPanel";
import { getDashboardModules, getFoundationStats } from "@/lib/mock/dashboard";
import { mockSprintSession } from "@/lib/mock/session";
import { useLiveSprintSession } from "@/lib/realtime/useLiveSprintSession";

export function DashboardShell() {
  const [displayName, setDisplayName] = useState("");
  const {
    session,
    status,
    error,
    joinedUserId,
    isJoined,
    joinSession,
    leaveSession,
    createTask,
    updateTask,
    assignTask,
    updateTaskStatus,
    blockTask,
    completeTask,
  } = useLiveSprintSession({ initialSession: mockSprintSession });
  const dashboardModules = getDashboardModules(session);
  const foundationStats = getFoundationStats(session);
  const joinedUser = session.users.find((user) => user.id === joinedUserId);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await joinSession(displayName);
    } catch {
      // The hook owns the user-facing error state.
    }
  }

  return (
    <main className="min-h-screen bg-[#090a0f] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
              LiveSprint
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              Server-authoritative sprint state, live across clients.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
              Phase 4 turns the sprint board into a fully interactive shared
              task system with server-authoritative creation, edits, and flow
              changes.
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

        <section className="grid gap-5 border-b border-white/10 py-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Realtime Session
                </p>
                <h2 className="mt-3 text-lg font-semibold text-white">
                  {isJoined ? `Joined as ${joinedUser?.name ?? "teammate"}` : "Join the sprint"}
                </h2>
              </div>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/8 px-3 py-1 text-xs font-medium capitalize text-cyan-200">
                {status}
              </span>
            </div>

            {isJoined ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="text-sm text-zinc-400">
                  Task controls are enabled and broadcast through the server.
                </p>
                <button
                  className="h-10 rounded border border-white/10 bg-white/8 px-4 text-sm font-medium text-zinc-100 transition hover:bg-white/12"
                  type="button"
                  onClick={() => void leaveSession()}
                >
                  Leave session
                </button>
              </div>
            ) : (
              <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleJoin}>
                <input
                  className="h-11 min-w-0 flex-1 rounded border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300"
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Display name"
                  value={displayName}
                />
                <button
                  className="h-11 rounded bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!displayName.trim() || status === "disconnected" || status === "error"}
                  type="submit"
                >
                  Join session
                </button>
              </form>
            )}

            {error ? (
              <p className="mt-4 rounded border border-rose-400/30 bg-rose-400/8 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Transport
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              Socket.IO over a custom Next server
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              The server owns one in-memory sprint session. Clients send typed
              commands; the server validates them, reduces them into state, and
              broadcasts the updated session to every connected tab.
            </p>
          </div>
        </section>

        <section className="grid gap-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
          {dashboardModules.map((module) => (
            <ModuleCard key={module.title} module={module} />
          ))}
        </section>

        <section className="grid flex-1 gap-5 pb-6 xl:grid-cols-[1.6fr_0.9fr]">
          <SprintBoard
            canEdit={isJoined}
            onCreateTask={createTask}
            onAssignTask={(taskId, assigneeId) =>
              assignTask({ taskId, assigneeId })
            }
            onBlockTask={(taskId) => blockTask({ taskId })}
            onCompleteTask={(taskId) => completeTask({ taskId })}
            onUpdateTask={updateTask}
            onUpdateTaskStatus={updateTaskStatus}
            session={session}
          />

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
                  "Live sprint board",
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
