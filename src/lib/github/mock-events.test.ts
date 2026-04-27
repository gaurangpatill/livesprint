import { describe, expect, it } from "vitest";
import {
  createMockCommitLinkedEvent,
  createMockPullRequestEvent,
} from "@/lib/github/mock-events";
import { mockSprintSession } from "@/lib/mock/session";

describe("mock GitHub event adapter", () => {
  it("creates commit.linked events for linked tasks", () => {
    const event = createMockCommitLinkedEvent(
      mockSprintSession,
      {
        taskId: "task-live-board",
        message: " Update sprint board ",
        filesChanged: [
          "/src/components/sprint/SprintBoard.tsx",
          "src/components/sprint/SprintBoard.tsx",
        ],
      },
      "user-maya",
      "2026-04-27T19:00:00.000Z",
    );

    expect(event).toMatchObject({
      type: "commit.linked",
      actorId: "user-maya",
      commit: {
        taskId: "task-live-board",
        authorId: "user-maya",
        message: "Update sprint board",
        filesChanged: ["src/components/sprint/SprintBoard.tsx"],
        committedAt: "2026-04-27T19:00:00.000Z",
      },
    });
  });

  it("creates pull_request.opened events", () => {
    const event = createMockPullRequestEvent(
      mockSprintSession,
      {
        taskId: "task-live-board",
        title: " Open board updates ",
        status: "OPENED",
        filesChanged: ["src/components/sprint/SprintBoard.tsx"],
      },
      "user-maya",
      "2026-04-27T19:05:00.000Z",
    );

    expect(event).toMatchObject({
      type: "pull_request.opened",
      actorId: "user-maya",
      pullRequest: {
        taskId: "task-live-board",
        authorId: "user-maya",
        title: "Open board updates",
        status: "OPENED",
      },
    });
  });

  it("creates pull_request.merged events", () => {
    const event = createMockPullRequestEvent(
      mockSprintSession,
      {
        taskId: "task-live-board",
        title: "Merge board updates",
        status: "MERGED",
        filesChanged: ["src/components/sprint/SprintBoard.tsx"],
      },
      "user-maya",
      "2026-04-27T19:10:00.000Z",
    );

    expect(event).toMatchObject({
      type: "pull_request.merged",
      pullRequest: {
        status: "MERGED",
      },
    });
  });
});
