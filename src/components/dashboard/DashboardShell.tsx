"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ConflictRiskPanel } from "@/components/conflicts/ConflictRiskPanel";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { MockGithubEventsPanel } from "@/components/github/MockGithubEventsPanel";
import { PresencePanel } from "@/components/sprint/PresencePanel";
import { SprintBoard } from "@/components/sprint/SprintBoard";
import { SprintTimerPanel } from "@/components/timer/SprintTimerPanel";
import {
  getDashboardConfig,
  type DashboardConfig,
  type DashboardWidget,
} from "@/lib/dashboards/config";
import { getDashboardModules, getFoundationStats } from "@/lib/mock/dashboard";
import { mockSprintSession } from "@/lib/mock/session";
import { useLiveSprintSession } from "@/lib/realtime/useLiveSprintSession";

type DashboardShellProps = {
  dashboardId?: string;
};

type PanelRenderContext = {
  isJoined: boolean;
  session: ReturnType<typeof useLiveSprintSession>["session"];
  createTask: ReturnType<typeof useLiveSprintSession>["createTask"];
  updateTask: ReturnType<typeof useLiveSprintSession>["updateTask"];
  assignTask: ReturnType<typeof useLiveSprintSession>["assignTask"];
  updateTaskStatus: ReturnType<typeof useLiveSprintSession>["updateTaskStatus"];
  blockTask: ReturnType<typeof useLiveSprintSession>["blockTask"];
  completeTask: ReturnType<typeof useLiveSprintSession>["completeTask"];
  changePhase: ReturnType<typeof useLiveSprintSession>["changePhase"];
  startTimer: ReturnType<typeof useLiveSprintSession>["startTimer"];
  pauseTimer: ReturnType<typeof useLiveSprintSession>["pauseTimer"];
  resetTimer: ReturnType<typeof useLiveSprintSession>["resetTimer"];
  simulateCommit: ReturnType<typeof useLiveSprintSession>["simulateCommit"];
  simulatePullRequest: ReturnType<
    typeof useLiveSprintSession
  >["simulatePullRequest"];
};

function getInitialDashboardConfig(dashboardId: string): DashboardConfig {
  return getDashboardConfig(dashboardId) ?? getDashboardConfig("main")!;
}

function JoinSessionPanel({
  displayName,
  error,
  isJoined,
  joinedUserName,
  onDisplayNameChange,
  onJoin,
  onLeave,
  status,
}: {
  displayName: string;
  error?: string;
  isJoined: boolean;
  joinedUserName?: string;
  onDisplayNameChange: (value: string) => void;
  onJoin: (event: FormEvent<HTMLFormElement>) => void;
  onLeave: () => void;
  status: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Realtime Session
          </p>
          <h2 className="mt-3 text-lg font-semibold text-white">
            {isJoined ? `Joined as ${joinedUserName ?? "teammate"}` : "Join the sprint"}
          </h2>
        </div>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/8 px-3 py-1 text-xs font-medium capitalize text-cyan-200">
          {status}
        </span>
      </div>

      {isJoined ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-400">
            Controls are enabled and every accepted action broadcasts to all
            connected tabs.
          </p>
          <button
            className="h-10 rounded-md border border-white/10 bg-white/8 px-4 text-sm font-medium text-zinc-100 transition hover:bg-white/12"
            type="button"
            onClick={onLeave}
          >
            Leave session
          </button>
        </div>
      ) : (
        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={onJoin}>
          <input
            className="h-11 min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300"
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Display name"
            value={displayName}
          />
          <button
            className="h-11 rounded-md bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              !displayName.trim() ||
              status === "disconnected" ||
              status === "error"
            }
            type="submit"
          >
            Join session
          </button>
        </form>
      )}

      {error ? (
        <p className="mt-4 rounded-md border border-rose-400/30 bg-rose-400/8 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function renderPanel(widget: DashboardWidget, context: PanelRenderContext) {
  switch (widget) {
    case "sprint-board":
      return (
        <SprintBoard
          canEdit={context.isJoined}
          onAssignTask={(taskId, assigneeId) =>
            context.assignTask({ taskId, assigneeId })
          }
          onBlockTask={(taskId) => context.blockTask({ taskId })}
          onCompleteTask={(taskId) => context.completeTask({ taskId })}
          onCreateTask={context.createTask}
          onUpdateTask={context.updateTask}
          onUpdateTaskStatus={context.updateTaskStatus}
          session={context.session}
        />
      );
    case "presence":
      return <PresencePanel session={context.session} />;
    case "timer":
      return (
        <SprintTimerPanel
          canEdit={context.isJoined}
          key={`${context.session.timer.phase}-${context.session.timer.durationSeconds}`}
          onChangePhase={context.changePhase}
          onPause={context.pauseTimer}
          onReset={context.resetTimer}
          onStart={context.startTimer}
          timer={context.session.timer}
        />
      );
    case "activity":
      return <ActivityFeed session={context.session} />;
    case "conflicts":
      return <ConflictRiskPanel session={context.session} />;
    case "github":
      return (
        <MockGithubEventsPanel
          canEdit={context.isJoined}
          onSimulateCommit={context.simulateCommit}
          onSimulatePullRequest={context.simulatePullRequest}
          session={context.session}
        />
      );
    default:
      return null;
  }
}

export function DashboardShell({ dashboardId = "main" }: DashboardShellProps) {
  const [displayName, setDisplayName] = useState("");
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() =>
    getInitialDashboardConfig(dashboardId),
  );
  const [dashboardError, setDashboardError] = useState<string>();
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
    changePhase,
    startTimer,
    pauseTimer,
    resetTimer,
    simulateCommit,
    simulatePullRequest,
  } = useLiveSprintSession({ initialSession: mockSprintSession });
  const dashboardModules = getDashboardModules(session);
  const foundationStats = getFoundationStats(session);
  const joinedUser = session.users.find((user) => user.id === joinedUserId);
  const activeDashboardId = dashboardConfig.id;

  useEffect(() => {
    let isActive = true;

    async function loadDashboardConfig() {
      try {
        const response = await fetch(`/api/dashboards/${dashboardId}`);

        if (!response.ok) {
          throw new Error(`Dashboard "${dashboardId}" could not be loaded.`);
        }

        const nextConfig = (await response.json()) as DashboardConfig;

        if (isActive) {
          setDashboardConfig(nextConfig);
          setDashboardError(undefined);
        }
      } catch (fetchError) {
        if (isActive) {
          setDashboardError(
            fetchError instanceof Error
              ? fetchError.message
              : "Dashboard configuration could not be loaded.",
          );
        }
      }
    }

    loadDashboardConfig();

    return () => {
      isActive = false;
    };
  }, [dashboardId]);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await joinSession(displayName);
    } catch {
      // The hook owns the user-facing error state.
    }
  }

  const panelContext = useMemo<PanelRenderContext>(
    () => ({
      assignTask,
      blockTask,
      changePhase,
      completeTask,
      createTask,
      isJoined,
      pauseTimer,
      resetTimer,
      session,
      simulateCommit,
      simulatePullRequest,
      startTimer,
      updateTask,
      updateTaskStatus,
    }),
    [
      assignTask,
      blockTask,
      changePhase,
      completeTask,
      createTask,
      isJoined,
      pauseTimer,
      resetTimer,
      session,
      simulateCommit,
      simulatePullRequest,
      startTimer,
      updateTask,
      updateTaskStatus,
    ],
  );
  const primaryWidgets = dashboardConfig.sections.filter(
    (section) =>
      section !== "overview" &&
      section !== "join-session" &&
      (activeDashboardId === "main" || section !== "presence"),
  );
  const leadWidget = activeDashboardId === "main" ? "sprint-board" : primaryWidgets[0];
  const sideWidgets =
    activeDashboardId === "main"
      ? (["presence", "timer", "activity", "conflicts", "github"] as DashboardWidget[])
      : primaryWidgets.filter((widget) => widget !== leadWidget);

  return (
    <main className="min-h-screen bg-[#090a0f] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="border-b border-white/10 pb-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              {activeDashboardId !== "main" ? (
                <Link
                  className="mb-4 inline-flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  href="/dashboard/main"
                >
                  Back to operations dashboard
                </Link>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                LiveSprint
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
                {dashboardConfig.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                {dashboardConfig.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
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
          </div>
        </header>

        {dashboardError ? (
          <p className="mt-6 rounded-md border border-amber-400/30 bg-amber-400/8 px-3 py-2 text-sm text-amber-100">
            {dashboardError}
          </p>
        ) : null}

        <section className="grid gap-5 border-b border-white/10 py-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <JoinSessionPanel
            displayName={displayName}
            error={error}
            isJoined={isJoined}
            joinedUserName={joinedUser?.name}
            onDisplayNameChange={setDisplayName}
            onJoin={handleJoin}
            onLeave={() => void leaveSession()}
            status={status}
          />

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              View Configuration
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              Route-backed workspace
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              This dashboard loads section metadata from the REST config layer;
              realtime sprint state continues to sync through Socket.IO.
            </p>
            <p className="mt-4 font-mono text-xs text-zinc-500">
              /api/dashboards/{activeDashboardId}
            </p>
          </section>
        </section>

        {activeDashboardId === "main" ? (
          <section className="border-b border-white/10 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Dashboards
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Choose a focused workspace
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-zinc-400">
                These product cards are loaded from the dashboard metadata
                layer and route into focused views backed by the same realtime
                session.
              </p>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {dashboardModules.map((module) => (
              <ModuleCard key={module.title} module={module} />
            ))}
            </div>
          </section>
        ) : null}

        <section className="grid flex-1 gap-5 py-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            {leadWidget ? renderPanel(leadWidget, panelContext) : null}
          </div>

          <aside className="grid min-w-0 content-start gap-5">
            {sideWidgets.map((widget) => (
              <div key={widget}>{renderPanel(widget, panelContext)}</div>
            ))}
          </aside>
        </section>
      </div>
    </main>
  );
}
