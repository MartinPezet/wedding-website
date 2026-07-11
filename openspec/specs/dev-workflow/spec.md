# dev-workflow

## Purpose

How code gets built in this repo — TDD rules, executable Gherkin feature specs, test commands, and the AI-facing conventions (CLAUDE.md, spec-driven-bdd schema, openspec config) that enforce them.

## Requirements

### Requirement: Repo has a runnable test suite
The repo SHALL provide a test runner executable via `npm test` that discovers and runs all unit tests and Gherkin feature specs, exiting non-zero on any failure.

#### Scenario: Test command runs the whole suite
- **WHEN** a developer or agent runs `npm test`
- **THEN** all unit tests and `.feature`-driven specs execute and the command exits non-zero if any fail

#### Scenario: Feature files are executable
- **WHEN** a `.feature` file exists under `tests/features/` with step definitions
- **THEN** `npm test` executes its scenarios as test cases

### Requirement: Specs project to Gherkin feature files
Each capability spec SHALL have a corresponding Gherkin `.feature` file under `tests/features/`, generated from its scenarios. The `.feature` file SHALL trace back to the spec via tags: `@<capability>` on the Feature and `@req:<requirement-slug>` on each Rule. Markdown specs in `openspec/specs/` remain the source of truth; `.feature` files are the executable projection.

#### Scenario: Spec scenario maps to Gherkin
- **WHEN** a spec requirement contains a `#### Scenario:` with WHEN/THEN steps
- **THEN** the corresponding `.feature` file contains a `Rule:` for the requirement and a `Scenario:` with Given/When/Then steps tagged `@req:<requirement-slug>`

#### Scenario: Feature file drifts from spec
- **WHEN** a requirement's scenarios change in a delta spec during a change
- **THEN** the change's tasks include regenerating the affected `.feature` file before implementation tasks

### Requirement: OpenSpec workflow enforces TDD
The project SHALL use a project-local OpenSpec schema (`spec-driven-bdd`, forked from `spec-driven`) whose `tasks` and `apply` instructions enforce test-first development: every task group SHALL start with writing failing feature/unit tests, implementation tasks follow, and the apply loop SHALL run the test suite after each completed task.

#### Scenario: Task lists are TDD-shaped
- **WHEN** an agent generates `tasks.md` for a change using the `spec-driven-bdd` schema
- **THEN** each task group orders test-writing tasks before implementation tasks

#### Scenario: Apply loop is red-green-refactor
- **WHEN** an agent implements a task via the apply workflow
- **THEN** it writes or has a failing test first, implements until green, and runs `npm test` before marking the task complete

#### Scenario: New changes get the BDD schema
- **WHEN** a new change is created in this repo
- **THEN** it uses the `spec-driven-bdd` schema and includes a `features` artifact

### Requirement: Repo carries AI-facing conventions
The repo SHALL contain a root `CLAUDE.md` documenting the commands (dev, test, lint, typecheck), tech stack, coding standards, the TDD rule, and `.feature` conventions. `openspec/config.yaml` SHALL carry project context (stack, conventions) so generated artifacts are grounded.

#### Scenario: Agent reads conventions at session start
- **WHEN** an AI agent starts a session in this repo
- **THEN** CLAUDE.md tells it how to run tests, what standards apply, and that TDD is mandatory

#### Scenario: Artifact generation uses project context
- **WHEN** an agent generates an OpenSpec artifact
- **THEN** the instructions include the tech stack and conventions from `openspec/config.yaml`

### Requirement: Active changes are migrated to the BDD workflow
All in-flight changes with zero completed tasks SHALL be migrated to the `spec-driven-bdd` schema: `.openspec.yaml` updated, `.feature` files generated from their existing delta-spec scenarios, and `tasks.md` restructured so tests precede implementation.

#### Scenario: Migrated change is apply-ready under new schema
- **WHEN** a migrated change is opened with `openspec status`
- **THEN** it reports the `spec-driven-bdd` schema with all planning artifacts (including features) present

#### Scenario: Migrated tasks are TDD-ordered
- **WHEN** a migrated change's `tasks.md` is read
- **THEN** each task group starts with writing the failing feature/unit tests for that group's scenarios
