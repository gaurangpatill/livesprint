# LiveSprint

LiveSprint is a real-time engineering sprint orchestration platform for developer teams. It is designed as a coordination engine for active sprint work: tasks, developer presence, sprint phases, Git-style activity, and merge-conflict risk should eventually synchronize live across connected clients.

This repository is currently at Phase 7: merge-conflict risk detection. Real GitHub integration, persistence, and authentication are intentionally not implemented yet.

## Current Status

Implemented:

- Next.js App Router application
- TypeScript
- Tailwind CSS
- Polished dashboard shell
- Session-backed modules for Sprint Board, Presence, Activity Feed, Sprint Timer, Conflict Risk, and Mock GitHub Events
- Initial project structure for future sprint, activity, conflict, GitHub, timer, event, session, and mock modules
- Core sprint domain types
- Typed `LiveSprintEvent` model
- Pure session reducer/state manager
- Realistic seed sprint session
- Socket.IO realtime session transport
- Join flow with display names
- Live presence updates
- Live task creation, editing, assignment, and status updates
- Five-column sprint board: TODO, ACTIVE, BLOCKED, REVIEW, DONE
- Related file path editing on tasks
- First-class live activity timeline with event filters
- Shared event formatter for human-readable activity messages
- Server-authoritative sprint phase timer with start, pause, reset, phase change, and duration control
- Real-time merge-conflict risk detection from active task file paths
- Conflict risk panel with LOW, MEDIUM, and HIGH risk explanations
- Vitest reducer and command-adapter tests
- Project plan in `PLAN.md`

Not implemented yet:

- Interactive mock GitHub event simulation
- Persistence
- Authentication

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- React
- Node.js runtime through Next.js
- Socket.IO

Planned later:

- Unit tests for reducer and conflict detection
- Optional Prisma/PostgreSQL after the real-time MVP works
- Real GitHub webhooks after mock events prove the workflow

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

`npm run dev` runs a custom Next.js server with Socket.IO attached. Use `npm run dev:next` only when you intentionally want the plain Next.js server without realtime collaboration.

Open the app:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run dev:next
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
npm run typecheck
npm run check
```

## Project Structure

```text
src/app
src/components/dashboard
src/components/sprint
src/components/activity
src/components/conflicts
src/components/github
src/components/timer
src/lib/types
src/lib/events
src/lib/realtime
src/lib/session
src/lib/conflicts
src/lib/mock
```

## Phase 1 Demo Flow

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000`.
3. Review the dashboard shell and placeholder modules.
4. Review `PLAN.md` for the product and architecture direction.

## Phase 2 Demo Flow

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000`.
3. Review the session-backed sprint board, presence panel, timer panel, activity feed, risk panel, and commit panel.
4. Run `npm run test` to verify reducer behavior.

## Phase 3 Demo Flow

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000` in two browser tabs.
3. Enter a different display name in each tab and join the sprint.
4. Confirm both names appear in the Presence panel.
5. Assign a task or change a task status in one tab.
6. Confirm the task board and activity feed update in both tabs.
7. Close one tab and confirm that user is marked offline in the remaining tab.

## Phase 4 Demo Flow

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000` in two browser tabs.
3. Join with a different display name in each tab.
4. Create a task with a title, optional description, assignee, and related file paths.
5. Confirm the new task appears in both tabs under TODO.
6. Assign the task, move it to ACTIVE, mark it BLOCKED, move it to REVIEW, then mark it DONE.
7. Confirm every task change updates the board and activity feed in both tabs without refresh.

## Phase 5 Demo Flow

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000` in two browser tabs.
3. Join with different display names.
4. Create, assign, edit, block, review, and complete tasks.
5. Watch the Activity Feed update in both tabs with actor, timestamp, type badge, and readable message.
6. Use the feed filters: All, Tasks, Users, Timer/Phase, Git, and Conflicts.

## Phase 6 Demo Flow

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000` in two browser tabs.
3. Join with different display names.
4. Start, pause, reset, or change the timer phase in one tab.
5. Confirm the other tab receives the same phase and countdown state.
6. Join from a third tab after the timer is already running and confirm it receives the current authoritative timer snapshot.

## Phase 7 Demo Flow

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000` in two browser tabs and join with different names.
3. Create two tasks with related file paths in the same directory, for example `src/lib/session/a.ts` and `src/lib/session/b.ts`.
4. Move both tasks to ACTIVE and confirm a MEDIUM risk appears in both tabs.
5. Edit one task so both tasks touch the exact same file, for example `src/lib/session/index.ts`.
6. Confirm the risk upgrades to HIGH and a conflict event appears in the Activity Feed.
7. Move one task to DONE and confirm the risk disappears or downgrades.

## Architecture Direction

The intended MVP will keep an authoritative sprint session state on the server. Clients will send typed commands, the server will reduce those commands into state transitions, and accepted events will be broadcast to connected clients. Late joiners should receive the current authoritative state before receiving new live events.

Phase 2 implemented the reducer side of that architecture locally:

- `src/lib/types` contains shared domain types.
- `src/lib/events` contains the typed event union.
- `src/lib/session` contains the pure reducer and session helpers.
- `src/lib/mock/session.ts` contains the seed sprint session rendered by the dashboard.

Phase 3 adds a custom server in `server.ts` using Socket.IO:

- The server owns one in-memory `SprintSession`.
- Clients connect through `useLiveSprintSession`.
- Clients send typed commands such as `task:create`, `task:update`, `task:assign`, and `task:update-status`.
- The server validates command payloads in `src/lib/realtime/commands.ts`.
- The server converts commands to `LiveSprintEvent` objects.
- The existing reducer applies events and appends activity feed entries.
- The server broadcasts updated session state to every connected client.

Socket.IO was chosen over hand-rolled WebSocket handling because this Next.js App Router project benefits from built-in reconnection, acknowledgements, and typed event channels. The tradeoff is a custom Next server, so deployments must run `server.ts` rather than a purely static or serverless Next target.

Phase 4 expands the task flow:

- The sprint board groups tasks into TODO, ACTIVE, BLOCKED, REVIEW, and DONE columns.
- Task creation emits `task.created`.
- Title, description, assignee, and related file edits emit `task.updated` or `task.assigned`.
- Starting work emits `task.started`.
- Blocking work emits `task.blocked`.
- Review handoff emits `task.review_requested`.
- Completion emits `task.completed`.

Every task event includes `actorId` and a server timestamp, is reduced on the server, and appears in the activity feed in real time.

Phase 5 makes the activity feed a first-class event stream:

- `src/lib/events/formatters.ts` converts typed `LiveSprintEvent` objects into readable activity messages.
- The reducer uses the shared formatter before appending activity entries.
- The UI renders reverse chronological events with actor context, timestamps, typed badges, and category markers.
- Lightweight filters group events into Tasks, Users, Timer/Phase, Git, and Conflicts.
- Git and conflict filters are ready for future phases; they show matching placeholder events when those typed events are emitted.

Phase 6 adds a synchronized sprint timer:

- `src/lib/timer` contains pure timer logic for start, pause, reset, phase changes, and remaining-time calculation.
- Clients send `timer:start`, `timer:pause`, `timer:reset`, and `phase:change` commands.
- The server materializes the current timer before applying new events, then broadcasts the accepted session state.
- Late joiners receive a snapshot with the current authoritative timer.
- Clients derive the visible countdown locally from the synchronized `startedAt`, `remainingSeconds`, and `updatedAt` fields.
- Timer and phase events appear in the activity feed through `timer.started`, `timer.paused`, `timer.reset`, and `phase.changed`.

Phase 7 adds merge-conflict risk detection:

- `src/lib/conflicts` contains pure file-path risk detection.
- Only ACTIVE tasks are considered for conflict risk.
- LOW means one active task is touching a file.
- MEDIUM means multiple active tasks are touching files in the same directory/module.
- HIGH means multiple active tasks are touching the exact same file.
- Conflict risks are derived after reducer updates, stored on the session, and broadcast to every connected client.
- New MEDIUM/HIGH risks append `conflict.risk_detected` activity entries, while unchanged risks do not spam the feed.
- This is a soft warning system based on declared file paths, not a merge blocker or a guarantee of actual Git conflicts.

Conflict risk is derived from active task file paths:

- `LOW`: one active task touches a file
- `MEDIUM`: multiple active tasks touch files in the same directory or module
- `HIGH`: multiple active tasks touch the exact same file

Mock GitHub events will be typed event inputs first, so real webhook ingestion can replace the mock source later.

## Current Limitations

- Session state is in memory and resets when the server restarts.
- There is one shared sprint session.
- Reconnect does not restore identity automatically; the user can join again.
- Timer countdown is synchronized from server events and locally displayed between events; there is no separate per-second server broadcast.
- There is no authentication or authorization.
- Conflict detection only uses task related file paths until mock Git events are implemented.
- Risk is heuristic and file-level; it does not inspect ASTs, diffs, branches, or actual Git merge bases yet.
- GitHub events are not interactive yet.

## Screenshots

Screenshots will be added after the dashboard begins showing live session data.

## Roadmap

See `PLAN.md` for the phased implementation plan.
