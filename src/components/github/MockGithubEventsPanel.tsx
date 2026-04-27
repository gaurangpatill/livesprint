import type { SprintSession } from "@/lib/types";

type MockGithubEventsPanelProps = {
  session: SprintSession;
};

export function MockGithubEventsPanel({ session }: MockGithubEventsPanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Mock GitHub Events
      </p>
      <h2 className="mt-3 text-lg font-semibold text-white">
        Developer workflow signals
      </h2>

      <div className="mt-5 space-y-4">
        {session.commits.map((commit) => (
          <article className="rounded-lg border border-white/10 bg-black/20 p-4" key={commit.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold text-cyan-200">
                {commit.sha}
              </span>
              <span className="rounded bg-white/8 px-2 py-1 text-[11px] text-zinc-300">
                {commit.branch}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {commit.message}
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              {commit.filesChanged.length} files changed
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
