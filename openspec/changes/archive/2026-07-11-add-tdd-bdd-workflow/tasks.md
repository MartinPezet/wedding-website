## 1. Schema Fork

- [x] 1.1 `openspec schema fork spec-driven spec-driven-bdd`; verify files land in `openspec/schemas/spec-driven-bdd/`
- [x] 1.2 Add `features` artifact to schema.yaml: `generates: "features/**/*.feature"` (change-root-relative; installed to `tests/features/` at apply time per design D2), `requires: [specs]`, instruction with the spec→Gherkin mapping table (Feature per capability, Rule per requirement, tags `@<capability>` / `@req:<slug>`, `@manual` escape hatch) + template `feature.feature`
- [x] 1.3 Rewrite `tasks` instruction: each group starts with test-writing task, verification folded into groups; add `features` to tasks `requires`
- [x] 1.4 Rewrite `apply` instruction: red-green-refactor, `npm test` after each task, no task complete on red suite (except test-writing tasks)
- [x] 1.5 `openspec schema validate spec-driven-bdd`; set `schema: spec-driven-bdd` as default in `openspec/config.yaml`

## 2. Test Infrastructure

- [x] 2.1 Add dev deps: `vitest`, `@nuxt/test-utils`, `@amiceli/vitest-cucumber`, `happy-dom`; add `"test": "vitest run"` and `"test:watch": "vitest"` scripts
- [x] 2.2 Create `vitest.config.ts` via `@nuxt/test-utils` `defineVitestConfig`; test layout `tests/{features,steps,unit}`
- [x] 2.3 Smoke-prove the loop: write `tests/features/dev-workflow.feature` (from this change's spec scenarios that are automatable) + step defs; confirmed red (6 scenarios fail pending groups 3–4, which turn them green)

## 3. AI-Facing Conventions

- [x] 3.1 Fill `openspec/config.yaml` `context:` — stack, conventions, TDD rule
- [x] 3.2 Write root `CLAUDE.md`: commands, stack, coding standards, TDD rule, `.feature` mapping pointer, OpenSpec workflow pointer

## 4. Migrate Active Changes

- [x] 4.1 Flip `schema: spec-driven-bdd` in all active changes' `.openspec.yaml` (6 + this bootstrap change)
- [x] 4.2 Generate staged `features/<capability>.feature` in each change dir from its delta specs (content-pages, photo-frames, guest-data, rsvp-flow, site-gate merged projection, admin-auth, guest-admin, data-export, seating-editor, print-materials, infra-terraform, ci-cd — `@manual` applied where not automatable; installed to tests/features/ at apply time per design D2)
- [x] 4.3 Restructure each change's `tasks.md`: prepend test-writing task per group, fold trailing verification sections into groups
- [x] 4.4 `openspec validate --all` (9/9 pass) and `openspec status` per change — all report spec-driven-bdd, 5/5 artifacts, apply-ready

## 5. Verify Whole Workflow

- [x] 5.1 `npm test` (30/30), `npm run lint`, `npm run typecheck` all green
- [x] 5.2 Dry-run: `openspec instructions tasks --change add-rsvp-system --json` shows TDD instruction + project context; feature files staged for its capabilities
