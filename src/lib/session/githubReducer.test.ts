import { describe, expect, it } from "vitest";
import { createMockCommitLinkedEvent, createMockPullRequestEvent } from "@/lib/github/mock-events";
import { mockSprintSession } from "@/lib/mock/session";
import { reduceSprintSession } from "@/lib/session";
import type { SprintSession } from "@/lib/types";

function freshSession(): SprintSession {
  return structuredClone(mockSprintSession);
}

describe("GitHub event reducer integration", () => {
  it("links commit files to the task and appends commit activity", () => {
    const session = freshSession();
    const event = createMockCommitLinkedEvent(
      session,
      {
        taskId: "task-live-board",
        message: "Touch shared board file",
        filesChanged: ["src/components/sprint/SprintBoard.tsx", "src/lib/github/mock-events.ts"],
      },
      "user-maya",
      "2026-04-27T19:15:00.000Z",
    );

    const next = reduceSprintSession(session, event);
    const task = next.tasks.find((item) => item.id === "task-live-board");

    expect(next.commits).toHaveLength(session.commits.length + 1);
    expect(task?.filePaths).toContain("src/lib/github/mock-events.ts");
    expect(next.activity[0].type).toBe("commit.linked");
  });

  it("moves task to review when PR is opened", () => {
    const session = freshSession();
    const event = createMockPullRequestEvent(
      session,
      {
        taskId: "task-live-board",
        title: "Board review",
        status: "OPENED",
        filesChanged: ["src/components/sprint/SprintBoard.tsx"],
      },
      "user-maya",
      "2026-04-27T19:20:00.000Z",
    );

    const next = reduceSprintSession(session, event);

    expect(next.pullRequests).toHaveLength(1);
    expect(next.tasks.find((task) => task.id === "task-live-board")?.status).toBe(
      "IN_REVIEW",
    );
    expect(next.activity[0].type).toBe("pull_request.opened");
  });

  it("moves task to done when PR is merged", () => {
    const session = freshSession();
    const event = createMockPullRequestEvent(
      session,
      {
        taskId: "task-live-board",
        title: "Merge board review",
        status: "MERGED",
        filesChanged: ["src/components/sprint/SprintBoard.tsx"],
      },
      "user-maya",
      "2026-04-27T19:25:00.000Z",
    );

    const next = reduceSprintSession(session, event);

    expect(next.tasks.find((task) => task.id === "task-live-board")?.status).toBe(
      "DONE",
    );
    expect(next.activity[0].type).toBe("pull_request.merged");
  });

  it("feeds commit changed files into conflict detection", () => {
    const session = {
      ...freshSession(),
      tasks: freshSession().tasks.map((task) =>
        task.id === "task-session-reducer"
          ? { ...task, filePaths: ["src/lib/github/mock-events.ts"] }
          : task.id === "task-live-board"
            ? { ...task, filePaths: ["src/components/dashboard/DashboardShell.tsx"] }
            : task,
      ),
      conflictRisks: [],
    };
    const event = createMockCommitLinkedEvent(
      session,
      {
        taskId: "task-live-board",
        message: "Touch Git adapter",
        filesChanged: ["src/lib/github/mock-events.ts"],
      },
      "user-maya",
      "2026-04-27T19:30:00.000Z",
    );

    const next = reduceSprintSession(session, event);

    expect(
      next.conflictRisks.some(
        (risk) =>
          risk.level === "HIGH" &&
          risk.affectedPath === "src/lib/github/mock-events.ts",
      ),
    ).toBe(true);
    expect(next.activity[0].type).toBe("conflict.risk_detected");
  });
});
