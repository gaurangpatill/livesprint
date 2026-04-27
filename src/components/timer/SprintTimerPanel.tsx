import type { TimerState } from "@/lib/types";

type SprintTimerPanelProps = {
  timer: TimerState;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SprintTimerPanel({ timer }: SprintTimerPanelProps) {
  const progress =
    ((timer.durationSeconds - timer.remainingSeconds) / timer.durationSeconds) * 100;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Sprint Timer
          </p>
          <h2 className="mt-3 text-lg font-semibold text-white">{timer.phase}</h2>
        </div>
        <span className="rounded-full border border-sky-500/30 bg-sky-500/8 px-3 py-1 text-xs font-medium text-sky-200">
          {timer.isRunning ? "Running" : "Paused"}
        </span>
      </div>

      <p className="mt-6 font-mono text-4xl font-semibold text-white">
        {formatDuration(timer.remainingSeconds)}
      </p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-300"
          style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Authoritative timer state is seeded locally for Phase 2.
      </p>
    </section>
  );
}
