import type { LiveSprintEvent } from "@/lib/events";
import type {
  JoinSessionPayload,
  PhaseChangePayload,
  TaskAssignPayload,
  TaskBlockedPayload,
  TaskCreatePayload,
  TaskDonePayload,
  TaskStatusPayload,
  TaskUpdatePayload,
  TimerResetPayload,
} from "@/lib/realtime/protocol";
import { normalizeFilePaths, validateFilePaths } from "@/lib/tasks/filePaths";
import { clampDurationSeconds, sprintPhases } from "@/lib/timer";
import type { SprintSession, SprintTask, SprintUser, TaskStatus } from "@/lib/types";

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

function ensureJoined(actorId?: string): asserts actorId is string {
  if (!actorId) {
    throw new Error("Join the sprint session before sending realtime updates.");
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

function ensurePhase(phase: string) {
  if (!sprintPhases.includes(phase as never)) {
    throw new Error("Invalid sprint phase.");
  }
}

function ensureTimerDuration(durationSeconds: number) {
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 60 ||
    durationSeconds > 14_400
  ) {
    throw new Error("Timer duration must be between 1 and 240 minutes.");
  }
}

function normalizeTaskTitle(title?: string) {
  const normalizedTitle = title?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "";

  if (!normalizedTitle) {
    throw new Error("Task title is required.");
  }

  return normalizedTitle;
}

function normalizeTaskDescription(description?: string) {
  return description?.trim().slice(0, 600) ?? "";
}

function ensureOptionalUserExists(session: SprintSession, userId?: string) {
  if (userId) {
    ensureUserExists(session, userId);
  }
}

export function createTaskCreatedEvent(
  session: SprintSession,
  payload: TaskCreatePayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);
  ensureOptionalUserExists(session, payload.assigneeId);
  const reporterId = actorId;

  const task: SprintTask = {
    id: `task-live-${crypto.randomUUID()}`,
    title: normalizeTaskTitle(payload.title),
    description: normalizeTaskDescription(payload.description),
    status: "READY",
    reporterId,
    assigneeId: payload.assigneeId,
    filePaths: normalizeTaskFilePaths(payload.filePaths ?? []),
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };

  return {
    id: createEventId("event-task-created"),
    type: "task.created",
    actorId,
    occurredAt,
    task,
  };
}

export function createTaskUpdatedEvent(
  session: SprintSession,
  payload: TaskUpdatePayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);
  ensureTaskExists(session, payload.taskId);
  ensureOptionalUserExists(session, payload.assigneeId);

  return {
    id: createEventId("event-task-updated"),
    type: "task.updated",
    actorId,
    occurredAt,
    taskId: payload.taskId,
    updates: {
      ...(payload.title !== undefined
        ? { title: normalizeTaskTitle(payload.title) }
        : {}),
      ...(payload.description !== undefined
        ? { description: normalizeTaskDescription(payload.description) }
        : {}),
      ...(payload.assigneeId !== undefined
        ? { assigneeId: payload.assigneeId || undefined }
        : {}),
      ...(payload.filePaths !== undefined
        ? { filePaths: normalizeTaskFilePaths(payload.filePaths) }
        : {}),
    },
  };
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

export function createPhaseChangedEvent(
  payload: PhaseChangePayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);
  ensurePhase(payload.phase);

  return {
    id: createEventId("event-phase-changed"),
    type: "phase.changed",
    actorId,
    occurredAt,
    phase: payload.phase,
  };
}

export function createTimerStartedEvent(
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);

  return {
    id: createEventId("event-timer-started"),
    type: "timer.started",
    actorId,
    occurredAt,
  };
}

export function createTimerPausedEvent(
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);

  return {
    id: createEventId("event-timer-paused"),
    type: "timer.paused",
    actorId,
    occurredAt,
  };
}

export function createTimerResetEvent(
  payload: TimerResetPayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureJoined(actorId);

  const durationSeconds =
    payload.durationSeconds === undefined
      ? undefined
      : payload.durationSeconds;

  if (durationSeconds !== undefined) {
    ensureTimerDuration(durationSeconds);
  }

  return {
    id: createEventId("event-timer-reset"),
    type: "timer.reset",
    actorId,
    occurredAt,
    durationSeconds:
      durationSeconds === undefined ? undefined : clampDurationSeconds(durationSeconds),
  };
}

function normalizeTaskFilePaths(filePaths: string[] | string) {
  validateFilePaths(filePaths);
  return normalizeFilePaths(filePaths);
}
