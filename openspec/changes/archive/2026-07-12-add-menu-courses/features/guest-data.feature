@guest-data
Feature: Guest data
  Party and guest persistence with secure tokens and runtime settings.

  @req:party-and-guest-data-model
  Rule: Party and guest data model
    Parties own fixed guest lists; guests carry RSVP fields with one meal choice
    per course (starter, main, dessert), each nullable.

    Scenario: Party with guests stored
      Given a party created with two guests
      When the party is retrieved
      Then both guests are returned, each with independent RSVP fields including per-course meal choices

    Scenario: Parties cannot add guests
      Given a party with recorded guests
      When the party submits an RSVP referencing an unknown guest
      Then only guests already recorded for that party are accepted and no new guest rows are created

    Scenario: Legacy meal choice migrated
      Given data holding single meal choices from before the per-course model
      When the per-course migration runs
      Then each existing choice is preserved as that guest's main-course choice

  @req:secure-party-tokens
  Rule: Secure party tokens
    Tokens are 32 random bytes, unique, URL-safe.

    Scenario: Token generation
      Given a new party
      When it is created
      Then it receives a unique URL-safe token derived from 32 cryptographically random bytes

  @req:settings-storage
  Rule: Settings storage
    Wedding date and RSVP deadline live in the database.

    Scenario: Deadline read at runtime
      Given a stored RSVP deadline setting
      When the deadline setting is changed
      Then subsequent RSVP submissions validate against the new deadline without redeploying

  @req:database-works-locally-and-in-production
  Rule: Database works locally and in production
    Local SQLite file in dev, Turso in production, chosen by environment.

    Scenario: Environment switch
      Given the database URL env var pointing at a local file or a Turso database
      When data operations run
      Then they behave identically in both environments
