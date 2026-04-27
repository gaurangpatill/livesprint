import { taskStatusLabels, type LiveSprintEvent } from "@/lib/events";
import type {
  ActivityEvent,
  SprintSession,
  SprintTask,
  SprintUser,
} from "@/lib/types";

function getUserName(users: SprintUser[], userId?: string) {
  if (!userId) {
    return "System";
  }

  return users.find((user) => user.id === userId)?.name ?? "Unknown user";
}

function getTaskTitle(tasks: SprintTask[], taskId?: string) {
  if (!taskId) {
    return "Unknown task";
  }

  return tasks.find((task) => task.id === taskId)?.title ?? "Unknown task";
}

function getTaskId(event: LiveSprintEvent) {
  if ("taskId" in event) {
    return event.taskId;
  }

  if (event.type === "task.created") {
    return event.task.id;
  }

  if (event.type === "commit.linked") {
    return event.commit.taskId;
  }

  return undefined;
}

function getActivityMessage(
  previousSession: SprintSession,
  nextSession: SprintSession,
  event: LiveSprintEvent,
) {
  const actor = getUserName(nextSession.users, event.actorId);

  switch (event.type) {
    case "user.joined":
      return `${event.user.name} joined the sprint session.`;
    case "user.left":
      return `${getUserName(previousSession.users, event.userId)} left the sprint session.`;
    case "task.created":
      return `${actor} created "${event.task.title}".`;
    case "task.updated":
      return `${actor} updated "${getTaskTitle(nextSession.tasks, event.taskId)}".`;
    case "task.assigned":
      return `${actor} assigned "${getTaskTitle(nextSession.tasks, event.taskId)}" to ${getUserName(
        nextSession.users,
        event.assigneeId,
      )}.`;
    case "task.started":
      return `${actor} started "${getTaskTitle(nextSession.tasks, event.taskId)}".`;
    case "task.blocked":
      return `${actor} blocked "${getTaskTitle(nextSession.tasks, event.taskId)}"${
        event.reason ? `: ${event.reason}` : "."
      }`;
    case "task.review_requested":
      return `${actor} requested review for "${getTaskTitle(
        nextSession.tasks,
        event.taskId,
      )}".`;
    case "task.completed":
      return `${actor} completed "${getTaskTitle(nextSession.tasks, event.taskId)}".`;
    case "phase.changed":
      return `${actor} changed the sprint phase to ${event.phase}.`;
    case "timer.started":
      return `${actor} started the ${nextSession.timer.phase} timer.`;
    case "timer.paused":
      return `${actor} paused the ${nextSession.timer.phase} timer.`;
    case "timer.reset":
      return `${actor} reset the ${nextSession.timer.phase} timer.`;
    case "commit.linked":
      return `${actor} linked commit ${event.commit.sha} to ${
        event.commit.taskId
          ? `"${getTaskTitle(nextSession.tasks, event.commit.taskId)}"`
          : "the sprint"
      }.`;
    case "conflict.risk_detected":
      return `${event.risk.level} conflict risk detected: ${event.risk.explanation}`;
  }
}

function createActivityEvent(
  previousSession: SprintSession,
  nextSession: SprintSession,
  event: LiveSprintEvent,
): ActivityEvent {
  return {
    id: `activity-${event.id}`,
    type: event.type,
    actorId: event.actorId,
    taskId: getTaskId(event),
    message: getActivityMessage(previousSession, nextSession, event),
    createdAt: event.occurredAt,
  };
}

function updateTask(
  tasks: SprintTask[],
  taskId: string,
  updater: (task: SprintTask) => SprintTask,
) {
  return tasks.map((task) => (task.id === taskId ? updater(task) : task));
}

function calculatePausedRemainingSeconds(
  session: SprintSession,
  occurredAt: string,
) {
  if (!session.timer.startedAt) {
    return session.timer.remainingSeconds;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (Date.parse(occurredAt) - Date.parse(session.timer.startedAt)) / 1000,
    ),
  );

  return Math.max(0, session.timer.remainingSeconds - elapsedSeconds);
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
        timer: {
          ...session.timer,
          phase: event.phase,
          isRunning: false,
          startedAt: undefined,
          pausedAt: event.occurredAt,
        },
        updatedAt: event.occurredAt,
      };

    case "timer.started":
      return {
        ...session,
        timer: {
          ...session.timer,
          isRunning: true,
          startedAt: event.occurredAt,
          pausedAt: undefined,
        },
        updatedAt: event.occurredAt,
      };

    case "timer.paused":
      return {
        ...session,
        timer: {
          ...session.timer,
          isRunning: false,
          remainingSeconds: calculatePausedRemainingSeconds(session, event.occurredAt),
          pausedAt: event.occurredAt,
          startedAt: undefined,
        },
        updatedAt: event.occurredAt,
      };

    case "timer.reset":
      return {
        ...session,
        timer: {
          ...session.timer,
          isRunning: false,
          remainingSeconds: event.remainingSeconds ?? session.timer.durationSeconds,
          startedAt: undefined,
          pausedAt: undefined,
          resetAt: event.occurredAt,
        },
        updatedAt: event.occurredAt,
      };

    case "commit.linked":
      return {
        ...session,
        commits: [...session.commits, event.commit],
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

  return {
    ...nextSession,
    activity: [activity, ...nextSession.activity],
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
