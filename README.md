# LiveSprint

LiveSprint is a real-time engineering sprint orchestration platform for developer teams. It is designed as a coordination engine for active sprint work: tasks, developer presence, sprint phases, Git-style activity, and merge-conflict risk should eventually synchronize live across connected clients.

This repository is currently at Phase 2: core state and event model. WebSockets, live client synchronization, and real GitHub integration are intentionally not implemented yet.

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
- Vitest reducer tests
- Project plan in `PLAN.md`

Not implemented yet:

- WebSocket server
- Real-time session transport
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

Planned later:

- WebSockets or equivalent real-time transport
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

Open the app:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
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

## Architecture Direction

The intended MVP will keep an authoritative sprint session state on the server. Clients will send typed commands, the server will reduce those commands into state transitions, and accepted events will be broadcast to connected clients. Late joiners should receive the current authoritative state before receiving new live events.

Phase 2 implements the reducer side of that architecture locally:

- `src/lib/types` contains shared domain types.
- `src/lib/events` contains the typed event union.
- `src/lib/session` contains the pure reducer and session helpers.
- `src/lib/mock/session.ts` contains the seed sprint session rendered by the dashboard.

Conflict risk will be derived from active task file paths:

- `LOW`: one active task touches a file
- `MEDIUM`: multiple active tasks touch files in the same directory or module
- `HIGH`: multiple active tasks touch the exact same file

Mock GitHub events will be typed event inputs first, so real webhook ingestion can replace the mock source later.

## Screenshots

Screenshots will be added after the dashboard begins showing live session data.

## Roadmap

See `PLAN.md` for the phased implementation plan.
