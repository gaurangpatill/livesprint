"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateRemainingSeconds,
  formatTimerDuration,
  sprintPhases,
} from "@/lib/timer";
import type { SprintPhase, TimerState } from "@/lib/types";

type SprintTimerPanelProps = {
  timer: TimerState;
  canEdit?: boolean;
  onStart?: () => Promise<void>;
  onPause?: () => Promise<void>;
  onReset?: (payload?: { durationSeconds?: number }) => Promise<void>;
  onChangePhase?: (phase: SprintPhase) => Promise<void>;
};

function secondsToMinutes(seconds: number) {
  return Math.max(1, Math.round(seconds / 60));
}

export function SprintTimerPanel({
  timer,
  canEdit,
  onStart,
  onPause,
  onReset,
  onChangePhase,
}: SprintTimerPanelProps) {
  const [now, setNow] = useState(() => new Date().toISOString());
  const [durationMinutes, setDurationMinutes] = useState(() =>
    String(secondsToMinutes(timer.durationSeconds)),
  );
  const [pendingAction, setPendingAction] = useState<string>();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date().toISOString());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const remainingSeconds = useMemo(
    () => calculateRemainingSeconds(timer, now),
    [now, timer],
  );
  const parsedDurationMinutes = Number(durationMinutes);
  const durationError =
    Number.isFinite(parsedDurationMinutes) &&
    parsedDurationMinutes >= 1 &&
    parsedDurationMinutes <= 240
      ? undefined
      : "Duration must be between 1 and 240 minutes.";
  const progress =
    ((timer.durationSeconds - remainingSeconds) / timer.durationSeconds) * 100;
  const isPending = Boolean(pendingAction);

  async function runTimerAction(label: string, action: () => Promise<void> | undefined) {
    setPendingAction(label);
    try {
      await action();
    } finally {
      setPendingAction(undefined);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Sprint Timer
          </p>
          <h2 className="mt-3 text-lg font-semibold text-white">{timer.phase}</h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            timer.isRunning
              ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-200"
              : "border-sky-500/30 bg-sky-500/8 text-sky-200"
          }`}
        >
          {timer.isRunning ? "Running" : "Paused"}
        </span>
      </div>

      <p className="mt-6 font-mono text-5xl font-semibold text-white">
        {formatTimerDuration(remainingSeconds)}
      </p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-300"
          style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Phase
          </span>
          <select
            className="h-10 rounded border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending}
            value={timer.phase}
            onChange={(event) =>
              void runTimerAction("phase", () =>
                onChangePhase?.(event.target.value as SprintPhase),
              )
            }
          >
            {sprintPhases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Duration minutes
          </span>
          <input
            className="h-10 rounded border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending}
            min={1}
            max={240}
            onChange={(event) => setDurationMinutes(event.target.value)}
            type="number"
            value={durationMinutes}
          />
          {durationError ? (
            <span className="text-xs leading-5 text-rose-200">
              {durationError}
            </span>
          ) : null}
        </label>

        <div className="grid grid-cols-3 gap-2">
          <button
            className="h-10 rounded border border-emerald-400/30 bg-emerald-400/8 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending || timer.isRunning || remainingSeconds <= 0}
            type="button"
            onClick={() => void runTimerAction("start", () => onStart?.())}
          >
            {pendingAction === "start" ? "Starting..." : "Start"}
          </button>
          <button
            className="h-10 rounded border border-amber-400/30 bg-amber-400/8 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending || !timer.isRunning}
            type="button"
            onClick={() => void runTimerAction("pause", () => onPause?.())}
          >
            {pendingAction === "pause" ? "Pausing..." : "Pause"}
          </button>
          <button
            className="h-10 rounded border border-white/10 bg-white/8 text-xs font-semibold text-zinc-100 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || isPending || Boolean(durationError)}
            type="button"
            onClick={() =>
              void runTimerAction("reset", () =>
                onReset?.({
                  durationSeconds: parsedDurationMinutes * 60,
                }),
              )
            }
          >
            {pendingAction === "reset" ? "Resetting..." : "Reset"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Timer state is authoritative on the server. Clients derive the visible
        countdown from the last synchronized timestamp.
      </p>
    </section>
  );
}
