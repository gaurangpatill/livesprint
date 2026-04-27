import type { LiveSprintEvent } from "@/lib/events";
import type { SprintPhase, SprintSession, TaskStatus } from "@/lib/types";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export type JoinSessionPayload = {
  displayName: string;
};

export type JoinSessionAck = {
  ok: boolean;
  userId?: string;
  session?: SprintSession;
  error?: string;
};

export type TaskAssignPayload = {
  taskId: string;
  assigneeId: string;
};

export type TaskCreatePayload = {
  title: string;
  description?: string;
  assigneeId?: string;
  filePaths?: string[];
};

export type TaskUpdatePayload = {
  taskId: string;
  title?: string;
  description?: string;
  assigneeId?: string;
  filePaths?: string[];
};

export type TaskStatusPayload = {
  taskId: string;
  status: TaskStatus;
};

export type TaskBlockedPayload = {
  taskId: string;
  reason?: string;
};

export type TaskDonePayload = {
  taskId: string;
};

export type PhaseChangePayload = {
  phase: SprintPhase;
};

export type TimerResetPayload = {
  durationSeconds?: number;
};

export type RealtimeCommandAck = {
  ok: boolean;
  error?: string;
};

export type ServerErrorPayload = {
  message: string;
  code?: string;
};

export type SessionEventPayload = {
  event: LiveSprintEvent;
  session: SprintSession;
};

export type ServerToClientEvents = {
  "session:snapshot": (session: SprintSession) => void;
  "session:event": (payload: SessionEventPayload) => void;
  "session:error": (payload: ServerErrorPayload) => void;
};

export type ClientToServerEvents = {
  "session:join": (
    payload: JoinSessionPayload,
    ack?: (response: JoinSessionAck) => void,
  ) => void;
  "session:leave": (ack?: (response: RealtimeCommandAck) => void) => void;
  "task:create": (
    payload: TaskCreatePayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
  "task:update": (
    payload: TaskUpdatePayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
  "task:assign": (
    payload: TaskAssignPayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
  "task:update-status": (
    payload: TaskStatusPayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
  "task:block": (
    payload: TaskBlockedPayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
  "task:complete": (
    payload: TaskDonePayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
  "phase:change": (
    payload: PhaseChangePayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
  "timer:start": (ack?: (response: RealtimeCommandAck) => void) => void;
  "timer:pause": (ack?: (response: RealtimeCommandAck) => void) => void;
  "timer:reset": (
    payload: TimerResetPayload,
    ack?: (response: RealtimeCommandAck) => void,
  ) => void;
};

export type InterServerEvents = Record<string, never>;

export type SocketData = {
  userId?: string;
};
