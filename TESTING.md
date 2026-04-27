# LiveSprint Testing

LiveSprint keeps tests focused on pure logic and command boundaries. The realtime Socket.IO layer is intentionally thin, so most correctness checks happen before state is broadcast.

## Commands

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

For the combined local gate:

```bash
npm run check
```

## Covered Areas

- Realtime command adapters
- Task creation, assignment, status changes, and validation
- Timer start, pause, reset, phase change, and remaining-time calculation
- Session reducer state transitions
- Reducer immutability
- Activity event formatting and categories
- Conflict-risk LOW, MEDIUM, HIGH, resolution, and duplicate prevention
- Mock GitHub commit and pull request event adaptation
- Git event reducer integration with task files, task status, activity, and conflict risk
- File path validation
- Dashboard metadata configuration

## Manual Realtime Check

1. Run `npm run dev`.
2. Open two tabs at `http://localhost:3000`.
3. Join both tabs.
4. Use the large cards on `/` to visit `/dashboard/sprint-board`, `/dashboard/conflicts`, and `/dashboard/github`.
5. Create, assign, edit, start, review, block, and complete a task.
6. Change a timer or Git event in one tab.
7. Confirm the other tab updates without refresh.

## REST Dashboard API Check

With `npm run dev` running:

```bash
curl http://localhost:3000/api/dashboards
curl http://localhost:3000/api/dashboards/sprint-board
```

The response should include dashboard `id`, `title`, `description`, and `sections`.

This is the right level for the MVP. Browser automation can be added later once the product surface stabilizes further.
