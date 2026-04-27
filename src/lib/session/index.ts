import {
  detectConflictRisks,
  getNewSignificantRisks,
} from "@/lib/conflicts";
import {
  formatLiveSprintEvent,
  getTaskIdFromEvent,
  taskStatusLabels,
  type LiveSprintEvent,
} from "@/lib/events";
import type {
  ActivityEvent,
  SprintSession,
  SprintTask,
  SprintUser,
} from "@/lib/types";
import {
  changeTimerPhase,
  pauseTimer,
  resetTimer,
  startTimer,
} from "@/lib/timer";
import { normalizeFilePaths } from "@/lib/tasks/filePaths";

function createActivityEvent(
  previousSession: SprintSession,
  nextSession: SprintSession,
  event: LiveSprintEvent,
): ActivityEvent {
  const presentation = formatLiveSprintEvent(event, {
    previousSession,
    nextSession,
  });

  return {
    id: `activity-${event.id}`,
    type: event.type,
    actorId: event.actorId,
    taskId: getTaskIdFromEvent(event),
    message: presentation.message,
    createdAt: event.occurredAt,
  };
}

function createConflictActivityEvent(
  session: SprintSession,
  risk: SprintSession["conflictRisks"][number],
  actorId: string | undefined,
  occurredAt: string,
): ActivityEvent {
  const event: LiveSprintEvent = {
    id: `event-${risk.id}-${Date.parse(occurredAt)}`,
    type: "conflict.risk_detected",
    actorId,
    occurredAt,
    risk,
  };
  const presentation = formatLiveSprintEvent(event, {
    previousSession: session,
    nextSession: session,
  });

  return {
    id: `activity-${event.id}`,
    type: event.type,
    actorId,
    message: presentation.message,
    createdAt: occurredAt,
    metadata: {
      riskId: risk.id,
      affectedPath: risk.affectedPath,
      involvedTaskIds: risk.involvedTaskIds,
      involvedUserIds: risk.involvedUserIds,
    },
  };
}

function updateTask(
  tasks: SprintTask[],
  taskId: string,
  updater: (task: SprintTask) => SprintTask,
) {
  return tasks.map((task) => (task.id === taskId ? updater(task) : task));
}

function mergeFilePaths(existingPaths: string[], nextPaths: string[]) {
  return normalizeFilePaths([...existingPaths, ...nextPaths]);
}

function applyEvent(
  session: SprintSession,
  event: LiveSprintEvent,
): SprintSession {
  switch (event.type) {
    case "user.joined": {
      const existingUser = session.users.find((user) => user.id === event.user.id);
      const joinedUser: SprintUser = {
        ...event.user,
        presence: "online",
        joinedAt: event.occurredAt,
        lastSeenAt: event.occurredAt,
      };

      return {
        ...session,
        users: existingUser
          ? session.users.map((user) =>
              user.id === event.user.id ? { ...user, ...joinedUser } : user,
            )
          : [...session.users, joinedUser],
        updatedAt: event.occurredAt,
      };
    }

    case "user.left":
      return {
        ...session,
        users: session.users.map((user) =>
          user.id === event.userId
            ? {
                ...user,
                presence: "offline",
                currentTaskId: undefined,
                lastSeenAt: event.occurredAt,
              }
            : user,
        ),
        updatedAt: event.occurredAt,
      };

    case "task.created":
      return {
        ...session,
        tasks: [
          ...session.tasks,
          {
            ...event.task,
            createdAt: event.occurredAt,
            updatedAt: event.occurredAt,
          },
        ],
        updatedAt: event.occurredAt,
      };

    case "task.updated":
      return {
        ...session,
        tasks: updateTask(session.tasks, event.taskId, (task) => ({
          ...task,
          ...event.updates,
          updatedAt: event.occurredAt,
        })),
        updatedAt: event.occurredAt,
      };

    case "task.assigned":
      return {
        ...session,
        tasks: updateTask(session.tasks, event.taskId, (task) => ({
          ...task,
          assigneeId: event.assigneeId,
          updatedAt: event.occurredAt,
        })),
        updatedAt: event.occurredAt,
      };

    case "task.started":
      return {
        ...session,
        tasks: updateTask(session.tasks, event.taskId, (task) => ({
          ...task,
          status: "IN_PROGRESS",
          assigneeId: task.assigneeId ?? event.actorId,
          startedAt: task.startedAt ?? event.occurredAt,
          updatedAt: event.occurredAt,
        })),
        users: event.actorId
          ? session.users.map((user) =>
              user.id === event.actorId
                ? {
                    ...user,
                    currentTaskId: event.taskId,
                    lastSeenAt: event.occurredAt,
                  }
                : user,
            )
          : session.users,
        updatedAt: event.occurredAt,
      };

    case "task.blocked":
      return {
        ...session,
        tasks: updateTask(session.tasks, event.taskId, (task) => ({
          ...task,
          status: "BLOCKED",
          blockedAt: event.occurredAt,
          updatedAt: event.occurredAt,
        })),
        updatedAt: event.occurredAt,
      };

    case "task.review_requested":
      return {
        ...session,
        tasks: updateTask(session.tasks, event.taskId, (task) => ({
          ...task,
          status: "IN_REVIEW",
          reviewRequestedAt: event.occurredAt,
          updatedAt: event.occurredAt,
        })),
        updatedAt: event.occurredAt,
      };

    case "task.completed":
      return {
        ...session,
        tasks: updateTask(session.tasks, event.taskId, (task) => ({
          ...task,
          status: "DONE",
          completedAt: event.occurredAt,
          updatedAt: event.occurredAt,
        })),
        users: session.users.map((user) =>
          user.currentTaskId === event.taskId
            ? { ...user, currentTaskId: undefined, lastSeenAt: event.occurredAt }
            : user,
        ),
        updatedAt: event.occurredAt,
      };

    case "phase.changed":
      return {
        ...session,
        phase: event.phase,
        timer: changeTimerPhase(session.timer, event.phase, event.occurredAt),
        updatedAt: event.occurredAt,
      };

    case "timer.started":
      return {
        ...session,
        timer: startTimer(session.timer, event.occurredAt),
        updatedAt: event.occurredAt,
      };

    case "timer.paused":
      return {
        ...session,
        timer: pauseTimer(session.timer, event.occurredAt),
        updatedAt: event.occurredAt,
      };

    case "timer.reset":
      return {
        ...session,
        timer: resetTimer(
          session.timer,
          event.occurredAt,
          event.durationSeconds ?? event.remainingSeconds ?? session.timer.durationSeconds,
        ),
        updatedAt: event.occurredAt,
      };

    case "commit.linked":
      return {
        ...session,
        commits: [...session.commits, event.commit],
        tasks: event.commit.taskId
          ? updateTask(session.tasks, event.commit.taskId, (task) => ({
              ...task,
              filePaths: mergeFilePaths(task.filePaths, event.commit.filesChanged),
              updatedAt: event.occurredAt,
            }))
          : session.tasks,
        updatedAt: event.occurredAt,
      };

    case "pull_request.opened":
      return {
        ...session,
        pullRequests: [...session.pullRequests, event.pullRequest],
        tasks: event.pullRequest.taskId
          ? updateTask(session.tasks, event.pullRequest.taskId, (task) => ({
              ...task,
              status: "IN_REVIEW",
              reviewRequestedAt: task.reviewRequestedAt ?? event.occurredAt,
              filePaths: mergeFilePaths(
                task.filePaths,
                event.pullRequest.filesChanged,
              ),
              updatedAt: event.occurredAt,
            }))
          : session.tasks,
        updatedAt: event.occurredAt,
      };

    case "pull_request.merged":
      return {
        ...session,
        pullRequests: [...session.pullRequests, event.pullRequest],
        tasks: event.pullRequest.taskId
          ? updateTask(session.tasks, event.pullRequest.taskId, (task) => ({
              ...task,
              status: "DONE",
              completedAt: task.completedAt ?? event.occurredAt,
              filePaths: mergeFilePaths(
                task.filePaths,
                event.pullRequest.filesChanged,
              ),
              updatedAt: event.occurredAt,
            }))
          : session.tasks,
        updatedAt: event.occurredAt,
      };

    case "conflict.risk_detected":
      return {
        ...session,
        conflictRisks: [...session.conflictRisks, event.risk],
        updatedAt: event.occurredAt,
      };
  }
}

export function reduceSprintSession(
  session: SprintSession,
  event: LiveSprintEvent,
): SprintSession {
  const nextSession = applyEvent(session, event);
  const activity = createActivityEvent(session, nextSession, event);
  const conflictRisks = detectConflictRisks(
    nextSession.tasks,
    event.occurredAt,
    session.conflictRisks,
  );
  const newSignificantRisks = getNewSignificantRisks(
    session.conflictRisks,
    conflictRisks,
  );
  const conflictActivity = newSignificantRisks.map((risk) =>
    createConflictActivityEvent(
      { ...nextSession, conflictRisks },
      risk,
      event.actorId,
      event.occurredAt,
    ),
  );

  return {
    ...nextSession,
    conflictRisks,
    activity: [...conflictActivity, activity, ...nextSession.activity],
  };
}

export function getTasksByStatus(session: SprintSession) {
  return session.tasks.reduce(
    (groups, task) => {
      groups[task.status].push(task);
      return groups;
    },
    {
      BACKLOG: [],
      READY: [],
      IN_PROGRESS: [],
      BLOCKED: [],
      IN_REVIEW: [],
      DONE: [],
    } as Record<SprintTask["status"], SprintTask[]>,
  );
}

export function formatTaskStatus(status: SprintTask["status"]) {
  return taskStatusLabels[status];
}
