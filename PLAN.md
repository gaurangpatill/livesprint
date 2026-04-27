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

The MVP starts as a Next.js App Router application with TypeScript and Tailwind CSS. Phase 2 now adds the core domain model, typed event union, seed sprint session, and centralized reducer that can later sit behind a WebSocket server.

The target architecture will use:

- Next.js for the frontend application and route structure
- TypeScript shared models for sprint state, users, tasks, activity, commits, and risk
- A centralized event reducer/session state manager implemented as a pure function
- A WebSocket server or equivalent real-time layer for synchronized sessions
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

### Phase 4: Live sprint board

- Tasks can be created, assigned, updated, blocked, reviewed, completed
- All task updates broadcast live

### Phase 5: Activity feed

- Every meaningful action emits an event
- Activity feed updates live

### Phase 6: Sprint phase timer

- Shared phases: PLANNING, CODING, REVIEW, RETRO
- Start, pause, reset, change phase
- All clients see same authoritative timer state

### Phase 7: Merge-conflict risk detection

- Track related file paths per active task
- LOW: one active task touches a file
- MEDIUM: multiple active tasks touch files in the same directory/module
- HIGH: multiple active tasks touch the exact same file
- Show explanation and suggested action

### Phase 8: Mock GitHub events

- Simulate commit pushed, PR opened, PR merged
- Link commits to tasks
- Update conflict risk from files changed
- Design so real GitHub webhooks can be added later

### Phase 9: Polish, tests, README

- Clean UI
- Empty/loading/error states
- Unit tests for conflict detection and event reducer
- README with architecture, setup, demo flow, and screenshots placeholder

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

## Merge-Conflict Risk Detection Strategy

Conflict risk will be derived from active task file paths and mock commit file changes.

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

## Mock GitHub Event Strategy

Mock GitHub events will be modeled as typed developer workflow events rather than hard-coded UI tricks.

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

## Testing Strategy

Testing will focus first on pure logic:

- Event reducer behavior
- Session state transitions
- Conflict-risk detection
- Mock GitHub event handling

UI tests can be added after the live workflows stabilize. The MVP should maintain a fast unit test suite for core state and risk logic.

Current tests cover task creation, task status updates, assignment, phase changes, timer transitions, and reducer immutability.

## Known Tradeoffs

- In-memory state keeps the MVP focused but means sessions reset when the server restarts.
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
