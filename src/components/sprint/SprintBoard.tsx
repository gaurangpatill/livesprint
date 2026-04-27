"use client";

import { useState, type FormEvent } from "react";
import { formatTaskStatus } from "@/lib/session";
import { getInvalidFilePaths, normalizeFilePaths } from "@/lib/tasks/filePaths";
import type { SprintSession, SprintTask, SprintUser, TaskStatus } from "@/lib/types";

const taskStatuses: TaskStatus[] = [
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "BLOCKED",
  "IN_REVIEW",
  "DONE",
];

const workflowColumns: Array<{
  id: string;
  label: string;
  statuses: TaskStatus[];
}> = [
  { id: "todo", label: "TODO", statuses: ["BACKLOG", "READY"] },
  { id: "active", label: "ACTIVE", statuses: ["IN_PROGRESS"] },
  { id: "blocked", label: "BLOCKED", statuses: ["BLOCKED"] },
  { id: "review", label: "REVIEW", statuses: ["IN_REVIEW"] },
  { id: "done", label: "DONE", statuses: ["DONE"] },
];

type SprintBoardProps = {
  session: SprintSession;
  canEdit?: boolean;
  onCreateTask?: (payload: {
    title: string;
    description?: string;
    assigneeId?: string;
    filePaths?: string[];
  }) => Promise<void>;
  onUpdateTask?: (payload: {
    taskId: string;
    title?: string;
    description?: string;
    assigneeId?: string;
    filePaths?: string[];
  }) => Promise<void>;
  onAssignTask?: (taskId: string, assigneeId: string) => Promise<void>;
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => Promise<void>;
  onBlockTask?: (taskId: string) => Promise<void>;
  onCompleteTask?: (taskId: string) => Promise<void>;
};

const inputClassName =
  "w-full rounded-md border border-white/10 bg-[#0d0f16] px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50";

function getUserName(users: SprintUser[], userId?: string) {
  return users.find((user) => user.id === userId)?.name ?? "Unassigned";
}

function getColumnTasks(tasks: SprintTask[], statuses: TaskStatus[]) {
  return tasks.filter((task) => statuses.includes(task.status));
}

function filePathsToText(filePaths: string[]) {
  return filePaths.join("\n");
}

function getFilePathError(filePaths: string) {
  const invalidPath = getInvalidFilePaths(filePaths)[0];

  return invalidPath
    ? `Invalid path: ${invalidPath}. Use repo-relative paths like src/app/page.tsx.`
    : undefined;
}

function TaskCreateForm({
  users,
  canEdit,
  onCreateTask,
}: {
  users: SprintUser[];
  canEdit?: boolean;
  onCreateTask?: SprintBoardProps["onCreateTask"];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [filePaths, setFilePaths] = useState("");
  const [isPending, setIsPending] = useState(false);
  const filePathError = getFilePathError(filePaths);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onCreateTask || !title.trim() || filePathError) {
      return;
    }

    setIsPending(true);
    try {
      await onCreateTask({
        title,
        description,
        assigneeId: assigneeId || undefined,
        filePaths: normalizeFilePaths(filePaths),
      });
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setFilePaths("");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      className="mt-5 grid gap-4 rounded-lg border border-white/10 bg-black/20 p-4 xl:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3">
        <input
          className={`${inputClassName} h-11`}
          disabled={!canEdit || isPending}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New task title"
          value={title}
        />
        <textarea
          className={`${inputClassName} min-h-20 resize-none py-2`}
          disabled={!canEdit || isPending}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          value={description}
        />
      </div>
      <div className="grid gap-3">
        <select
          className={`${inputClassName} h-11 text-zinc-200`}
          disabled={!canEdit || isPending}
          onChange={(event) => setAssigneeId(event.target.value)}
          value={assigneeId}
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <textarea
          className={`${inputClassName} min-h-20 resize-none py-2 font-mono text-xs`}
          disabled={!canEdit || isPending}
          onChange={(event) => setFilePaths(event.target.value)}
          placeholder="Related files, one per line"
          value={filePaths}
        />
        {filePathError ? (
          <p className="text-xs leading-5 text-rose-200">{filePathError}</p>
        ) : (
          <p className="text-xs leading-5 text-zinc-500">
            Optional repo-relative paths make conflict risk detection useful.
          </p>
        )}
        <button
          className="h-11 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canEdit || isPending || !title.trim() || Boolean(filePathError)}
          type="submit"
        >
          {isPending ? "Creating..." : "Create task"}
        </button>
      </div>
    </form>
  );
}

function TaskCard({
  task,
  users,
  canEdit,
  onAssignTask,
  onUpdateTask,
  onUpdateTaskStatus,
  onBlockTask,
  onCompleteTask,
}: {
  task: SprintTask;
  users: SprintUser[];
  canEdit?: boolean;
  onAssignTask?: (taskId: string, assigneeId: string) => Promise<void>;
  onUpdateTask?: SprintBoardProps["onUpdateTask"];
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => Promise<void>;
  onBlockTask?: (taskId: string) => Promise<void>;
  onCompleteTask?: (taskId: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [filePaths, setFilePaths] = useState(filePathsToText(task.filePaths));
  const filePathError = getFilePathError(filePaths);

  async function runTaskAction(action: () => Promise<void> | undefined) {
    setIsPending(true);
    try {
      await action();
    } finally {
      setIsPending(false);
    }
  }

  async function saveTaskDetails() {
    if (!onUpdateTask || filePathError) {
      return;
    }

    await runTaskAction(async () => {
      await onUpdateTask({
        taskId: task.id,
        title,
        description,
        filePaths: normalizeFilePaths(filePaths),
      });
      setIsEditing(false);
    });
  }

  return (
    <article className="rounded-lg border border-white/10 bg-[#11131b] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {formatTaskStatus(task.status)}
          </p>
          <h3 className="mt-2 break-words text-base font-semibold leading-6 text-white">
            {task.title}
          </h3>
        </div>
        <span className="max-w-28 shrink-0 truncate rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
          {getUserName(users, task.assigneeId)}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
        {task.description || "No description provided."}
      </p>

      <div className="mt-4 grid gap-2">
        {task.filePaths.length > 0 ? (
          task.filePaths.map((path) => (
            <span
              className="block max-w-full truncate rounded border border-cyan-400/20 bg-cyan-400/8 px-2 py-1 font-mono text-[11px] text-cyan-100"
              key={path}
              title={path}
            >
              {path}
            </span>
          ))
        ) : (
          <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-500">
            No related files
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="mt-4 grid gap-3 rounded-md border border-white/10 bg-black/20 p-3">
          <input
            className={`${inputClassName} h-10`}
            disabled={isPending}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
          <textarea
            className={`${inputClassName} min-h-20 resize-none py-2`}
            disabled={isPending}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          <textarea
            className={`${inputClassName} min-h-20 resize-none py-2 font-mono text-xs`}
            disabled={isPending}
            onChange={(event) => setFilePaths(event.target.value)}
            value={filePaths}
          />
          {filePathError ? (
            <p className="text-xs leading-5 text-rose-200">{filePathError}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="h-10 rounded-md border border-white/10 bg-white/8 text-sm font-medium text-zinc-200 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
              type="button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-md bg-cyan-300 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending || !title.trim() || Boolean(filePathError)}
              type="button"
              onClick={() => void saveTaskDetails().catch(() => undefined)}
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <div className="grid gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Assignee
          </label>
          <select
            aria-label={`Assign ${task.title}`}
            className={`${inputClassName} h-10 text-zinc-200`}
            disabled={!canEdit || isPending}
            value={task.assigneeId ?? ""}
            onChange={(event) => {
              const assigneeId = event.target.value;
              if (assigneeId) {
                void runTaskAction(() => onAssignTask?.(task.id, assigneeId));
              }
            }}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Status
          </label>
          <select
            aria-label={`Update status for ${task.title}`}
            className={`${inputClassName} h-10 text-zinc-200`}
            disabled={!canEdit || isPending}
            value={task.status}
            onChange={(event) => {
              void runTaskAction(() =>
                onUpdateTaskStatus?.(task.id, event.target.value as TaskStatus),
              );
            }}
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {formatTaskStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className="h-10 rounded-md border border-white/10 bg-white/8 px-3 text-sm font-medium text-zinc-200 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending}
            type="button"
            onClick={() => setIsEditing((value) => !value)}
          >
            Edit
          </button>
          <button
            className="h-10 rounded-md border border-cyan-400/30 bg-cyan-400/8 px-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending || task.status === "IN_PROGRESS"}
            type="button"
            onClick={() =>
              void runTaskAction(() =>
                onUpdateTaskStatus?.(task.id, "IN_PROGRESS"),
              )
            }
          >
            Start
          </button>
          <button
            className="h-10 rounded-md border border-sky-400/30 bg-sky-400/8 px-3 text-sm font-medium text-sky-100 transition hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending || task.status === "IN_REVIEW"}
            type="button"
            onClick={() =>
              void runTaskAction(() => onUpdateTaskStatus?.(task.id, "IN_REVIEW"))
            }
          >
            Review
          </button>
          <button
            className="h-10 rounded-md border border-amber-400/30 bg-amber-400/8 px-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending || task.status === "BLOCKED"}
            type="button"
            onClick={() => void runTaskAction(() => onBlockTask?.(task.id))}
          >
            Block
          </button>
          <button
            className="h-10 rounded-md border border-emerald-400/30 bg-emerald-400/8 px-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending || task.status === "DONE"}
            type="button"
            onClick={() => void runTaskAction(() => onCompleteTask?.(task.id))}
          >
            Done
          </button>
        </div>
      </div>
    </article>
  );
}

export function SprintBoard({
  session,
  canEdit,
  onCreateTask,
  onAssignTask,
  onUpdateTask,
  onUpdateTaskStatus,
  onBlockTask,
  onCompleteTask,
}: SprintBoardProps) {
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Sprint Board
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">
            {session.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Create, assign, edit, and move work through the shared sprint flow.
            Every operation is reduced on the server and broadcast to all tabs.
          </p>
        </div>
        <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-200">
          {session.tasks.length} tasks
        </span>
      </div>

      <TaskCreateForm
        canEdit={canEdit}
        onCreateTask={onCreateTask}
        users={session.users}
      />

      <div className="mt-5 overflow-x-auto pb-3">
        <div className="flex min-w-max gap-4">
        {workflowColumns.map((column) => {
          const tasks = getColumnTasks(session.tasks, column.statuses);

          return (
            <div
              className="min-h-44 w-[340px] shrink-0 rounded-lg border border-white/8 bg-black/20 p-3"
              key={column.id}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {column.label}
                </h3>
                <span className="text-xs text-zinc-500">{tasks.length}</span>
              </div>
              <div className="mt-3 space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    canEdit={canEdit}
                    key={`${task.id}-${task.updatedAt}`}
                    onAssignTask={onAssignTask}
                    onBlockTask={onBlockTask}
                    onCompleteTask={onCompleteTask}
                    onUpdateTask={onUpdateTask}
                    onUpdateTaskStatus={onUpdateTaskStatus}
                    task={task}
                    users={session.users}
                  />
                ))}
                {tasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-zinc-500">
                    No tasks in this lane.
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
