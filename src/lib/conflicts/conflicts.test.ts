import { describe, expect, it } from "vitest";
import {
  detectConflictRisks,
  getNewSignificantRisks,
} from "@/lib/conflicts";
import type { SprintTask } from "@/lib/types";

function task(overrides: Partial<SprintTask>): SprintTask {
  return {
    id: "task-default",
    title: "Default task",
    description: "",
    status: "IN_PROGRESS",
    reporterId: "user-a",
    assigneeId: "user-a",
    filePaths: [],
    createdAt: "2026-04-27T18:00:00.000Z",
    updatedAt: "2026-04-27T18:00:00.000Z",
    ...overrides,
  };
}

describe("detectConflictRisks", () => {
  const now = "2026-04-27T18:30:00.000Z";

  it("returns no risk for unrelated active tasks", () => {
    const risks = detectConflictRisks(
      [
        task({
          id: "task-a",
          assigneeId: "user-a",
          filePaths: ["src/app/page.tsx"],
        }),
        task({
          id: "task-b",
          assigneeId: "user-b",
          filePaths: ["server.ts"],
        }),
      ],
      now,
    );

    expect(risks).toEqual([]);
  });

  it("returns LOW risk for one active task touching a file", () => {
    const risks = detectConflictRisks(
      [
        task({
          id: "task-a",
          assigneeId: "user-a",
          filePaths: ["src/app/page.tsx"],
        }),
      ],
      now,
    );

    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({
      level: "LOW",
      affectedPath: "src/app/page.tsx",
      involvedTaskIds: ["task-a"],
      involvedUserIds: ["user-a"],
    });
  });

  it("returns MEDIUM risk for active tasks in the same directory", () => {
    const risks = detectConflictRisks(
      [
        task({
          id: "task-a",
          assigneeId: "user-a",
          filePaths: ["src/components/sprint/SprintBoard.tsx"],
        }),
        task({
          id: "task-b",
          assigneeId: "user-b",
          filePaths: ["src/components/sprint/TaskCard.tsx"],
        }),
      ],
      now,
    );

    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({
      level: "MEDIUM",
      affectedPath: "src/components/sprint",
      involvedTaskIds: ["task-a", "task-b"],
      involvedUserIds: ["user-a", "user-b"],
    });
  });

  it("returns HIGH risk for active tasks touching the exact same file", () => {
    const risks = detectConflictRisks(
      [
        task({
          id: "task-a",
          assigneeId: "user-a",
          filePaths: ["src/lib/session/index.ts"],
        }),
        task({
          id: "task-b",
          assigneeId: "user-b",
          filePaths: ["src/lib/session/index.ts"],
        }),
      ],
      now,
    );

    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({
      level: "HIGH",
      affectedPath: "src/lib/session/index.ts",
      involvedTaskIds: ["task-a", "task-b"],
      involvedUserIds: ["user-a", "user-b"],
    });
  });

  it("resolves risk when a task leaves ACTIVE", () => {
    const risks = detectConflictRisks(
      [
        task({
          id: "task-a",
          assigneeId: "user-a",
          filePaths: ["src/lib/session/index.ts"],
        }),
        task({
          id: "task-b",
          assigneeId: "user-b",
          status: "DONE",
          filePaths: ["src/lib/session/index.ts"],
        }),
      ],
      now,
    );

    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({
      level: "LOW",
      involvedTaskIds: ["task-a"],
    });
  });

  it("prevents duplicate significant risk activity for unchanged risks", () => {
    const previousRisks = detectConflictRisks(
      [
        task({
          id: "task-a",
          assigneeId: "user-a",
          filePaths: ["src/lib/session/index.ts"],
        }),
        task({
          id: "task-b",
          assigneeId: "user-b",
          filePaths: ["src/lib/session/index.ts"],
        }),
      ],
      now,
    );
    const nextRisks = detectConflictRisks(
      [
        task({
          id: "task-a",
          assigneeId: "user-a",
          filePaths: ["src/lib/session/index.ts"],
        }),
        task({
          id: "task-b",
          assigneeId: "user-b",
          filePaths: ["src/lib/session/index.ts"],
        }),
      ],
      "2026-04-27T18:35:00.000Z",
      previousRisks,
    );

    expect(getNewSignificantRisks(previousRisks, nextRisks)).toEqual([]);
  });
});
