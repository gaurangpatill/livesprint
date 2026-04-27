"use client";

import { useState, type FormEvent } from "react";
import type {
  MockCommitPayload,
  MockPullRequestPayload,
} from "@/lib/github/types";
import { normalizeFilePaths } from "@/lib/tasks/filePaths";
import type { PullRequestStatus, SprintSession } from "@/lib/types";

type MockGithubEventsPanelProps = {
  session: SprintSession;
  canEdit?: boolean;
  onSimulateCommit?: (payload: MockCommitPayload) => Promise<void>;
  onSimulatePullRequest?: (payload: MockPullRequestPayload) => Promise<void>;
};

function filesToText(files: string[]) {
  return files.join("\n");
}

export function MockGithubEventsPanel({
  session,
  canEdit,
  onSimulateCommit,
  onSimulatePullRequest,
}: MockGithubEventsPanelProps) {
  const firstTaskId = session.tasks[0]?.id ?? "";
  const [taskId, setTaskId] = useState(firstTaskId);
  const [message, setMessage] = useState("Implement realtime workflow update");
  const [filesChanged, setFilesChanged] = useState(
    "src/lib/session/index.ts\nsrc/components/sprint/SprintBoard.tsx",
  );
  const [prTitle, setPrTitle] = useState("Review sprint orchestration changes");
  const [prStatus, setPrStatus] = useState<PullRequestStatus>("OPENED");
  const [isPending, setIsPending] = useState(false);

  async function runAction(action: () => Promise<void> | undefined) {
    setIsPending(true);
    try {
      await action();
    } finally {
      setIsPending(false);
    }
  }

  function getPayloadFiles() {
    return normalizeFilePaths(filesChanged);
  }

  function handleCommit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void runAction(() =>
      onSimulateCommit?.({
        taskId,
        message,
        filesChanged: getPayloadFiles(),
      }),
    );
  }

  function handlePullRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void runAction(() =>
      onSimulatePullRequest?.({
        taskId,
        title: prTitle,
        status: prStatus,
        filesChanged: getPayloadFiles(),
      }),
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Mock GitHub Events
          </p>
          <h2 className="mt-3 text-lg font-semibold text-white">
            Developer workflow signals
          </h2>
        </div>
        <span className="rounded-full border border-sky-500/30 bg-sky-500/8 px-3 py-1 text-xs font-medium text-sky-200">
          Mock
        </span>
      </div>

      <form className="mt-5 grid gap-3" onSubmit={handleCommit}>
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Linked task
          </span>
          <select
            className="h-10 rounded border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending}
            onChange={(event) => setTaskId(event.target.value)}
            value={taskId}
          >
            {session.tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Commit message
          </span>
          <input
            className="h-10 rounded border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending}
            onChange={(event) => setMessage(event.target.value)}
            value={message}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Files changed
          </span>
          <textarea
            className="min-h-20 resize-none rounded border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending}
            onChange={(event) => setFilesChanged(event.target.value)}
            value={filesChanged}
          />
        </label>

        <button
          className="h-10 rounded bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canEdit || isPending || !taskId || !message.trim()}
          type="submit"
        >
          {isPending ? "Sending..." : "Simulate commit pushed"}
        </button>
      </form>

      <form
        className="mt-4 grid gap-3 border-t border-white/10 pt-4"
        onSubmit={handlePullRequest}
      >
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Pull request title
          </span>
          <input
            className="h-10 rounded border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending}
            onChange={(event) => setPrTitle(event.target.value)}
            value={prTitle}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          {(["OPENED", "MERGED"] as PullRequestStatus[]).map((status) => (
            <button
              className={`h-10 rounded border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                prStatus === status
                  ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                  : "border-white/10 bg-white/8 text-zinc-200 hover:bg-white/12"
              }`}
              disabled={!canEdit || isPending}
              key={status}
              type="button"
              onClick={() => setPrStatus(status)}
            >
              PR {status.toLowerCase()}
            </button>
          ))}
        </div>

        <button
          className="h-10 rounded border border-white/10 bg-white/8 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canEdit || isPending || !taskId || !prTitle.trim()}
          type="submit"
        >
          {isPending ? "Sending..." : "Simulate pull request"}
        </button>
      </form>

      <div className="mt-5 space-y-4">
        {session.commits.slice(0, 3).map((commit) => (
          <article
            className="rounded-lg border border-white/10 bg-black/20 p-4"
            key={commit.id}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold text-cyan-200">
                {commit.sha}
              </span>
              <span className="rounded bg-white/8 px-2 py-1 text-[11px] text-zinc-300">
                {commit.filesChanged.length} files
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {commit.message}
            </p>
          </article>
        ))}
        {session.pullRequests.slice(0, 3).map((pullRequest) => (
          <article
            className="rounded-lg border border-white/10 bg-black/20 p-4"
            key={pullRequest.id}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">
                {pullRequest.title}
              </span>
              <span className="rounded bg-white/8 px-2 py-1 text-[11px] text-zinc-300">
                {pullRequest.status}
              </span>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              {filesToText(pullRequest.filesChanged)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
