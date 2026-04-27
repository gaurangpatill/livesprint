import { describe, expect, it } from "vitest";
import type { LiveSprintEvent } from "@/lib/events";
import { mockSprintSession } from "@/lib/mock/session";
import { reduceSprintSession } from "@/lib/session";
import type { SprintSession, SprintTask } from "@/lib/types";

function freshSession(): SprintSession {
  return structuredClone(mockSprintSession);
}

function event<T extends LiveSprintEvent>(eventInput: T): T {
  return eventInput;
}

describe("reduceSprintSession", () => {
  it("creates a task and appends activity", () => {
    const session = freshSession();
    const task: SprintTask = {
      id: "task-new-board-filter",
      title: "Add sprint board filters",
      description: "Allow engineers to filter sprint tasks by owner and status.",
      status: "READY",
      reporterId: "user-maya",
      assigneeId: "user-omar",
      filePaths: ["src/components/sprint/SprintBoard.tsx"],
      createdAt: "placeholder",
      updatedAt: "placeholder",
    };

    const next = reduceSprintSession(
      session,
      event({
        id: "event-create-task",
        type: "task.created",
        actorId: "user-maya",
        occurredAt: "2026-04-27T14:00:00.000Z",
        task,
      }),
    );

    expect(next.tasks).toHaveLength(session.tasks.length + 1);
    expect(next.tasks.at(-1)).toMatchObject({
      id: task.id,
      createdAt: "2026-04-27T14:00:00.000Z",
      updatedAt: "2026-04-27T14:00:00.000Z",
    });
    expect(next.activity[0]).toMatchObject({
      type: "task.created",
      taskId: task.id,
    });
  });

  it("updates task status through task.updated", () => {
    const session = freshSession();

    const next = reduceSprintSession(
      session,
      event({
        id: "event-update-task",
        type: "task.updated",
        actorId: "user-eli",
        occurredAt: "2026-04-27T14:05:00.000Z",
        taskId: "task-ws-contract",
        updates: { status: "IN_PROGRESS" },
      }),
    );

    expect(
      next.tasks.find((task) => task.id === "task-ws-contract")?.status,
    ).toBe("IN_PROGRESS");
    expect(
      next.tasks.find((task) => task.id === "task-ws-contract")?.updatedAt,
    ).toBe("2026-04-27T14:05:00.000Z");
  });

  it("assigns a task", () => {
    const session = freshSession();

    const next = reduceSprintSession(
      session,
      event({
        id: "event-assign-task",
        type: "task.assigned",
        actorId: "user-eli",
        occurredAt: "2026-04-27T14:10:00.000Z",
        taskId: "task-conflict-fixtures",
        assigneeId: "user-nina",
      }),
    );

    expect(
      next.tasks.find((task) => task.id === "task-conflict-fixtures")
        ?.assigneeId,
    ).toBe("user-nina");
    expect(next.activity[0].message).toContain("Nina Brooks");
  });

  it("changes the sprint phase and updates timer phase", () => {
    const session = freshSession();

    const next = reduceSprintSession(
      session,
      event({
        id: "event-phase-review",
        type: "phase.changed",
        actorId: "user-eli",
        occurredAt: "2026-04-27T14:15:00.000Z",
        phase: "REVIEW",
      }),
    );

    expect(next.phase).toBe("REVIEW");
    expect(next.timer.phase).toBe("REVIEW");
    expect(next.timer.isRunning).toBe(false);
  });

  it("starts, pauses, and resets the timer", () => {
    const session = freshSession();

    const started = reduceSprintSession(
      session,
      event({
        id: "event-timer-started",
        type: "timer.started",
        actorId: "user-eli",
        occurredAt: "2026-04-27T14:20:00.000Z",
      }),
    );
    const paused = reduceSprintSession(
      started,
      event({
        id: "event-timer-paused",
        type: "timer.paused",
        actorId: "user-eli",
        occurredAt: "2026-04-27T14:25:00.000Z",
      }),
    );
    const reset = reduceSprintSession(
      paused,
      event({
        id: "event-timer-reset",
        type: "timer.reset",
        actorId: "user-eli",
        occurredAt: "2026-04-27T14:30:00.000Z",
      }),
    );

    expect(started.timer).toMatchObject({
      isRunning: true,
      startedAt: "2026-04-27T14:20:00.000Z",
    });
    expect(paused.timer).toMatchObject({
      isRunning: false,
      remainingSeconds: session.timer.remainingSeconds - 300,
      pausedAt: "2026-04-27T14:25:00.000Z",
    });
    expect(reset.timer).toMatchObject({
      isRunning: false,
      remainingSeconds: session.timer.durationSeconds,
      resetAt: "2026-04-27T14:30:00.000Z",
    });
  });

  it("does not mutate the original session state", () => {
    const session = freshSession();
    const original = structuredClone(session);

    const next = reduceSprintSession(
      session,
      event({
        id: "event-immutable",
        type: "task.completed",
        actorId: "user-maya",
        occurredAt: "2026-04-27T14:35:00.000Z",
        taskId: "task-live-board",
      }),
    );

    expect(session).toEqual(original);
    expect(next).not.toBe(session);
    expect(next.tasks).not.toBe(session.tasks);
    expect(
      next.tasks.find((task) => task.id === "task-live-board")?.status,
    ).toBe("DONE");
    expect(
      session.tasks.find((task) => task.id === "task-live-board")?.status,
    ).toBe("IN_PROGRESS");
  });
});
