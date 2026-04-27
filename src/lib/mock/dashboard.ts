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
      title: "Sprint Board",
      label: "Board",
      value: `${session.tasks.length} tasks`,
      detail: `${activeTasks.length} tasks are currently active or in review.`,
      tone: "ready",
    },
    {
      title: "Presence",
      label: "Team",
      value: `${onlineUsers.length}/${session.users.length} online`,
      detail: "Presence is seeded now and will become live in Phase 3.",
      tone: "pending",
    },
    {
      title: "Activity Feed",
      label: "Events",
      value: `${session.activity.length} events`,
      detail: "Reducer-generated activity events will accumulate here.",
      tone: "ready",
    },
    {
      title: "Sprint Timer",
      label: "Phase",
      value: session.phase,
      detail: `${Math.ceil(session.timer.remainingSeconds / 60)} minutes remain in the shared phase timer.`,
      tone: session.timer.isRunning ? "ready" : "pending",
    },
    {
      title: "Conflict Risk",
      label: "Risk",
      value: highestRisk?.level ?? "None",
      detail:
        highestRisk?.suggestedAction ??
        "No conflict-risk records are present in the seed session.",
      tone: highestRisk?.level === "HIGH" ? "danger" : "warning",
    },
    {
      title: "Mock GitHub Events",
      label: "Source",
      value: `${session.commits.length} commit`,
      detail: "Commit events are typed but still seeded manually in Phase 2.",
      tone: "ready",
    },
  ];
}

export function getFoundationStats(session: SprintSession) {
  return [
    { label: "Architecture", value: "Event reducer" },
    { label: "Sprint phase", value: session.phase },
    { label: "State target", value: "Authoritative session" },
  ];
}
