import type { LiveSprintEvent } from "@/lib/events";
import type { MockCommitPayload, MockPullRequestPayload } from "@/lib/github/types";
import { normalizeFilePaths, validateFilePaths } from "@/lib/tasks/filePaths";
import type { SprintSession } from "@/lib/types";

function ensureTaskExists(session: SprintSession, taskId: string) {
  if (!session.tasks.some((task) => task.id === taskId)) {
    throw new Error("Linked task does not exist.");
  }
}

function ensureAuthorId(actorId: string | undefined, authorId: string | undefined) {
  const resolvedAuthorId = authorId || actorId;

  if (!resolvedAuthorId) {
    throw new Error("Join the sprint session before simulating GitHub events.");
  }

  return resolvedAuthorId;
}

function ensureMessage(value: string, label: string) {
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, 160);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function ensureChangedFiles(filesChanged: string[]) {
  validateFilePaths(filesChanged);

  const normalizedFiles = normalizeFilePaths(filesChanged);

  if (normalizedFiles.length === 0) {
    throw new Error("At least one changed file is required.");
  }

  return normalizedFiles;
}

function createGitEventId(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

function createSha() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 7);
}

export function createMockCommitLinkedEvent(
  session: SprintSession,
  payload: MockCommitPayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureTaskExists(session, payload.taskId);
  const authorId = ensureAuthorId(actorId, payload.authorId);

  return {
    id: createGitEventId("event-commit-linked"),
    type: "commit.linked",
    actorId: authorId,
    occurredAt,
    commit: {
      id: createGitEventId("commit"),
      taskId: payload.taskId,
      authorId,
      sha: createSha(),
      message: ensureMessage(payload.message, "Commit message"),
      branch: `mock/${payload.taskId}`,
      filesChanged: ensureChangedFiles(payload.filesChanged),
      committedAt: occurredAt,
    },
  };
}

export function createMockPullRequestEvent(
  session: SprintSession,
  payload: MockPullRequestPayload,
  actorId: string | undefined,
  occurredAt: string,
): LiveSprintEvent {
  ensureTaskExists(session, payload.taskId);
  const authorId = ensureAuthorId(actorId, payload.authorId);
  const status = payload.status;

  return {
    id: createGitEventId(
      status === "OPENED" ? "event-pr-opened" : "event-pr-merged",
    ),
    type: status === "OPENED" ? "pull_request.opened" : "pull_request.merged",
    actorId: authorId,
    occurredAt,
    pullRequest: {
      id: createGitEventId("pr"),
      taskId: payload.taskId,
      authorId,
      title: ensureMessage(payload.title, "Pull request title"),
      status,
      filesChanged: ensureChangedFiles(payload.filesChanged),
      timestamp: occurredAt,
    },
  };
}
