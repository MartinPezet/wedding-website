# Design: TDD/BDD Workflow

## Context

Nuxt 4 + TypeScript + Tailwind repo, zero test infrastructure. OpenSpec 1.6.0 manages changes via the stock `spec-driven` schema; 6 active changes exist, all 0% implemented, with verification ordered last in their task lists. OpenSpec's experimental `schema fork` supports project-local schemas resolved from `openspec/schemas/<name>/`. Existing spec scenarios already use WHEN/THEN, so translation to Gherkin is near-mechanical.

## Goals / Non-Goals

**Goals:**
- Executable specs: every capability's scenarios runnable as tests via `.feature` files.
- Workflow-enforced TDD: schema instructions make test-first the default path for any agent.
- AI-native repo: an agent landing cold has commands, standards, and workflow rules in CLAUDE.md.
- Migrate in-flight changes before implementation starts (cheapest moment).

**Non-Goals:**
- Browser e2e (playwright-bdd) — add later when gate/RSVP UI flows exist; same `.feature` files can be reused.
- Test coverage targets or CI wiring — belongs to the existing `add-infra-deployment` change (ci-cd spec).
- Replacing markdown specs with `.feature` files — archive/sync parses markdown deltas; `.feature` is a projection, not the source of truth.
- Retroactive tests for existing scaffold code beyond what feature specs cover.

## Decisions

### D1: Fork schema rather than config.yaml rules
`config.yaml` rules can nudge task ordering but cannot add a new artifact. The `features` artifact requires a schema. One fork carries both the artifact and the TDD instructions. Fork named `spec-driven-bdd`, lives at `openspec/schemas/spec-driven-bdd/` (project-local, versioned with the repo).

### D2: `.feature` files are staged in the change dir, installed to `tests/features/`
OpenSpec resolves artifact `generates` paths relative to the change root, so the `features` artifact generates `features/**/*.feature` inside the change dir (planning projection). Each task group's first test-writing task installs the relevant file to `tests/features/<capability>.feature` (overwriting), where step definitions and the runner resolve it from a stable path that outlives the archived change. Drift window is within a single change; tags keep spec traceability.

Mapping schema (the "specific schema extending spec-driven" contract):

| spec.md construct | .feature construct |
|---|---|
| capability (`specs/<name>/`) | one `Feature:` file: `tests/features/<name>.feature`, tagged `@<name>` |
| `### Requirement: X` | `Rule: X` tagged `@req:<kebab-slug-of-X>` |
| requirement SHALL text | Rule description line(s) |
| `#### Scenario: Y` | `Scenario: Y` |
| **WHEN** / **THEN** bullets | `When` / `Then` steps (add `Given` for preconditions implied by the requirement) |

### D3: Test stack — Vitest + @nuxt/test-utils + @amiceli/vitest-cucumber
- `vitest` — runner; already the Nuxt-ecosystem default.
- `@nuxt/test-utils` — Nuxt environment for component/server-route tests (`// @vitest-environment nuxt` opt-in per file to keep plain unit tests fast).
- `@amiceli/vitest-cucumber` — parses `.feature` files and binds scenarios to step definitions inside vitest; in-process, no separate cucumber runner.
- `happy-dom` — DOM env for component tests.
- Layout: `tests/features/*.feature` (Gherkin), `tests/steps/*.steps.ts` (step definitions), `tests/unit/**` (plain unit tests). `npm test` = `vitest run`.

Alternative considered: `playwright-bdd` — real browser, strongest spec=test story, but heavyweight before any UI exists. Deferred (Non-Goal).

### D4: TDD granularity — per task group, pragmatic
Each task group: X.1 write failing tests for the group's scenarios → X.2..n implement until green → last task refactor/lint/typecheck pass. Apply instruction requires `npm test` after every task and forbids marking a task complete with a red suite (exception: the deliberate red of an X.1 test-writing task). Strict per-line TDD rejected — noise for an agent workflow, no extra safety.

### D5: Migration of 6 active changes is task work in this change
Flip `schema:` in each `.openspec.yaml`, generate `tests/features/<capability>.feature` from each change's delta specs, restructure each `tasks.md` (prepend test-writing task per group, append verification into groups rather than a trailing section). All changes are 0% done so no completed-task bookkeeping is lost.

### D6: CLAUDE.md content
Single root file, terse: commands table (dev/test/lint/typecheck), stack summary, coding standards (TS strict, Vue SFC conventions, Tailwind tokens per design-system spec), the TDD rule (no implementation before failing test), `.feature` mapping table pointer, OpenSpec workflow pointer (`/opsx:*`). `openspec/config.yaml` gets `context:` (stack + conventions) so artifact generation is grounded without reading CLAUDE.md.

## Risks / Trade-offs

- [Schema commands are experimental] → fork output is plain files in-repo; if CLI changes, files still readable/editable by hand; pin behavior by validating with `openspec schema validate spec-driven-bdd` in tasks.
- [.feature/spec drift] → tags make drift greppable; schema `features` instruction requires regeneration when delta specs touch scenarios; drift check is manual for now (CI hook belongs to add-infra-deployment).
- [vitest-cucumber is a small community lib] → thin dependency; if abandoned, `.feature` files are standard Gherkin — portable to cucumber-js or playwright-bdd without rewriting specs.
- [Some existing scenarios aren't unit-testable yet (e.g. OG crawler preview)] → step definitions may assert at whatever level is currently reachable (server route response), or mark scenario `@manual` — schema instruction defines `@manual` as the escape hatch, keeping the projection total.

## Migration Plan

1. Land schema + test infra + CLAUDE.md (this change's tasks).
2. Migrate the 6 active changes (also this change's tasks).
3. Future changes: `openspec new change` picks up `spec-driven-bdd` via `openspec/config.yaml` `schema:` default.
4. Rollback: delete `openspec/schemas/spec-driven-bdd`, revert `.openspec.yaml` files to `spec-driven`, keep tests (harmless).
