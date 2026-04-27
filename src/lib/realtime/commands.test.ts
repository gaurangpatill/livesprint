import { describe, expect, it } from "vitest";
import { mockSprintSession } from "@/lib/mock/session";
import {
  createAssignTaskEvent,
  createJoinedUser,
  createTaskStatusEvent,
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
});
