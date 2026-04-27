import { formatTaskStatus, getTasksByStatus } from "@/lib/session";
import type { SprintSession, SprintTask, SprintUser, TaskStatus } from "@/lib/types";

const visibleStatuses: TaskStatus[] = [
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
];

type SprintBoardProps = {
  session: SprintSession;
  canEdit?: boolean;
  onAssignTask?: (taskId: string, assigneeId: string) => Promise<void>;
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => Promise<void>;
  onBlockTask?: (taskId: string) => Promise<void>;
  onCompleteTask?: (taskId: string) => Promise<void>;
};

function getUserName(users: SprintUser[], userId?: string) {
  return users.find((user) => user.id === userId)?.name ?? "Unassigned";
}

function TaskCard({
  task,
  users,
  canEdit,
  onAssignTask,
  onUpdateTaskStatus,
  onBlockTask,
  onCompleteTask,
}: {
  task: SprintTask;
  users: SprintUser[];
  canEdit?: boolean;
  onAssignTask?: (taskId: string, assigneeId: string) => Promise<void>;
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => Promise<void>;
  onBlockTask?: (taskId: string) => Promise<void>;
  onCompleteTask?: (taskId: string) => Promise<void>;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#11131b] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-5 text-white">
          {task.title}
        </h3>
        <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
          {getUserName(users, task.assigneeId)}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-400">
        {task.description}
      </p>
      {task.filePaths.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {task.filePaths.slice(0, 2).map((path) => (
            <span
              className="rounded border border-cyan-400/20 bg-cyan-400/8 px-2 py-1 font-mono text-[11px] text-cyan-100"
              key={path}
            >
              {path}
            </span>
          ))}
          {task.filePaths.length > 2 ? (
            <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-400">
              +{task.filePaths.length - 2}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
        <select
          aria-label={`Assign ${task.title}`}
          className="h-9 rounded border border-white/10 bg-black/30 px-2 text-xs text-zinc-200 outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canEdit}
          value={task.assigneeId ?? ""}
          onChange={(event) => {
            if (event.target.value) {
              void onAssignTask?.(task.id, event.target.value).catch(() => {
                // The realtime hook owns the user-facing error state.
              });
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
        <select
          aria-label={`Update status for ${task.title}`}
          className="h-9 rounded border border-white/10 bg-black/30 px-2 text-xs text-zinc-200 outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canEdit}
          value={task.status}
          onChange={(event) => {
            void onUpdateTaskStatus?.(
              task.id,
              event.target.value as TaskStatus,
            ).catch(() => {
              // The realtime hook owns the user-facing error state.
            });
          }}
        >
          {visibleStatuses.map((status) => (
            <option key={status} value={status}>
              {formatTaskStatus(status)}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="h-9 rounded border border-amber-400/30 bg-amber-400/8 text-xs font-medium text-amber-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || task.status === "BLOCKED"}
            type="button"
            onClick={() =>
              void onBlockTask?.(task.id).catch(() => {
                // The realtime hook owns the user-facing error state.
              })
            }
          >
            Block
          </button>
          <button
            className="h-9 rounded border border-emerald-400/30 bg-emerald-400/8 text-xs font-medium text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || task.status === "DONE"}
            type="button"
            onClick={() =>
              void onCompleteTask?.(task.id).catch(() => {
                // The realtime hook owns the user-facing error state.
              })
            }
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
  onAssignTask,
  onUpdateTaskStatus,
  onBlockTask,
  onCompleteTask,
}: SprintBoardProps) {
  const tasksByStatus = getTasksByStatus(session);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Sprint Board
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">
            {session.name}
          </h2>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-200">
          {session.tasks.length} tasks
        </span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {visibleStatuses.map((status) => (
          <div
            className="min-h-44 rounded-lg border border-white/8 bg-black/20 p-3"
            key={status}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {formatTaskStatus(status)}
              </h3>
              <span className="text-xs text-zinc-500">
                {tasksByStatus[status].length}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {tasksByStatus[status].map((task) => (
                <TaskCard
                  canEdit={canEdit}
                  key={task.id}
                  onAssignTask={onAssignTask}
                  onBlockTask={onBlockTask}
                  onCompleteTask={onCompleteTask}
                  onUpdateTaskStatus={onUpdateTaskStatus}
                  task={task}
                  users={session.users}
                />
              ))}
              {tasksByStatus[status].length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 p-4 text-xs text-zinc-500">
                  No tasks in this lane.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
