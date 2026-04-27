"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ConnectionStatus,
  JoinSessionAck,
  RealtimeCommandAck,
  ServerToClientEvents,
  TaskAssignPayload,
  TaskBlockedPayload,
  TaskCreatePayload,
  TaskDonePayload,
  TaskStatusPayload,
  TaskUpdatePayload,
} from "@/lib/realtime/protocol";
import type { SprintSession, TaskStatus } from "@/lib/types";

type LiveSprintSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type UseLiveSprintSessionOptions = {
  initialSession: SprintSession;
};

type CommandEmitter<TPayload> = (
  payload: TPayload,
  ack?: (response: RealtimeCommandAck) => void,
) => void;

export function useLiveSprintSession({
  initialSession,
}: UseLiveSprintSessionOptions) {
  const socketRef = useRef<LiveSprintSocket | null>(null);
  const [session, setSession] = useState(initialSession);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [joinedUserId, setJoinedUserId] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const socket: LiveSprintSocket = io({
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      setError(undefined);
    });

    socket.io.on("reconnect_attempt", () => {
      setStatus("reconnecting");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
      setJoinedUserId(undefined);
    });

    socket.on("connect_error", () => {
      setStatus("error");
      setError("Could not connect to the LiveSprint realtime server.");
    });

    socket.on("session:snapshot", (nextSession) => {
      setSession(nextSession);
    });

    socket.on("session:event", ({ session: nextSession }) => {
      setSession(nextSession);
    });

    socket.on("session:error", (payload) => {
      setError(payload.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emitCommand = useCallback(
    <TPayload,>(
      eventName: keyof Pick<
        ClientToServerEvents,
        "task:assign" | "task:update-status" | "task:block" | "task:complete"
        | "task:create" | "task:update"
      >,
      payload: TPayload,
      emit: CommandEmitter<TPayload>,
    ) => {
      const socket = socketRef.current;

      if (!socket?.connected) {
        const message = "Realtime server is disconnected.";
        setError(message);
        return Promise.reject(new Error(message));
      }

      return new Promise<void>((resolve, reject) => {
        emit(payload, (response) => {
          if (response.ok) {
            setError(undefined);
            resolve();
            return;
          }

          const message = response.error ?? `Command failed: ${eventName}`;
          setError(message);
          reject(new Error(message));
        });
      });
    },
    [],
  );

  const joinSession = useCallback((displayName: string) => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      const message = "Realtime server is disconnected.";
      setError(message);
      return Promise.reject(new Error(message));
    }

    return new Promise<JoinSessionAck>((resolve, reject) => {
      socket.emit("session:join", { displayName }, (response) => {
        if (response.ok) {
          setJoinedUserId(response.userId);
          if (response.session) {
            setSession(response.session);
          }
          setError(undefined);
          resolve(response);
          return;
        }

        const message = response.error ?? "Could not join the sprint session.";
        setError(message);
        reject(new Error(message));
      });
    });
  }, []);

  const leaveSession = useCallback(() => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      setJoinedUserId(undefined);
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit("session:leave", (response) => {
        if (response.ok) {
          setJoinedUserId(undefined);
          resolve();
          return;
        }

        const message = response.error ?? "Could not leave the sprint session.";
        setError(message);
        reject(new Error(message));
      });
    });
  }, []);

  const assignTask = useCallback(
    (payload: TaskAssignPayload) => {
      const socket = socketRef.current;
      return emitCommand("task:assign", payload, (body, ack) =>
        socket?.emit("task:assign", body, ack),
      );
    },
    [emitCommand],
  );

  const createTask = useCallback(
    (payload: TaskCreatePayload) => {
      const socket = socketRef.current;
      return emitCommand("task:create", payload, (body, ack) =>
        socket?.emit("task:create", body, ack),
      );
    },
    [emitCommand],
  );

  const updateTask = useCallback(
    (payload: TaskUpdatePayload) => {
      const socket = socketRef.current;
      return emitCommand("task:update", payload, (body, ack) =>
        socket?.emit("task:update", body, ack),
      );
    },
    [emitCommand],
  );

  const updateTaskStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      const socket = socketRef.current;
      const payload: TaskStatusPayload = { taskId, status };

      return emitCommand("task:update-status", payload, (body, ack) =>
        socket?.emit("task:update-status", body, ack),
      );
    },
    [emitCommand],
  );

  const blockTask = useCallback(
    (payload: TaskBlockedPayload) => {
      const socket = socketRef.current;
      return emitCommand("task:block", payload, (body, ack) =>
        socket?.emit("task:block", body, ack),
      );
    },
    [emitCommand],
  );

  const completeTask = useCallback(
    (payload: TaskDonePayload) => {
      const socket = socketRef.current;
      return emitCommand("task:complete", payload, (body, ack) =>
        socket?.emit("task:complete", body, ack),
      );
    },
    [emitCommand],
  );

  return {
    session,
    status,
    error,
    joinedUserId,
    isJoined: Boolean(joinedUserId),
    joinSession,
    leaveSession,
    createTask,
    updateTask,
    assignTask,
    updateTaskStatus,
    blockTask,
    completeTask,
    clearError: () => setError(undefined),
  };
}
