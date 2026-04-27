# LiveSprint Demo

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in two browser tabs.

## Demo Flow

1. Join the sprint in both tabs with different names.
2. Point out that Presence updates live and the server broadcasts the full session snapshot.
3. Create a task from the Sprint Board with a title and related file path.
4. Assign the task, move it to ACTIVE, then BLOCKED, REVIEW, and DONE.
5. Watch the Activity Feed update in both tabs with typed event messages.
6. Start or pause the Sprint Timer and confirm both tabs show the same phase and countdown.
7. Show the seeded HIGH conflict in the Conflict Risk panel.
8. Create or edit two ACTIVE tasks so both touch `src/lib/session/index.ts`.
9. Confirm a HIGH risk appears or remains visible in both tabs.
10. Move one task to DONE and show the risk resolving or downgrading.
11. In Mock GitHub Events, simulate a commit touching an active file.
12. Simulate PR opened and PR merged to show task status, activity, and risk updates.

## Talking Points

- The server is authoritative; clients send commands, not state patches.
- Every accepted action becomes a typed event.
- The reducer is pure and unit tested.
- Conflict risk is advisory and based on file-path overlap.
- Mock GitHub events use an adapter boundary so real webhooks can produce the same event types later.

## Reset

Restarting `npm run dev` resets the in-memory session to the seed data.
