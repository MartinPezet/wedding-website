@<capability>
Feature: <!-- capability title -->
  <!-- one-line purpose, from the spec's Purpose section -->

  @req:<requirement-slug>
  Rule: <!-- requirement name, verbatim from `### Requirement:` -->
    <!-- requirement SHALL text -->

    Scenario: <!-- scenario name, verbatim from `#### Scenario:` -->
      Given <!-- precondition implied by the requirement -->
      When <!-- action, from **WHEN** -->
      Then <!-- observable outcome, from **THEN** -->

    @manual
    Scenario: <!-- scenario that cannot be automated yet -->
      When <!-- ... -->
      Then <!-- ... -->
