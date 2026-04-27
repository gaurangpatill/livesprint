import type { SprintSession } from "@/lib/types";

type ConflictRiskPanelProps = {
  session: SprintSession;
};

const riskClasses = {
  LOW: "border-emerald-500/30 bg-emerald-500/8 text-emerald-200",
  MEDIUM: "border-amber-500/30 bg-amber-500/8 text-amber-200",
  HIGH: "border-rose-500/30 bg-rose-500/8 text-rose-200",
};

export function ConflictRiskPanel({ session }: ConflictRiskPanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Conflict Risk
      </p>
      <h2 className="mt-3 text-lg font-semibold text-white">File overlap signals</h2>

      <div className="mt-5 space-y-4">
        {session.conflictRisks.map((risk) => (
          <article className="rounded-lg border border-white/10 bg-black/20 p-4" key={risk.id}>
            <div className="flex items-center justify-between gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${riskClasses[risk.level]}`}
              >
                {risk.level}
              </span>
              <span className="text-xs text-zinc-500">
                {risk.taskIds.length} tasks
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {risk.explanation}
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {risk.suggestedAction}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
