# LiveSprint Plan

## Product Goal

LiveSprint is a real-time engineering sprint orchestration platform for developer teams. It coordinates sprint tasks, developer presence, sprint phases, Git-style activity, and merge-conflict risk in one shared operational view.

The goal is not to recreate Jira. The goal is to show how a sprint can be run as a live distributed system where every meaningful team action updates shared state immediately and predictably.

## Why This Project Exists

Most sprint tools are record systems: they track tickets after humans manually update them. LiveSprint is designed as a coordination engine: it keeps a team aligned while work is happening.

The project exists to demonstrate:

- Real-time collaborative state synchronization
- Event-driven product architecture
- WebSocket-based session coordination
- Developer workflow modeling
- Merge-conflict risk detection before integration pain appears
- Clean, testable TypeScript across the client and server boundary

## Twilio Alignment

LiveSprint aligns with Twilio-style engineering themes:

- Real-time communication between distributed participants
- Event-driven systems where state changes are explicit and replayable
- Reliable coordination across clients with authoritative server state
- Developer-focused workflows that expose useful operational signals
- Clear product surfaces built on top of asynchronous events

The project is intentionally scoped to show strong engineering fundamentals: real-time delivery, event semantics, state management, testing, and a polished dashboard UI.

## Architecture Overview

The MVP is a Next.js App Router application with TypeScript, Tailwind CSS, Socket.IO, a custom Node server, and one server-authoritative in-memory sprint session. Through Phase 9, LiveSprint has a demo-ready dashboard, typed event model, pure reducer, live task flow, shared timer, conflict-risk detection, mock GitHub events, validation, tests, and recruiter-ready documentation.

The target architecture will use:

- Next.js for the frontend application and route structure
- TypeScript shared models for sprint state, users, tasks, activity, commits, and risk
- A centralized event reducer/session state manager implemented as a pure function
- Socket.IO realtime transport for synchronized sessions
- In-memory authoritative state for the MVP
- Mock GitHub-style events before real webhooks
- Unit tests for event handling and merge-conflict risk logic

Persistence is intentionally deferred until the real-time MVP works end to end.

## MVP Scope

The MVP should demonstrate one live sprint session where multiple clients can:

- Join the same session
- See live presence
- Create and update sprint tasks
- Watch activity events appear in real time
- Share an authoritative sprint phase timer
- Simulate GitHub-style commits and pull request events
- See merge-conflict risk based on active task file paths

Out of scope for the MVP:

- Authentication
- Billing
- Organizations
- Admin panels
- Database persistence
- Real GitHub OAuth or webhook delivery

## Phased Implementation Plan

### Phase 1: Project foundation

- Initialize Next.js + TypeScript + Tailwind
- Create dashboard shell
- Add core types
- Add seed/mock data
- Add initial README

### Phase 2: Core state and event model

- Define SprintSession, SprintTask, SprintUser, SprintPhase, ActivityEvent, CommitEvent, ConflictRisk
- Add centralized event reducer/session state manager
- Add basic unit tests for event/state updates

Status: implemented with local seed data and Vitest reducer tests. State is not networked yet.

### Phase 3: Real-time session engine

- Add WebSocket server or equivalent real-time layer
- Users can join sprint session
- Presence updates live
- Late joiners receive authoritative current state

Status: implemented with a Socket.IO custom server, one in-memory authoritative session, live join/leave presence, session snapshots, and live task assignment/status commands.

### Phase 4: Live sprint board

- Tasks can be created, assigned, updated, blocked, reviewed, completed
- All task updates broadcast live

Status: implemented with TODO, ACTIVE, BLOCKED, REVIEW, and DONE columns. Task create/update/assign/status commands are validated on the server, converted to typed events, reduced into session state, and broadcast to all clients.

### Phase 5: Activity feed

- Every meaningful action emits an event
- Activity feed updates live

Status: implemented with a reusable event formatter, reverse-chronological live timeline, actor/timestamp/type rendering, and filters for tasks, users, timer/phase, Git, and conflicts.

### Phase 6: Sprint phase timer

- Shared phases: PLANNING, CODING, REVIEW, RETRO
- Start, pause, reset, change phase
- All clients see same authoritative timer state

Status: implemented with timer commands, pure timer logic, phase changes, duration reset support, late-join snapshots, and activity feed events for phase/timer actions.

### Phase 7: Merge-conflict risk detection

- Track related file paths per active task
- LOW: one active task touches a file
- MEDIUM: multiple active tasks touch files in the same directory/module
- HIGH: multiple active tasks touch the exact same file
- Show explanation and suggested action

Status: implemented with pure conflict detection, derived session risks, live conflict panel updates, and `conflict.risk_detected` activity entries for new MEDIUM/HIGH risks.

### Phase 8: Mock GitHub events

- Simulate commit pushed, PR opened, PR merged
- Link commits to tasks
- Update conflict risk from files changed
- Design so real GitHub webhooks can be added later

Status: implemented with a mock GitHub adapter, commit/PR simulator UI, typed `commit.linked`, `pull_request.opened`, and `pull_request.merged` events, reducer integration, activity feed messages, and conflict-risk recalculation from changed files.

### Phase 9: Polish, tests, README

- Clean UI
- Empty/loading/error states
- Unit tests for conflict detection and event reducer
- README with architecture, setup, demo flow, and screenshots placeholder

Status: implemented with dashboard copy/empty-state polish, stronger seed data, practical task/Git/file/timer validation, additional tests, and refreshed README plus architecture/demo/testing docs.

## Data Model

The core domain model centers on a `SprintSession` containing users, tasks, activity, sprint phase/timer state, commit events, and conflict risk records.

Planned entities:

- `SprintSession`: authoritative state container for one sprint room
- `SprintUser`: participant identity, role, presence, and current focus
- `SprintTask`: task metadata, status, assignment, file paths, and timestamps
- `SprintPhase`: shared sprint mode such as planning, coding, review, or retro
- `ActivityEvent`: append-only event shown in the live feed
- `CommitEvent`: mock GitHub commit signal linked to files and tasks
- `ConflictRisk`: derived risk record with severity, explanation, and suggested action

Phase 2 implements these models under `src/lib/types`.

## WebSocket/Event Model

The real-time layer will treat the server as authoritative. Clients will send typed commands, the server will validate and reduce them into session state, then broadcast resulting events and snapshots.

Planned flow:

1. Client connects to a sprint session.
2. Server sends the current authoritative snapshot.
3. Client sends typed sprint commands.
4. Server applies commands through a reducer/session manager.
5. Server broadcasts accepted events and updated state.
6. Late joiners receive the current snapshot before subscribing to future events.

This keeps synchronization explicit and testable.

Phase 2 implements the reducer boundary but not the network transport. The reducer accepts current `SprintSession` state and a typed `LiveSprintEvent`, then returns a new session state without mutating the original.

Phase 3 implements the transport with Socket.IO in `server.ts`. Clients use `useLiveSprintSession`, receive a current snapshot, send typed task commands, and receive updated session state after the server applies the reducer. Socket.IO was chosen for acknowledgements and reconnection support; the tradeoff is that the app now runs through a custom Next server for realtime mode.

Phase 4 extends the command model with `task:create` and `task:update` commands. The server maps those commands to `task.created`, `task.updated`, `task.assigned`, `task.started`, `task.blocked`, `task.review_requested`, and `task.completed` events so the board and activity feed stay synchronized.

Phase 5 centralizes readable event formatting under `src/lib/events/formatters.ts`. The reducer uses this formatter to append activity entries, and the UI groups stored activity by event category without changing the realtime engine.

Phase 6 adds `phase:change`, `timer:start`, `timer:pause`, and `timer:reset` commands. The server materializes the current timer before applying events so late joiners and command handlers use authoritative remaining time. Clients render the countdown locally between server broadcasts from `startedAt`, `remainingSeconds`, and `updatedAt`.

Phase 7 recalculates conflict risks after reducer updates. The detector considers ACTIVE tasks and their related file paths, derives LOW/MEDIUM/HIGH risks, updates `session.conflictRisks`, and appends non-duplicate activity entries for newly detected MEDIUM/HIGH risks.

Phase 8 adds a Git adapter boundary under `src/lib/github`. The mock UI sends commit and pull request payloads, the adapter converts them to typed `LiveSprintEvent` objects, and the reducer updates commits, pull requests, linked task files/status, activity, and derived conflict risk. A real webhook handler can later replace the mock source by producing the same events.

Phase 9 hardens the existing architecture rather than adding major features. Command adapters now reject invalid task titles, assignees, file paths, Git payloads, and timer durations before events enter the reducer. Seed data now demonstrates board state, presence, activity, timer, conflict risk, and Git activity immediately after startup.

## Merge-Conflict Risk Detection Strategy

Conflict risk is currently derived from active task file paths, including file paths added by mock commit and pull request events.

Risk levels:

- `LOW`: one active task touches a file
- `MEDIUM`: multiple active tasks touch files in the same directory or module
- `HIGH`: multiple active tasks touch the exact same file

Each risk result should include:

- Severity
- Involved tasks
- Involved users
- File or directory basis
- Human-readable explanation
- Suggested coordination action

The first implementation will be deterministic and in-memory so it can be unit tested thoroughly.

This is intentionally a soft warning system. It predicts coordination risk from declared file paths; it does not inspect Git branches, merge bases, diffs, or AST-level semantic conflicts yet.

## Mock GitHub Event Strategy

Mock GitHub events are modeled as typed developer workflow events rather than hard-coded UI tricks.

Planned mock events:

- Commit pushed
- Pull request opened
- Pull request merged

Each event should optionally link to:

- A sprint task
- A user
- Files changed
- A branch name
- A pull request number

The design should make it straightforward to replace the mock source with real GitHub webhooks later.

Current implementation:

- Mock commits emit `commit.linked`
- Mock PR opens emit `pull_request.opened`
- Mock PR merges emit `pull_request.merged`
- Changed files are merged into linked task file paths
- PR opened moves the linked task to review
- PR merged moves the linked task to done

## Testing Strategy

Testing focuses first on pure logic:

- Event reducer behavior
- Session state transitions
- Conflict-risk detection
- Mock GitHub event handling

UI tests can be added after the live workflows stabilize. The MVP should maintain a fast unit test suite for core state and risk logic.

Current tests cover task creation, task status updates, assignment, phase changes, timer transitions, reducer immutability, conflict-risk detection, duplicate risk prevention, mock GitHub adapters, Git reducer integration, activity formatting, file path validation, and invalid command payloads.

Realtime command-adapter tests cover display-name normalization, joined-user creation, task-status command mapping, and rejecting task commands before a user joins.

## Known Tradeoffs

- In-memory state keeps the MVP focused but means sessions reset when the server restarts.
- The custom Socket.IO server is practical for the MVP but will need deployment-specific handling later.
- Reconnect does not restore user identity automatically yet.
- Mock GitHub events provide demo speed but do not prove webhook security or delivery handling yet.
- A single authoritative session manager is simpler than distributed persistence and is appropriate for the first real-time prototype.
- Authentication is deferred to avoid obscuring the core real-time coordination problem.
- Conflict detection starts with file path heuristics and will not initially understand AST-level or semantic conflicts.

## Future Extensions

- Real GitHub webhook ingestion
- GitHub OAuth and repository linking
- Persistent sprint history with PostgreSQL and Prisma
- Replayable event log
- Multi-session support
- Role-based permissions
- Slack or Twilio notifications
- Conflict-risk trend analytics
- AI-assisted sprint summaries
- Deployment-ready WebSocket infrastructure
