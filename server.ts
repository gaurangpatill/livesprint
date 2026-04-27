import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import type { LiveSprintEvent } from "./src/lib/events";
import { mockSprintSession } from "./src/lib/mock/session";
import {
  createAssignTaskEvent,
  createBlockedTaskEvent,
  createDoneTaskEvent,
  createEventId,
  createJoinedUser,
  createPhaseChangedEvent,
  createTaskCreatedEvent,
  createTaskStatusEvent,
  createTaskUpdatedEvent,
  createTimerPausedEvent,
  createTimerResetEvent,
  createTimerStartedEvent,
} from "./src/lib/realtime/commands";
import type {
  ClientToServerEvents,
  InterServerEvents,
  JoinSessionAck,
  RealtimeCommandAck,
  ServerToClientEvents,
  SocketData,
} from "./src/lib/realtime/protocol";
import { reduceSprintSession } from "./src/lib/session";
import { getCurrentTimerState } from "./src/lib/timer";
import type { SprintSession } from "./src/lib/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

let currentSession: SprintSession = structuredClone(mockSprintSession);

function getAuthoritativeSessionSnapshot() {
  const now = new Date().toISOString();
  currentSession = {
    ...currentSession,
    timer: getCurrentTimerState(currentSession.timer, now),
  };

  return currentSession;
}

function applyAndBroadcast(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  event: LiveSprintEvent,
) {
  getAuthoritativeSessionSnapshot();
  currentSession = reduceSprintSession(currentSession, event);
  io.emit("session:event", { event, session: currentSession });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown realtime error.";
}

function acknowledgeError(
  ack: ((response: RealtimeCommandAck) => void) | undefined,
  error: unknown,
) {
  ack?.({ ok: false, error: getErrorMessage(error) });
}

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer(handle);
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.emit("session:snapshot", getAuthoritativeSessionSnapshot());

    socket.on("session:join", (payload, ack?: (response: JoinSessionAck) => void) => {
      try {
        if (socket.data.userId) {
          ack?.({
            ok: true,
            userId: socket.data.userId,
            session: getAuthoritativeSessionSnapshot(),
          });
          return;
        }

        const occurredAt = new Date().toISOString();
        const user = createJoinedUser(payload, occurredAt);
        socket.data.userId = user.id;

        const event: LiveSprintEvent = {
          id: createEventId("event-user-joined"),
          type: "user.joined",
          actorId: user.id,
          occurredAt,
          user,
        };

        applyAndBroadcast(io, event);
        ack?.({ ok: true, userId: user.id, session: currentSession });
      } catch (error) {
        const message = getErrorMessage(error);
        socket.emit("session:error", {
          code: "JOIN_FAILED",
          message,
        });
        ack?.({ ok: false, error: message });
      }
    });

    socket.on("session:leave", (ack?: (response: RealtimeCommandAck) => void) => {
      const userId = socket.data.userId;

      if (!userId) {
        ack?.({ ok: true });
        return;
      }

      const event: LiveSprintEvent = {
        id: createEventId("event-user-left"),
        type: "user.left",
        actorId: userId,
        occurredAt: new Date().toISOString(),
        userId,
      };

      socket.data.userId = undefined;
      applyAndBroadcast(io, event);
      ack?.({ ok: true });
    });

    socket.on("task:create", (payload, ack) => {
      try {
        const event = createTaskCreatedEvent(
          currentSession,
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TASK_CREATE",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("task:update", (payload, ack) => {
      try {
        const event = createTaskUpdatedEvent(
          currentSession,
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TASK_UPDATE",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("task:assign", (payload, ack) => {
      try {
        const event = createAssignTaskEvent(
          currentSession,
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TASK_ASSIGN",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("task:update-status", (payload, ack) => {
      try {
        const event = createTaskStatusEvent(
          currentSession,
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TASK_STATUS",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("task:block", (payload, ack) => {
      try {
        const event = createBlockedTaskEvent(
          currentSession,
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TASK_BLOCK",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("task:complete", (payload, ack) => {
      try {
        const event = createDoneTaskEvent(
          currentSession,
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TASK_COMPLETE",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("phase:change", (payload, ack) => {
      try {
        const event = createPhaseChangedEvent(
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_PHASE_CHANGE",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("timer:start", (ack) => {
      try {
        const event = createTimerStartedEvent(
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TIMER_START",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("timer:pause", (ack) => {
      try {
        const event = createTimerPausedEvent(
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TIMER_PAUSE",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("timer:reset", (payload, ack) => {
      try {
        const event = createTimerResetEvent(
          payload,
          socket.data.userId,
          new Date().toISOString(),
        );
        applyAndBroadcast(io, event);
        ack?.({ ok: true });
      } catch (error) {
        socket.emit("session:error", {
          code: "INVALID_TIMER_RESET",
          message: getErrorMessage(error),
        });
        acknowledgeError(ack, error);
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;

      if (!userId) {
        return;
      }

      const event: LiveSprintEvent = {
        id: createEventId("event-user-left"),
        type: "user.left",
        actorId: userId,
        occurredAt: new Date().toISOString(),
        userId,
      };

      applyAndBroadcast(io, event);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`LiveSprint realtime server ready on http://${hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
