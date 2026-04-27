import type { DashboardModuleStatus } from "@/lib/types";
import type { SprintSession } from "@/lib/types";

export function getDashboardModules(
  session: SprintSession,
): DashboardModuleStatus[] {
  const activeTasks = session.tasks.filter(
    (task) => task.status === "IN_PROGRESS" || task.status === "IN_REVIEW",
  );
  const onlineUsers = session.users.filter((user) => user.presence === "online");
  const highestRisk = session.conflictRisks.find((risk) => risk.level === "HIGH")
    ?? session.conflictRisks.find((risk) => risk.level === "MEDIUM")
    ?? session.conflictRisks[0];

  return [
    {
      title: "LiveSprint Operations",
      label: "Main",
      value: "Overview",
      detail:
        "Open the full command center with board, presence, timer, activity, conflict risk, and Git events.",
      tone: "ready",
      href: "/dashboard/main",
      cta: "Open operations dashboard",
    },
    {
      title: "Sprint Board",
      label: "Board",
      value: `${session.tasks.length} tasks`,
      detail: `${activeTasks.length} tasks are currently active or in review.`,
      tone: "ready",
      href: "/dashboard/sprint-board",
      cta: "Open sprint board",
    },
    {
      title: "Presence",
      label: "Team",
      value: `${onlineUsers.length}/${session.users.length} online`,
      detail: "Joined users, disconnects, and current focus update live.",
      tone: "ready",
      href: "/dashboard/main",
      cta: "Open team view",
    },
    {
      title: "Activity Timeline",
      label: "Events",
      value: `${session.activity.length} events`,
      detail: "Every accepted command becomes a typed, readable event.",
      tone: "ready",
      href: "/dashboard/activity",
      cta: "Open activity timeline",
    },
    {
      title: "Sprint Timer",
      label: "Phase",
      value: session.phase,
      detail: `${Math.ceil(session.timer.remainingSeconds / 60)} minutes remain in the shared phase timer.`,
      tone: session.timer.isRunning ? "ready" : "pending",
      href: "/dashboard/timer",
      cta: "Open sprint timer",
    },
    {
      title: "Conflict Risk",
      label: "Risk",
      value: highestRisk?.level ?? "None",
      detail:
        highestRisk?.suggestedAction ??
        "No active file overlap is present in the authoritative session.",
      tone:
        highestRisk?.level === "HIGH"
          ? "danger"
          : highestRisk?.level === "MEDIUM"
            ? "warning"
            : "ready",
      href: "/dashboard/conflicts",
      cta: "Open conflict dashboard",
    },
    {
      title: "Mock GitHub Events",
      label: "Source",
      value: `${session.commits.length + session.pullRequests.length} events`,
      detail: "Mock commits and pull requests flow through the same reducer.",
      tone: "ready",
      href: "/dashboard/github",
      cta: "Open Git events",
    },
  ];
}

export function getFoundationStats(session: SprintSession) {
  return [
    { label: "Architecture", value: "Event driven" },
    { label: "Sprint phase", value: session.phase },
    { label: "Realtime", value: "Socket.IO" },
  ];
}
