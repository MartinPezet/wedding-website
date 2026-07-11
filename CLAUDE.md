# Wedding Website

Password-gated wedding site. Nuxt 4 + Vue 3 + TypeScript (strict) + Tailwind CSS v4, `nuxt-auth-utils` sessions. App code in `app/`, server routes in `server/`.

## Commands

| Command | What |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Full suite: unit tests + Gherkin feature specs (vitest, one-shot) |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint (`@nuxt/eslint`) |
| `npm run typecheck` | `nuxt typecheck` (vue-tsc) |

## TDD — mandatory

Red-green-refactor. Never write implementation code before a failing test exists for it. Run `npm test` after every task; an implementation task is not done while the suite is red. Only test-writing tasks may end red (and only their new scenarios).

## Specs & feature files

- Work flows through OpenSpec (`/opsx:propose` → `/opsx:apply` → `/opsx:archive`), schema `spec-driven-bdd` at `openspec/schemas/spec-driven-bdd/schema.yaml`.
- Markdown specs (`openspec/specs/<capability>/spec.md`) are the source of truth. Each capability projects to an executable Gherkin file at `tests/features/<capability>.feature`.
- Mapping: capability → `Feature:` tagged `@<capability>`; `### Requirement:` → `Rule:` tagged `@req:<slug>`; `#### Scenario:` WHEN/THEN → `Scenario:` Given/When/Then. Non-automatable scenarios carry `@manual` (skipped by runner).
- Step definitions: `tests/steps/*.steps.ts` (`@amiceli/vitest-cucumber`). Plain unit tests: `tests/unit/*.test.ts`.

## Coding standards

- TypeScript strict; no `any` unless unavoidable and commented.
- Vue SFCs: `<script setup lang="ts">`, composables over mixins, props typed.
- Tailwind v4 tokens per the design-system spec (`openspec/specs/design-system/spec.md`); mobile-first.
- Validate all input server-side at trust boundaries (gate, RSVP endpoints).
- Prefer platform/stdlib/Nuxt built-ins over new dependencies.
- Commits: `<gitmoji>WW: <summary>` (e.g. `✨WW: Add RSVP flow`).
