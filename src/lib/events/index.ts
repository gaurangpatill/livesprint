import type {
  CommitEvent,
  ConflictRisk,
  SprintPhase,
  SprintTask,
  SprintUser,
  TaskStatus,
} from "@/lib/types";

export type LiveSprintEventType =
  | "user.joined"
  | "user.left"
  | "task.created"
  | "task.updated"
  | "task.assigned"
  | "task.started"
  | "task.blocked"
  | "task.review_requested"
  | "task.completed"
  | "phase.changed"
  | "timer.started"
  | "timer.paused"
  | "timer.reset"
  | "commit.linked"
  | "conflict.risk_detected";

export type BaseLiveSprintEvent = {
  id: string;
  type: LiveSprintEventType;
  actorId?: string;
  occurredAt: string;
};

export type TaskUpdatePatch = Partial<
  Pick<SprintTask, "title" | "description" | "status" | "assigneeId" | "filePaths">
>;

export type LiveSprintEvent =
  | (BaseLiveSprintEvent & {
      type: "user.joined";
      user: SprintUser;
    })
  | (BaseLiveSprintEvent & {
      type: "user.left";
      userId: string;
    })
  | (BaseLiveSprintEvent & {
      type: "task.created";
      task: SprintTask;
    })
  | (BaseLiveSprintEvent & {
      type: "task.updated";
      taskId: string;
      updates: TaskUpdatePatch;
    })
  | (BaseLiveSprintEvent & {
      type: "task.assigned";
      taskId: string;
      assigneeId: string;
    })
  | (BaseLiveSprintEvent & {
      type: "task.started";
      taskId: string;
    })
  | (BaseLiveSprintEvent & {
      type: "task.blocked";
      taskId: string;
      reason?: string;
    })
  | (BaseLiveSprintEvent & {
      type: "task.review_requested";
      taskId: string;
    })
  | (BaseLiveSprintEvent & {
      type: "task.completed";
      taskId: string;
    })
  | (BaseLiveSprintEvent & {
      type: "phase.changed";
      phase: SprintPhase;
    })
  | (BaseLiveSprintEvent & {
      type: "timer.started";
    })
  | (BaseLiveSprintEvent & {
      type: "timer.paused";
    })
  | (BaseLiveSprintEvent & {
      type: "timer.reset";
      remainingSeconds?: number;
      durationSeconds?: number;
    })
  | (BaseLiveSprintEvent & {
      type: "commit.linked";
      commit: CommitEvent;
    })
  | (BaseLiveSprintEvent & {
      type: "conflict.risk_detected";
      risk: ConflictRisk;
    });

export const taskStatusLabels: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  READY: "Ready",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export type {
  ActivityFilter,
  ActivityPresentation,
} from "./formatters";
export {
  activityFilterLabels,
  formatLiveSprintEvent,
  formatStoredActivityEvent,
  getActivityCategory,
  getActivityLabel,
  getTaskIdFromEvent,
  getTaskTitle,
  getUserName,
} from "./formatters";
