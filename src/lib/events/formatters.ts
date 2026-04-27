import type { LiveSprintEvent, LiveSprintEventType } from "@/lib/events";
import type {
  ActivityEvent,
  SprintSession,
  SprintTask,
  SprintUser,
} from "@/lib/types";

export type ActivityFilter = "all" | "tasks" | "users" | "timer" | "git" | "conflicts";

export type ActivityPresentation = {
  actorName: string;
  category: Exclude<ActivityFilter, "all">;
  label: string;
  message: string;
  taskTitle?: string;
};

export const activityFilterLabels: Record<ActivityFilter, string> = {
  all: "All",
  tasks: "Tasks",
  users: "Users",
  timer: "Timer/Phase",
  git: "Git",
  conflicts: "Conflicts",
};

const activityTypeLabels: Record<LiveSprintEventType, string> = {
  "user.joined": "User joined",
  "user.left": "User left",
  "task.created": "Task created",
  "task.updated": "Task updated",
  "task.assigned": "Task assigned",
  "task.started": "Task started",
  "task.blocked": "Task blocked",
  "task.review_requested": "Review requested",
  "task.completed": "Task completed",
  "phase.changed": "Phase changed",
  "timer.started": "Timer started",
  "timer.paused": "Timer paused",
  "timer.reset": "Timer reset",
  "commit.linked": "Commit linked",
  "pull_request.opened": "PR opened",
  "pull_request.merged": "PR merged",
  "conflict.risk_detected": "Conflict detected",
};

export function getActivityCategory(type: string): Exclude<ActivityFilter, "all"> {
  if (type.startsWith("task.")) {
    return "tasks";
  }

  if (type.startsWith("user.")) {
    return "users";
  }

  if (type.startsWith("timer.") || type.startsWith("phase.")) {
    return "timer";
  }

  if (type.startsWith("commit.") || type.startsWith("pull_request.")) {
    return "git";
  }

  if (type.startsWith("conflict.")) {
    return "conflicts";
  }

  return "tasks";
}

export function getActivityLabel(type: string) {
  return activityTypeLabels[type as LiveSprintEventType] ?? "Activity event";
}

export function getUserName(users: SprintUser[], userId?: string) {
  if (!userId) {
    return "System";
  }

  return users.find((user) => user.id === userId)?.name ?? "Unknown user";
}

export function getTaskTitle(tasks: SprintTask[], taskId?: string) {
  if (!taskId) {
    return "Unknown task";
  }

  return tasks.find((task) => task.id === taskId)?.title ?? "Unknown task";
}

export function getTaskIdFromEvent(event: LiveSprintEvent) {
  if ("taskId" in event) {
    return event.taskId;
  }

  if (event.type === "task.created") {
    return event.task.id;
  }

  if (event.type === "commit.linked") {
    return event.commit.taskId;
  }

  if (
    event.type === "pull_request.opened" ||
    event.type === "pull_request.merged"
  ) {
    return event.pullRequest.taskId;
  }

  return undefined;
}

export function formatLiveSprintEvent(
  event: LiveSprintEvent,
  context: {
    previousSession: SprintSession;
    nextSession: SprintSession;
  },
): ActivityPresentation {
  const { previousSession, nextSession } = context;
  const eventType = (event as { type: string }).type;
  const actorName = getUserName(nextSession.users, event.actorId);
  const category = getActivityCategory(eventType);
  const taskTitle = getTaskTitle(nextSession.tasks, getTaskIdFromEvent(event));
  const label = getActivityLabel(eventType);

  switch (event.type) {
    case "user.joined":
      return {
        actorName: event.user.name,
        category,
        label,
        message: `${event.user.name} joined the sprint.`,
      };
    case "user.left":
      return {
        actorName: getUserName(previousSession.users, event.userId),
        category,
        label,
        message: `${getUserName(previousSession.users, event.userId)} left the sprint.`,
      };
    case "task.created":
      return {
        actorName,
        category,
        label,
        message: `${actorName} created "${event.task.title}".`,
        taskTitle: event.task.title,
      };
    case "task.updated":
      return {
        actorName,
        category,
        label,
        message: `${actorName} updated "${taskTitle}".`,
        taskTitle,
      };
    case "task.assigned":
      return {
        actorName,
        category,
        label,
        message: `${actorName} assigned "${taskTitle}" to ${getUserName(
          nextSession.users,
          event.assigneeId,
        )}.`,
        taskTitle,
      };
    case "task.started":
      return {
        actorName,
        category,
        label,
        message: `${actorName} started "${taskTitle}".`,
        taskTitle,
      };
    case "task.blocked":
      return {
        actorName,
        category,
        label,
        message: `${actorName} marked "${taskTitle}" as BLOCKED${
          event.reason ? `: ${event.reason}` : "."
        }`,
        taskTitle,
      };
    case "task.review_requested":
      return {
        actorName,
        category,
        label,
        message: `${actorName} moved "${taskTitle}" to REVIEW.`,
        taskTitle,
      };
    case "task.completed":
      return {
        actorName,
        category,
        label,
        message: `${actorName} completed "${taskTitle}".`,
        taskTitle,
      };
    case "phase.changed":
      return {
        actorName,
        category,
        label,
        message: `Sprint phase changed to ${event.phase}.`,
      };
    case "timer.started":
      return {
        actorName,
        category,
        label,
        message: `${actorName} started the ${nextSession.timer.phase} timer.`,
      };
    case "timer.paused":
      return {
        actorName,
        category,
        label,
        message: `${actorName} paused the ${nextSession.timer.phase} timer.`,
      };
    case "timer.reset":
      return {
        actorName,
        category,
        label,
        message: `${actorName} reset the ${nextSession.timer.phase} timer.`,
      };
    case "commit.linked":
      return {
        actorName,
        category,
        label,
        message: `${actorName} linked commit ${event.commit.sha} to ${
          event.commit.taskId ? `"${taskTitle}"` : "the sprint"
        }.`,
        taskTitle: event.commit.taskId ? taskTitle : undefined,
      };
    case "pull_request.opened":
      return {
        actorName,
        category,
        label,
        message: `${actorName} opened pull request "${event.pullRequest.title}"${
          event.pullRequest.taskId ? ` for "${taskTitle}"` : ""
        }.`,
        taskTitle: event.pullRequest.taskId ? taskTitle : undefined,
      };
    case "pull_request.merged":
      return {
        actorName,
        category,
        label,
        message: `${actorName} merged pull request "${event.pullRequest.title}"${
          event.pullRequest.taskId ? ` for "${taskTitle}"` : ""
        }.`,
        taskTitle: event.pullRequest.taskId ? taskTitle : undefined,
      };
    case "conflict.risk_detected":
      return {
        actorName,
        category,
        label,
        message: `${event.risk.level} conflict risk detected: ${event.risk.explanation}`,
      };
    default:
      return {
        actorName,
        category,
        label,
        message: `${actorName} performed ${eventType}.`,
      };
  }
}

export function formatStoredActivityEvent(
  event: ActivityEvent,
  session: SprintSession,
): ActivityPresentation {
  return {
    actorName: getUserName(session.users, event.actorId),
    category: getActivityCategory(event.type),
    label: getActivityLabel(event.type),
    message: event.message || `${getUserName(session.users, event.actorId)} performed ${event.type}.`,
    taskTitle: getTaskTitle(session.tasks, event.taskId),
  };
}
