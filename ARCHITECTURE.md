# LiveSprint Architecture

LiveSprint is built around one rule: clients send intent, the server owns state.

## Runtime Shape

```text
Next.js UI
  -> useLiveSprintSession
  -> Socket.IO command
  -> server.ts
  -> command adapter
  -> LiveSprintEvent
  -> reduceSprintSession
  -> conflict detector
  -> Socket.IO broadcast
```

The current MVP keeps one `SprintSession` in memory. That keeps the realtime behavior easy to demo and test before introducing persistence.

## Main Boundaries

- `src/lib/types`: shared sprint, user, task, timer, Git, activity, and conflict models
- `src/lib/events`: typed event union and human-readable activity formatting
- `src/lib/realtime`: Socket.IO protocol, client hook, and command adapters
- `src/lib/session`: pure event reducer and session helpers
- `src/lib/conflicts`: pure conflict-risk derivation from active task file paths
- `src/lib/github`: mock GitHub adapter that can later be replaced by webhook ingestion
- `src/lib/timer`: pure timer state transitions and remaining-time calculation
- `src/lib/mock`: demo-ready seed session

## Server Authority

`server.ts` owns the current session. Before accepting commands, it materializes the timer snapshot so late joiners and command handlers operate on current authoritative time.

Accepted commands become typed `LiveSprintEvent` objects. The reducer returns a new session object, recalculates conflict risk, appends activity entries, and the server broadcasts that session to every connected client.

## Event Design

Events are explicit product facts:

- `task.created`
- `task.started`
- `timer.started`
- `phase.changed`
- `commit.linked`
- `pull_request.opened`
- `conflict.risk_detected`

This makes the system testable and gives the activity feed a reliable source of truth.

## Persistence Later

The next durable version should store accepted events first, then derive current session state from those events. PostgreSQL and Prisma can be added after the realtime behavior is stable.
