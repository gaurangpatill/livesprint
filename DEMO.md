# LiveSprint Demo

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in two browser tabs. The root page is the operations dashboard landing page with large cards for focused dashboard views.

## Demo Flow

1. Join the sprint in both tabs with different names.
2. Point out that Presence updates live and the server broadcasts the full session snapshot.
3. Use the Sprint Board card to open `/dashboard/sprint-board`.
4. Create a task with a title and related file path.
5. Assign the task, then use Start, Review, Block, and Done.
6. Edit the task title, description, and related files from the inline edit form.
7. Watch the Activity Feed update in both tabs with typed event messages.
8. Use the Sprint Timer card to open `/dashboard/timer`, start or pause the timer, and confirm both tabs show the same phase and countdown.
9. Use the Conflict Risk card to open `/dashboard/conflicts` and show the seeded HIGH conflict.
10. Create or edit two ACTIVE tasks so both touch `src/lib/session/index.ts`.
11. Confirm a HIGH risk appears or remains visible in both tabs.
12. Move one task to DONE and show the risk resolving or downgrading.
13. Use the Mock GitHub Events card to open `/dashboard/github`, simulate a commit touching an active file.
14. Simulate PR opened and PR merged to show task status, activity, and risk updates.

## API Checks

```bash
curl http://localhost:3000/api/dashboards
curl http://localhost:3000/api/dashboards/conflicts
```

## Talking Points

- The server is authoritative; clients send commands, not state patches.
- Dashboard routes load metadata through REST, while live sprint state comes through Socket.IO.
- Every accepted action becomes a typed event.
- The reducer is pure and unit tested.
- Conflict risk is advisory and based on file-path overlap.
- Mock GitHub events use an adapter boundary so real webhooks can produce the same event types later.

## Reset

Restarting `npm run dev` resets the in-memory session to the seed data.
