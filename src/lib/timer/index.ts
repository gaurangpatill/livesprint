import type { SprintPhase, TimerState } from "@/lib/types";

export const sprintPhases: SprintPhase[] = [
  "PLANNING",
  "CODING",
  "REVIEW",
  "RETRO",
];

export const defaultPhaseDurations: Record<SprintPhase, number> = {
  PLANNING: 900,
  CODING: 5400,
  REVIEW: 1800,
  RETRO: 900,
};

export function clampDurationSeconds(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds)) {
    return defaultPhaseDurations.CODING;
  }

  return Math.min(Math.max(Math.round(durationSeconds), 60), 14_400);
}

export function getElapsedSeconds(startedAt: string | undefined, now: string) {
  if (!startedAt) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.parse(now) - Date.parse(startedAt)) / 1000));
}

export function calculateRemainingSeconds(timer: TimerState, now: string) {
  if (!timer.isRunning || !timer.startedAt) {
    return Math.max(0, timer.remainingSeconds);
  }

  return Math.max(0, timer.remainingSeconds - getElapsedSeconds(timer.startedAt, now));
}

export function getCurrentTimerState(timer: TimerState, now: string): TimerState {
  const remainingSeconds = calculateRemainingSeconds(timer, now);

  return {
    ...timer,
    remainingSeconds,
    startedAt: timer.isRunning && remainingSeconds > 0 ? now : undefined,
    isRunning: timer.isRunning && remainingSeconds > 0,
    updatedAt: now,
  };
}

export function startTimer(timer: TimerState, now: string): TimerState {
  if (timer.isRunning) {
    return getCurrentTimerState(timer, now);
  }

  return {
    ...timer,
    isRunning: true,
    startedAt: now,
    pausedAt: undefined,
    updatedAt: now,
  };
}

export function pauseTimer(timer: TimerState, now: string): TimerState {
  return {
    ...timer,
    isRunning: false,
    remainingSeconds: calculateRemainingSeconds(timer, now),
    startedAt: undefined,
    pausedAt: now,
    updatedAt: now,
  };
}

export function resetTimer(
  timer: TimerState,
  now: string,
  durationSeconds = timer.durationSeconds,
): TimerState {
  const nextDurationSeconds = clampDurationSeconds(durationSeconds);

  return {
    ...timer,
    durationSeconds: nextDurationSeconds,
    remainingSeconds: nextDurationSeconds,
    isRunning: false,
    startedAt: undefined,
    pausedAt: undefined,
    resetAt: now,
    updatedAt: now,
  };
}

export function changeTimerPhase(
  timer: TimerState,
  phase: SprintPhase,
  now: string,
): TimerState {
  const durationSeconds = defaultPhaseDurations[phase];

  return {
    ...timer,
    phase,
    durationSeconds,
    remainingSeconds: durationSeconds,
    isRunning: false,
    startedAt: undefined,
    pausedAt: now,
    updatedAt: now,
  };
}

export function formatTimerDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
