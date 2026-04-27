import { describe, expect, it } from "vitest";
import { mockSprintSession } from "@/lib/mock/session";
import {
  createAssignTaskEvent,
  createJoinedUser,
  createTaskCreatedEvent,
  createTaskStatusEvent,
  createTaskUpdatedEvent,
  createTimerResetEvent,
  getInitials,
  normalizeDisplayName,
} from "@/lib/realtime/commands";

describe("realtime command adapters", () => {
  it("normalizes join names and initials", () => {
    expect(normalizeDisplayName("  Ada   Lovelace  ")).toBe("Ada Lovelace");
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });

  it("creates a joined realtime user", () => {
    const user = createJoinedUser(
      { displayName: "Grace Hopper" },
      "2026-04-27T15:00:00.000Z",
    );

    expect(user).toMatchObject({
      name: "Grace Hopper",
      role: "Guest collaborator",
      avatarInitials: "GH",
      presence: "online",
      joinedAt: "2026-04-27T15:00:00.000Z",
    });
  });

  it("maps task status commands to semantic events", () => {
    const event = createTaskStatusEvent(
      mockSprintSession,
      { taskId: "task-live-board", status: "DONE" },
      "user-maya",
      "2026-04-27T15:05:00.000Z",
    );

    expect(event).toMatchObject({
      type: "task.completed",
      actorId: "user-maya",
      taskId: "task-live-board",
    });
  });

  it("creates task.created events with normalized fields", () => {
    const event = createTaskCreatedEvent(
      mockSprintSession,
      {
        title: "  Build task composer  ",
        description: " Adds the board task form. ",
        assigneeId: "user-maya",
        filePaths: [
          "/src/components/sprint/SprintBoard.tsx",
          "src/components/sprint/SprintBoard.tsx",
          "src/lib/realtime/protocol.ts",
        ],
      },
      "user-eli",
      "2026-04-27T15:08:00.000Z",
    );

    expect(event).toMatchObject({
      type: "task.created",
      actorId: "user-eli",
      task: {
        title: "Build task composer",
        description: "Adds the board task form.",
        status: "READY",
        reporterId: "user-eli",
        assigneeId: "user-maya",
        filePaths: [
          "src/components/sprint/SprintBoard.tsx",
          "src/lib/realtime/protocol.ts",
        ],
      },
    });
  });

  it("creates task.updated events for editable task details", () => {
    const event = createTaskUpdatedEvent(
      mockSprintSession,
      {
        taskId: "task-live-board",
        title: "Render live sprint flow",
        description: "Use five workflow columns.",
        filePaths: ["src/components/sprint/SprintBoard.tsx"],
      },
      "user-maya",
      "2026-04-27T15:09:00.000Z",
    );

    expect(event).toMatchObject({
      type: "task.updated",
      actorId: "user-maya",
      taskId: "task-live-board",
      updates: {
        title: "Render live sprint flow",
        description: "Use five workflow columns.",
        filePaths: ["src/components/sprint/SprintBoard.tsx"],
      },
    });
  });

  it("rejects task commands before join", () => {
    expect(() =>
      createAssignTaskEvent(
        mockSprintSession,
        { taskId: "task-live-board", assigneeId: "user-omar" },
        undefined,
        "2026-04-27T15:10:00.000Z",
      ),
    ).toThrow("Join the sprint session");
  });

  it("rejects empty task titles", () => {
    expect(() =>
      createTaskCreatedEvent(
        mockSprintSession,
        { title: "   " },
        "user-eli",
        "2026-04-27T15:11:00.000Z",
      ),
    ).toThrow("Task title is required");
  });

  it("rejects invalid related file paths", () => {
    expect(() =>
      createTaskUpdatedEvent(
        mockSprintSession,
        {
          taskId: "task-live-board",
          filePaths: ["src/components/sprint/SprintBoard.tsx", "../secret.env"],
        },
        "user-maya",
        "2026-04-27T15:12:00.000Z",
      ),
    ).toThrow("Invalid file path");
  });

  it("rejects missing or unknown assignees for assignment commands", () => {
    expect(() =>
      createAssignTaskEvent(
        mockSprintSession,
        { taskId: "task-live-board", assigneeId: "" },
        "user-maya",
        "2026-04-27T15:13:00.000Z",
      ),
    ).toThrow("Assignee does not exist");
  });

  it("rejects invalid editable timer durations", () => {
    expect(() =>
      createTimerResetEvent(
        { durationSeconds: 30 },
        "user-eli",
        "2026-04-27T15:14:00.000Z",
      ),
    ).toThrow("Timer duration must be between 1 and 240 minutes");
  });
});
