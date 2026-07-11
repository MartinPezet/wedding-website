@dev-workflow
Feature: Dev workflow
  TDD/BDD conventions this repo enforces for AI-native development.

  @req:repo-has-a-runnable-test-suite
  Rule: Repo has a runnable test suite
    npm test runs all unit tests and Gherkin feature specs.

    Scenario: Test command runs the whole suite
      Given the repo package.json
      When its scripts are read
      Then a test script invoking vitest exists

    Scenario: Feature files are executable
      Given a feature file under tests/features/
      When the suite runs
      Then its scenarios execute as test cases

  @req:specs-project-to-gherkin-feature-files
  Rule: Specs project to Gherkin feature files
    Each capability spec has a .feature projection traced via tags.

    Scenario: Spec scenario maps to Gherkin
      Given the dev-workflow capability spec
      When the projected feature file is read
      Then it contains a tagged Rule for each requirement

    @manual
    Scenario: Feature file drifts from spec
      When a requirement's scenarios change in a delta spec
      Then the change's tasks include regenerating the affected feature file

  @req:openspec-workflow-enforces-tdd
  Rule: OpenSpec workflow enforces TDD
    The spec-driven-bdd schema mandates test-first ordering.

    Scenario: Task lists are TDD-shaped
      Given the spec-driven-bdd schema
      When the tasks instruction is read
      Then it requires each group to start with a failing-test task

    Scenario: Apply loop is red-green-refactor
      Given the spec-driven-bdd schema
      When the apply instruction is read
      Then it forbids implementation before a failing test exists

    Scenario: New changes get the BDD schema
      Given the openspec config
      When the default schema is read
      Then it is spec-driven-bdd

  @req:repo-carries-ai-facing-conventions
  Rule: Repo carries AI-facing conventions
    CLAUDE.md and openspec config ground agents in repo conventions.

    Scenario: Agent reads conventions at session start
      Given the repo root
      When CLAUDE.md is read
      Then it documents the test command and the TDD rule

    Scenario: Artifact generation uses project context
      Given the openspec config
      When the context field is read
      Then it describes the tech stack and conventions

  @req:active-changes-are-migrated-to-the-bdd-workflow
  Rule: Active changes are migrated to the BDD workflow
    In-flight changes use spec-driven-bdd with TDD-ordered tasks.

    Scenario: Migrated change is apply-ready under new schema
      Given every migrated active change in openspec/changes
      When its openspec yaml is read
      Then the schema is spec-driven-bdd

    Scenario: Migrated tasks are TDD-ordered
      Given every migrated active change in openspec/changes
      When its tasks file is read
      Then each task group starts with a test-writing task
