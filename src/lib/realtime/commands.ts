import type { LiveSprintEvent } from "@/lib/events";
import type {
  JoinSessionPayload,
  TaskAssignPayload,
  TaskBlockedPayload,
  TaskDonePayload,
  TaskStatusPayload,
} from "@/lib/realtime/protocol";
import type { SprintSession, SprintUser, TaskStatus } from "@/lib/types";

const validTaskStatuses: TaskStatus[] = [
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "BLOCKED",
  "IN_REVIEW",
  "DONE",
];

export function createEventId(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

export function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ").slice(0, 48);
}

export function getInitials(displayName: string) {
  const parts = normalizeDisplayName(displayName).split(" ").filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "LS";
}

export function createJoinedUser(
  payload: JoinSessionPayload,
  occurredAt: string,
): SprintUser {
  const displayName = normalizeDisplayName(payload.displayName);

  if (!displayName) {
    throw new Error("Display name is required.");
  }

  return {
    id: `user-live-${crypto.randomUUID()}`,
    name: displayName,
    role: "Guest collaborator",
    avatarInitials: getInitials(displayName),
    presence: "online",
    joinedAt: occurredAt,
    lastSeenAt: occurredAt,
  };
}

function ensureJoined(actorId?: string) {
  if (!actorId) {
    throw new Error("Join the sprint session before sending task updates.");
  }
}

function ensureTaskExists(session: SprintSession, taskId: string) {
  if (!session.tasks.some((task) => task.id === taskId)) {
    throw new Error("Task does not exist.");
  }
}

function ensureUserExists(session: SprintSession, userId: string) {
  if (!session.users.some((user) => user.id === userId)) {
    throw new Error("Assignee does not exist.");
  }
}

function ensureStatus(status: TaskStatus) {
  if (!validTaskStatuses.includes(status)) {
    throw new Error("Invalid task status.");
  }
}

export function createAssignTaskEvent(
  session: SprintSession,
  payload: TaskAssignPayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);
  ensureTaskExists(session, payload.taskId);
  ensureUserExists(session, payload.assigneeId);

  return {
    id: createEventId("event-task-assigned"),
    type: "task.assigned",
    actorId,
    occurredAt,
    taskId: payload.taskId,
    assigneeId: payload.assigneeId,
  };
}

export function createTaskStatusEvent(
  session: SprintSession,
  payload: TaskStatusPayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);
  ensureTaskExists(session, payload.taskId);
  ensureStatus(payload.status);

  if (payload.status === "IN_PROGRESS") {
    return {
      id: createEventId("event-task-started"),
      type: "task.started",
      actorId,
      occurredAt,
      taskId: payload.taskId,
    };
  }

  if (payload.status === "BLOCKED") {
    return {
      id: createEventId("event-task-blocked"),
      type: "task.blocked",
      actorId,
      occurredAt,
      taskId: payload.taskId,
    };
  }

  if (payload.status === "IN_REVIEW") {
    return {
      id: createEventId("event-task-review"),
      type: "task.review_requested",
      actorId,
      occurredAt,
      taskId: payload.taskId,
    };
  }

  if (payload.status === "DONE") {
    return {
      id: createEventId("event-task-done"),
      type: "task.completed",
      actorId,
      occurredAt,
      taskId: payload.taskId,
    };
  }

  return {
    id: createEventId("event-task-updated"),
    type: "task.updated",
    actorId,
    occurredAt,
    taskId: payload.taskId,
    updates: { status: payload.status },
  };
}

export function createBlockedTaskEvent(
  session: SprintSession,
  payload: TaskBlockedPayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);
  ensureTaskExists(session, payload.taskId);

  return {
    id: createEventId("event-task-blocked"),
    type: "task.blocked",
    actorId,
    occurredAt,
    taskId: payload.taskId,
    reason: payload.reason?.trim().slice(0, 160),
  };
}

export function createDoneTaskEvent(
  session: SprintSession,
  payload: TaskDonePayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);
  ensureTaskExists(session, payload.taskId);

  return {
    id: createEventId("event-task-done"),
    type: "task.completed",
    actorId,
    occurredAt,
    taskId: payload.taskId,
  };
}
