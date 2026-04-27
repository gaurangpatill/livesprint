import { describe, expect, it } from "vitest";
import type { LiveSprintEvent } from "@/lib/events";
import { formatLiveSprintEvent, getActivityCategory } from "@/lib/events";
import { mockSprintSession } from "@/lib/mock/session";
import type { SprintSession } from "@/lib/types";

function freshSession(): SprintSession {
  return structuredClone(mockSprintSession);
}

describe("event formatters", () => {
  it("formats user events", () => {
    const session = freshSession();
    const event: LiveSprintEvent = {
      id: "event-user-joined-test",
      type: "user.joined",
      actorId: "user-live-gaurang",
      occurredAt: "2026-04-27T16:00:00.000Z",
      user: {
        id: "user-live-gaurang",
        name: "Gaurang Patil",
        role: "Guest collaborator",
        avatarInitials: "GP",
        presence: "online",
        joinedAt: "2026-04-27T16:00:00.000Z",
        lastSeenAt: "2026-04-27T16:00:00.000Z",
      },
    };
    const nextSession = {
      ...session,
      users: [...session.users, event.user],
    };

    expect(
      formatLiveSprintEvent(event, {
        previousSession: session,
        nextSession,
      }),
    ).toMatchObject({
      actorName: "Gaurang Patil",
      category: "users",
      label: "User joined",
      message: "Gaurang Patil joined the sprint.",
    });
  });

  it("formats task events", () => {
    const session = freshSession();
    const event: LiveSprintEvent = {
      id: "event-task-start-test",
      type: "task.started",
      actorId: "user-maya",
      occurredAt: "2026-04-27T16:05:00.000Z",
      taskId: "task-live-board",
    };

    expect(
      formatLiveSprintEvent(event, {
        previousSession: session,
        nextSession: session,
      }),
    ).toMatchObject({
      actorName: "Maya Chen",
      category: "tasks",
      label: "Task started",
      message: 'Maya Chen started "Render sprint board from session state".',
      taskTitle: "Render sprint board from session state",
    });
  });

  it("formats timer and phase events", () => {
    const session = freshSession();
    const phaseEvent: LiveSprintEvent = {
      id: "event-phase-test",
      type: "phase.changed",
      actorId: "user-eli",
      occurredAt: "2026-04-27T16:10:00.000Z",
      phase: "REVIEW",
    };
    const timerEvent: LiveSprintEvent = {
      id: "event-timer-test",
      type: "timer.started",
      actorId: "user-eli",
      occurredAt: "2026-04-27T16:11:00.000Z",
    };
    const nextSession = {
      ...session,
      phase: "REVIEW" as const,
      timer: { ...session.timer, phase: "REVIEW" as const },
    };

    expect(
      formatLiveSprintEvent(phaseEvent, {
        previousSession: session,
        nextSession,
      }).message,
    ).toBe("Sprint phase changed to REVIEW.");
    expect(
      formatLiveSprintEvent(timerEvent, {
        previousSession: nextSession,
        nextSession,
      }),
    ).toMatchObject({
      category: "timer",
      label: "Timer started",
      message: "Eli Rivera started the REVIEW timer.",
    });
  });

  it("falls back for unknown event types", () => {
    const session = freshSession();
    const event = {
      id: "event-unknown-test",
      type: "system.unknown",
      actorId: "user-eli",
      occurredAt: "2026-04-27T16:15:00.000Z",
    } as unknown as LiveSprintEvent;

    expect(getActivityCategory("system.unknown")).toBe("tasks");
    expect(
      formatLiveSprintEvent(event, {
        previousSession: session,
        nextSession: session,
      }),
    ).toMatchObject({
      actorName: "Eli Rivera",
      label: "Activity event",
      message: "Eli Rivera performed system.unknown.",
    });
  });
});
