import type { SprintSession } from "@/lib/types";

type PresencePanelProps = {
  session: SprintSession;
};

const presenceClasses = {
  online: "bg-emerald-400",
  away: "bg-amber-300",
  offline: "bg-zinc-500",
};

export function PresencePanel({ session }: PresencePanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Presence
      </p>
      <h2 className="mt-3 text-lg font-semibold text-white">Team focus</h2>

      <div className="mt-5 space-y-4">
        {session.users.map((user) => {
          const currentTask = session.tasks.find(
            (task) => task.id === user.currentTaskId,
          );

          return (
            <div className="flex items-start gap-3" key={user.id}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">
                {user.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${presenceClasses[user.presence]}`}
                  />
                  <p className="truncate text-sm font-medium text-white">
                    {user.name}
                  </p>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{user.role}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  {currentTask ? currentTask.title : "No active task"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
