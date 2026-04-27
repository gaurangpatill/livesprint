export type DashboardWidget =
  | "overview"
  | "join-session"
  | "sprint-board"
  | "presence"
  | "activity"
  | "conflicts"
  | "github"
  | "timer";

export type DashboardConfig = {
  id: string;
  title: string;
  description: string;
  sections: DashboardWidget[];
};

export const dashboardConfigs: DashboardConfig[] = [
  {
    id: "main",
    title: "LiveSprint Operations",
    description:
      "A realtime operating view for task flow, presence, sprint timing, Git activity, and conflict risk.",
    sections: [
      "overview",
      "join-session",
      "sprint-board",
      "presence",
      "timer",
      "activity",
      "conflicts",
      "github",
    ],
  },
  {
    id: "sprint-board",
    title: "Sprint Board",
    description:
      "Create, assign, edit, and move sprint work through the shared realtime workflow.",
    sections: ["join-session", "sprint-board", "presence", "activity"],
  },
  {
    id: "activity",
    title: "Activity Timeline",
    description:
      "Inspect the typed event stream that powers LiveSprint state synchronization.",
    sections: ["join-session", "activity", "presence"],
  },
  {
    id: "conflicts",
    title: "Conflict Risk",
    description:
      "Monitor active task file overlap and coordination risk across developers.",
    sections: ["join-session", "conflicts", "sprint-board", "activity"],
  },
  {
    id: "github",
    title: "Mock GitHub Events",
    description:
      "Simulate commits and pull requests flowing through the same event architecture as future webhooks.",
    sections: ["join-session", "github", "activity", "conflicts"],
  },
  {
    id: "timer",
    title: "Sprint Timer",
    description:
      "Control the server-authoritative sprint phase and countdown shared by every client.",
    sections: ["join-session", "timer", "activity", "presence"],
  },
];

export function getDashboardConfig(dashboardId: string) {
  return dashboardConfigs.find((dashboard) => dashboard.id === dashboardId);
}
