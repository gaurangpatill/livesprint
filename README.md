# LiveSprint

LiveSprint is a real-time engineering sprint orchestration platform for developer teams. It is a coordination engine that synchronizes sprint tasks, developer presence, sprint phases, Git-style activity, and merge-conflict risk while work is happening.

The project is currently demo-ready through Phase 9. It uses a server-authoritative in-memory session, Socket.IO, typed events, a pure reducer, mock GitHub events, conflict-risk detection, and a polished dashboard UI.

## Why LiveSprint Exists

Most sprint tools are systems of record. They tell a team what was planned or what someone updated manually. LiveSprint models the sprint as a live distributed system:

- Developers join a shared session.
- Every meaningful action becomes a typed event.
- The server reduces events into authoritative state.
- All connected clients receive the same session state.
- File-path overlap is surfaced before it becomes merge pain.

This makes the project useful as a portfolio piece for real-time systems, event-driven architecture, TypeScript modeling, and developer workflow tooling.

## Key Features

- Realtime join flow and presence
- Server-authoritative sprint session state
- Five-column sprint board: TODO, ACTIVE, BLOCKED, REVIEW, DONE
- Horizontal kanban layout with readable task cards and usable controls
- Task creation, assignment, editing, status changes, blocking, review, completion
- Card-based operations landing page at `/`
- Route-specific dashboards for board, activity, conflicts, Git, and timer views
- REST dashboard metadata API
- Related file paths on tasks
- First-class activity feed with typed filters
- Shared sprint phase timer for PLANNING, CODING, REVIEW, and RETRO
- Merge-conflict risk detection from active task file paths
- Mock GitHub commits and pull requests
- Git events update linked tasks, activity, and conflict risk
- Focused Vitest coverage for reducers, commands, timer logic, conflict logic, Git events, and formatters

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Socket.IO
- Node.js custom server
- Vitest
- ESLint

No authentication, persistence, billing, organizations, or admin panels are included in the MVP.

## Architecture Overview

LiveSprint uses one in-memory authoritative `SprintSession` owned by `server.ts`.

```text
Browser UI
  -> useLiveSprintSession hook
  -> Socket.IO command
  -> server command adapter
  -> typed LiveSprintEvent
  -> pure session reducer
  -> conflict risk recalculation
  -> Socket.IO broadcast
  -> all browser tabs render the updated session
```

Important modules:

```text
server.ts                         Custom Next + Socket.IO server
src/lib/types                     Shared domain types
src/lib/events                    Typed event model and activity formatting
src/lib/realtime                  Socket protocol, command adapters, client hook
src/lib/dashboards                Dashboard route/API configuration
src/lib/session                   Pure reducer and session helpers
src/lib/conflicts                 Merge-conflict risk detection
src/lib/github                    Mock GitHub adapter boundary
src/lib/timer                     Pure shared timer logic
src/lib/mock                      Demo session data
src/components                    Dashboard panels and workflow UI
```

Socket.IO was chosen over raw WebSockets for acknowledgements, reconnect behavior, and named event channels. The tradeoff is that the realtime app runs through `tsx server.ts` instead of a purely serverless Next target.

## Dashboard Landing, Routes, and API

The root page `/` is the operations dashboard landing page. It shows large product cards for the main operations view, sprint board, activity timeline, conflict risk, mock GitHub events, sprint timer, and presence. Those cards are the primary navigation and link into focused dashboard routes.

Focused dashboard routes are backed by a small REST configuration layer:

```text
/dashboard/main
/dashboard/sprint-board
/dashboard/activity
/dashboard/conflicts
/dashboard/github
/dashboard/timer
```

Dashboard metadata is available from:

```text
GET /api/dashboards
GET /api/dashboards/:dashboardId
```

Each dashboard config returns:

- `id`
- `title`
- `description`
- `sections`

The frontend loads the active dashboard config through the API route, then renders the matching dashboard sections while realtime sprint state continues to come from Socket.IO.

Focused dashboard pages use a subtle back link to `/dashboard/main` instead of a primary tab menu. The main navigation surface is the card grid on `/` and `/dashboard/main`.

## Real-Time Event Flow

Clients never mutate sprint state directly. They send typed commands such as `task:create`, `task:update-status`, `timer:start`, or `github:commit`.

The server:

1. Validates the command payload.
2. Converts the command into a typed `LiveSprintEvent`.
3. Applies the event with `reduceSprintSession`.
4. Recalculates derived conflict risk.
5. Appends activity events.
6. Broadcasts the updated session to every connected client.

Late joiners receive the current authoritative session snapshot immediately after connecting.

## Merge-Conflict Risk Detection

Conflict risk is a soft warning system based on active tasks and related file paths.

- `LOW`: one active task touches a file
- `MEDIUM`: multiple active tasks touch files in the same directory or module
- `HIGH`: multiple active tasks touch the exact same file

Each risk includes affected path, involved tasks, involved users, explanation, and suggested action. New MEDIUM/HIGH risks emit `conflict.risk_detected` activity without spamming duplicate unchanged risks.

Limitations: this does not inspect Git branches, diffs, merge bases, generated code, or semantic conflicts. It predicts coordination risk from declared file-level activity.

## Mock GitHub Event Flow

The mock GitHub panel simulates:

- Commit pushed
- Pull request opened
- Pull request merged

Mock events are adapted in `src/lib/github/mock-events.ts`. That boundary is intentional: a future webhook route can replace the mock source by producing the same typed events.

Current behavior:

- `commit.linked` stores a commit and merges changed files into the linked task.
- `pull_request.opened` stores a PR, merges changed files, and moves the task to REVIEW.
- `pull_request.merged` stores a PR, merges changed files, and moves the task to DONE.
- Every Git event updates the activity feed and reruns conflict detection.

## Setup

Install dependencies:

```bash
npm install
```

Run the realtime development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

`npm run dev` runs the custom Next server with Socket.IO attached. `npm run dev:next` runs plain Next.js without the realtime Socket.IO layer.

The custom server binds to `0.0.0.0` when needed, but prints user-facing URLs in the familiar local/network format:

```text
LiveSprint realtime server ready
- Local:   http://localhost:3000
- Network: http://<lan-ip>:3000
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

## Testing

Run the unit tests:

```bash
npm run test
```

Run the full local quality gate:

```bash
npm run check
npm run build
```

The suite focuses on pure logic and command boundaries:

- Session reducer behavior
- Reducer immutability
- Timer transitions and remaining-time calculation
- Conflict-risk detection
- Duplicate significant risk prevention
- Mock GitHub event adaptation
- Git event reducer integration
- Activity event formatting
- Input validation for task, timer, file path, and Git payloads
- Dashboard configuration routes

## Demo Script

1. Run `npm run dev`.
2. Open `http://localhost:3000` in two browser tabs.
3. Join with two different display names.
4. Use the large dashboard cards on `/` to open `/dashboard/sprint-board` in one tab and `/dashboard/conflicts` in the other.
5. Confirm both users appear in Presence.
6. Create a task with related files such as `src/lib/session/index.ts`.
7. Assign the task and move it to ACTIVE with the Start button or status select.
8. Edit the task title, description, and related files from the inline edit form.
9. Move the task through REVIEW, BLOCKED, and DONE.
10. Start, pause, reset, or change the phase timer in one tab and watch the other tab sync.
11. Use the Activity Feed filters to inspect task, user, timer, Git, and conflict events.
12. In Mock GitHub Events, simulate a commit touching a file already used by an ACTIVE task.
13. Confirm the linked task, activity feed, and Conflict Risk panel update in both tabs.
14. Simulate PR opened to move a task to REVIEW.
15. Simulate PR merged to move a task to DONE and resolve or downgrade risk.

## Validation

The realtime command adapters reject practical invalid input:

- Empty task titles
- Unknown assignees
- Invalid repo-relative file paths
- Git events without changed files
- Empty commit messages or PR titles
- Timer durations outside 1 to 240 minutes
- Commands sent before joining the session

## Current Limitations

- Session state is in memory and resets on server restart.
- There is one shared sprint session.
- Reconnect does not restore the same user identity automatically.
- There is no persistence or replayable event log yet.
- Mock GitHub events do not prove webhook security, delivery, retries, or signatures.
- Conflict detection is file-path based and intentionally advisory.
- Deployment needs a host that supports the custom Node/Socket.IO server.

## Future Work

- Real GitHub webhook ingestion
- GitHub OAuth and repository linking
- PostgreSQL/Prisma persistence
- Replayable event log
- Multi-session support
- Reconnect identity recovery
- Role-based permissions
- Deployment-ready WebSocket infrastructure
- Screenshots and short demo video