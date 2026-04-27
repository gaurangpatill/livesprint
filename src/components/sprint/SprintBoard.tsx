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
};

function getUserName(users: SprintUser[], userId?: string) {
  return users.find((user) => user.id === userId)?.name ?? "Unassigned";
}

function TaskCard({ task, users }: { task: SprintTask; users: SprintUser[] }) {
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
    </article>
  );
}

export function SprintBoard({ session }: SprintBoardProps) {
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
                <TaskCard key={task.id} task={task} users={session.users} />
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
