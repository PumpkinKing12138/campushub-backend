# Lab 4 Agent Steering Log

### Incident 1: Incomplete Reservation Status Management

- **Initial Agent Output:** The agent implemented `PATCH /api/v1/reservations/{id}/cancel` but omitted a way to change a `PENDING` reservation to `CONFIRMED`. This left the status management rule in Part 1 incomplete while work proceeded to endpoint testing.
- **Root Cause:** The agent focused on the four endpoints explicitly listed in Part 2 and did not carry the `CONFIRMED` transition requirement from Part 1 into the implementation checklist.
- **Remediation Prompt:**

> Add the reservation confirmation endpoint `PATCH /api/v1/reservations/{id}/confirm`. Only allow a `PENDING` reservation to transition to `CONFIRMED`; repeating the request for an already confirmed reservation should succeed; a `CANCELLED` reservation must not be confirmed again. Preserve the existing separation between routes, controllers, and services; handle invalid or nonexistent IDs; update the OpenAPI document; and verify the endpoint.

- **Resolution:** Added an atomic `PENDING` to `CONFIRMED` update in the service, with an idempotent response for an already confirmed reservation. A cancelled reservation returns `409`; an invalid ID returns `400`; a missing ID returns `404`. The controller and route were connected, and `docs/openapi.yaml` was updated. Manual HTTP tests against the local MongoDB instance verified `PENDING` to `CONFIRMED` (`200`), repeat confirmation (`200`), cancelled to confirmed (`409`), invalid ID (`400`), and missing ID (`404`). The temporary pending test record was removed afterward. Type checking, build, lint, and format checks passed.
