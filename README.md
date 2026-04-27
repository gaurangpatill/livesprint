# LiveSprint

LiveSprint is a real-time engineering sprint orchestration platform for developer teams. It is designed as a coordination engine for active sprint work: tasks, developer presence, sprint phases, Git-style activity, and merge-conflict risk should eventually synchronize live across connected clients.

This repository is currently at Phase 3: real-time session engine. Real GitHub integration, persistence, authentication, and automated conflict detection are intentionally not implemented yet.

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
- Live task assignment and status updates
- Vitest reducer and command-adapter tests
- Project plan in `PLAN.md`

Not implemented yet:

- Automated conflict-risk detection
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
- Clients send typed commands such as `task:assign` and `task:update-status`.
- The server validates command payloads in `src/lib/realtime/commands.ts`.
- The server converts commands to `LiveSprintEvent` objects.
- The existing reducer applies events and appends activity feed entries.
- The server broadcasts updated session state to every connected client.

Socket.IO was chosen over hand-rolled WebSocket handling because this Next.js App Router project benefits from built-in reconnection, acknowledgements, and typed event channels. The tradeoff is a custom Next server, so deployments must run `server.ts` rather than a purely static or serverless Next target.

Conflict risk will be derived from active task file paths:

- `LOW`: one active task touches a file
- `MEDIUM`: multiple active tasks touch files in the same directory or module
- `HIGH`: multiple active tasks touch the exact same file

Mock GitHub events will be typed event inputs first, so real webhook ingestion can replace the mock source later.

## Current Limitations

- Session state is in memory and resets when the server restarts.
- There is one shared sprint session.
- Reconnect does not restore identity automatically; the user can join again.
- There is no authentication or authorization.
- Conflict-risk records are still seeded placeholders.
- GitHub events are not interactive yet.

## Screenshots

Screenshots will be added after the dashboard begins showing live session data.

## Roadmap

See `PLAN.md` for the phased implementation plan.
