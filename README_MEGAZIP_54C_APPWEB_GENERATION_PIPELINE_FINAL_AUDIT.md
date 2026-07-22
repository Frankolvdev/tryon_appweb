# MegaZIP 54C — AppWeb generation pipeline final audit

- Removes the remaining active legacy Try-On execution path from the AppWeb UI.
- Redirects the old `/history` route to `/generation/history`.
- Keeps old Try-On endpoints as read-only compatibility helpers only.
- Ensures new executions originate exclusively from `generation-api.ts` and the unified generation-module endpoints.
- Consolidates Local, RunPod Serverless and Simulated jobs in one user history with queue/provider metadata.
