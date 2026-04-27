import { describe, expect, it } from "vitest";
import {
  calculateRemainingSeconds,
  changeTimerPhase,
  getCurrentTimerState,
  pauseTimer,
  resetTimer,
  startTimer,
} from "@/lib/timer";
import type { TimerState } from "@/lib/types";

const baseTimer: TimerState = {
  phase: "CODING",
  durationSeconds: 1800,
  remainingSeconds: 1200,
  isRunning: false,
  pausedAt: "2026-04-27T17:00:00.000Z",
  updatedAt: "2026-04-27T17:00:00.000Z",
};

describe("timer logic", () => {
  it("starts a paused timer", () => {
    const timer = startTimer(baseTimer, "2026-04-27T17:05:00.000Z");

    expect(timer).toMatchObject({
      isRunning: true,
      remainingSeconds: 1200,
      startedAt: "2026-04-27T17:05:00.000Z",
      pausedAt: undefined,
      updatedAt: "2026-04-27T17:05:00.000Z",
    });
  });

  it("pauses a running timer with safe remaining time", () => {
    const runningTimer: TimerState = {
      ...baseTimer,
      isRunning: true,
      startedAt: "2026-04-27T17:05:00.000Z",
      remainingSeconds: 1200,
    };

    const timer = pauseTimer(runningTimer, "2026-04-27T17:15:00.000Z");

    expect(timer).toMatchObject({
      isRunning: false,
      remainingSeconds: 600,
      startedAt: undefined,
      pausedAt: "2026-04-27T17:15:00.000Z",
      updatedAt: "2026-04-27T17:15:00.000Z",
    });
  });

  it("resets timer duration and remaining time", () => {
    const timer = resetTimer(baseTimer, "2026-04-27T17:20:00.000Z", 600);

    expect(timer).toMatchObject({
      durationSeconds: 600,
      remainingSeconds: 600,
      isRunning: false,
      resetAt: "2026-04-27T17:20:00.000Z",
      updatedAt: "2026-04-27T17:20:00.000Z",
    });
  });

  it("changes phase and applies the default phase duration", () => {
    const timer = changeTimerPhase(baseTimer, "REVIEW", "2026-04-27T17:25:00.000Z");

    expect(timer).toMatchObject({
      phase: "REVIEW",
      durationSeconds: 1800,
      remainingSeconds: 1800,
      isRunning: false,
      pausedAt: "2026-04-27T17:25:00.000Z",
    });
  });

  it("calculates remaining time without going below zero", () => {
    const runningTimer: TimerState = {
      ...baseTimer,
      isRunning: true,
      startedAt: "2026-04-27T17:05:00.000Z",
      remainingSeconds: 20,
    };

    expect(
      calculateRemainingSeconds(runningTimer, "2026-04-27T17:06:00.000Z"),
    ).toBe(0);
  });

  it("materializes running timer state for late join snapshots", () => {
    const runningTimer: TimerState = {
      ...baseTimer,
      isRunning: true,
      startedAt: "2026-04-27T17:05:00.000Z",
      remainingSeconds: 1200,
    };

    const timer = getCurrentTimerState(
      runningTimer,
      "2026-04-27T17:10:00.000Z",
    );

    expect(timer).toMatchObject({
      isRunning: true,
      remainingSeconds: 900,
      startedAt: "2026-04-27T17:10:00.000Z",
      updatedAt: "2026-04-27T17:10:00.000Z",
    });
  });
});
