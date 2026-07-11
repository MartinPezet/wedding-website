# Add TDD/BDD Workflow

## Why

The repo has no test runner, no test script, and no testing conventions — TDD is currently impossible. Six active changes are about to be implemented with verification tacked on last, which bakes in an anti-TDD ordering. Making the repo AI-native means an agent must be able to spec, test-first, implement, and verify without human hand-holding: specs need an executable form, and the workflow needs rules that enforce test-first ordering.

## What Changes

- Fork the `spec-driven` OpenSpec schema into a project-local `spec-driven-bdd` schema that:
  - Adds a `features` artifact: Gherkin `.feature` files derived from spec scenarios (spec.md stays canonical; `.feature` is the executable projection, traced via tags).
  - Rewrites the `tasks` instruction so every task group is TDD-shaped (failing feature test first, then implement, then refactor).
  - Rewrites the `apply` instruction to enforce red-green-refactor and running tests after each task.
- Add test infrastructure: Vitest, `@nuxt/test-utils`, `@amiceli/vitest-cucumber`; `npm test` script wired to run `.feature`-driven specs and unit tests.
- Add `CLAUDE.md`: commands (dev/test/lint/typecheck), tech stack, coding standards, TDD rule, `.feature` conventions, OpenSpec workflow pointer.
- Fill in `openspec/config.yaml` project context (tech stack, conventions) so artifact generation is grounded.
- Migrate the 6 active changes (all 0% complete) to the `spec-driven-bdd` schema: flip `.openspec.yaml`, generate `.feature` files from existing scenarios, restructure each `tasks.md` TDD-shaped.

## Capabilities

### New Capabilities
- `dev-workflow`: How code gets built in this repo — TDD rules, executable Gherkin feature specs, test commands, and the AI-facing conventions (CLAUDE.md, schema, config) that enforce them.

### Modified Capabilities

<!-- none — existing runtime capabilities (site-gate, design-system, etc.) are unchanged; this change is process/tooling only -->

## Impact

- **New deps (dev)**: `vitest`, `@nuxt/test-utils`, `@amiceli/vitest-cucumber`, `happy-dom`.
- **New files**: `CLAUDE.md`, `vitest.config.ts`, `openspec/schemas/spec-driven-bdd/**`, `tests/**`.
- **Modified**: `package.json` (test script), `openspec/config.yaml`, each active change's `.openspec.yaml` + `tasks.md` + new `tests/features/*.feature`.
- **Not touched**: application runtime code, existing main specs (`openspec/specs/**` markdown stays source of truth — archive/sync machinery unaffected).
