import type { ConflictRisk, SprintSession } from "@/lib/types";

type ConflictRiskPanelProps = {
  session: SprintSession;
};

const riskClasses: Record<ConflictRisk["level"], string> = {
  LOW: "border-emerald-500/30 bg-emerald-500/8 text-emerald-200",
  MEDIUM: "border-amber-500/30 bg-amber-500/8 text-amber-200",
  HIGH: "border-rose-500/50 bg-rose-500/12 text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.12)]",
};

function getTaskTitle(session: SprintSession, taskId: string) {
  return session.tasks.find((task) => task.id === taskId)?.title ?? taskId;
}

function getUserName(session: SprintSession, userId: string) {
  return session.users.find((user) => user.id === userId)?.name ?? userId;
}

export function ConflictRiskPanel({ session }: ConflictRiskPanelProps) {
  const highestRisk = session.conflictRisks[0]?.level ?? "LOW";

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Conflict Risk
          </p>
          <h2 className="mt-3 text-lg font-semibold text-white">
            File overlap signals
          </h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${riskClasses[highestRisk]}`}>
          {session.conflictRisks.length > 0 ? highestRisk : "CLEAR"}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {session.conflictRisks.length > 0 ? (
          session.conflictRisks.map((risk) => (
            <article
              className={`rounded-lg border bg-black/20 p-4 ${
                risk.level === "HIGH" ? "border-rose-500/40" : "border-white/10"
              }`}
              key={risk.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${riskClasses[risk.level]}`}
                >
                  {risk.level}
                </span>
                <span className="rounded bg-white/8 px-2 py-1 font-mono text-[11px] text-zinc-300">
                  {risk.affectedPath}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {risk.explanation}
              </p>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                {risk.suggestedAction}
              </p>

              <div className="mt-4 grid gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Involved tasks
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {risk.involvedTaskIds.map((taskId) => (
                      <span
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-300"
                        key={taskId}
                      >
                        {getTaskTitle(session, taskId)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Involved users
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {risk.involvedUserIds.length > 0 ? (
                      risk.involvedUserIds.map((userId) => (
                        <span
                          className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-300"
                          key={userId}
                        >
                          {getUserName(session, userId)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-zinc-500">
            No active file overlap detected. Risks will appear when active tasks
            touch the same file or module.
          </div>
        )}
      </div>
    </section>
  );
}
