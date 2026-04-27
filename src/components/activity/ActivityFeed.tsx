import type { SprintSession } from "@/lib/types";

type ActivityFeedProps = {
  session: SprintSession;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ActivityFeed({ session }: ActivityFeedProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Activity Feed
      </p>
      <h2 className="mt-3 text-lg font-semibold text-white">
        Latest sprint events
      </h2>

      <div className="mt-5 space-y-4">
        {session.activity.map((event) => (
          <div className="border-b border-white/8 pb-4 last:border-b-0" key={event.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="rounded bg-white/8 px-2 py-1 font-mono text-[11px] text-zinc-300">
                {event.type}
              </span>
              <time className="text-xs text-zinc-500" dateTime={event.createdAt}>
                {formatTime(event.createdAt)}
              </time>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{event.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
