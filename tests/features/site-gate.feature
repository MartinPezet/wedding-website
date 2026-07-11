@site-gate
Feature: Site gate
  Shared-password protection with session cookies, rate limiting, OG-friendly gate page, and QR token bypass.

  @req:site-is-password-protected
  Rule: Site is password protected
    Visitors authenticate before viewing any public page.

    Scenario: Unauthenticated visitor is gated
      Given a visitor without a valid session
      When they request any public page
      Then they are redirected to the gate page and the requested content is not served

    Scenario: Correct shared password unlocks the site
      Given a visitor on the gate page
      When they submit the correct shared password
      Then a session cookie is set and they are redirected to the home page

    Scenario: Incorrect password is rejected
      Given a visitor on the gate page
      When they submit an incorrect password
      Then an error message is shown and no session is created

  @req:password-attempts-are-rate-limited
  Rule: Password attempts are rate limited
    Attempts are throttled per client IP.

    Scenario: Repeated failures are throttled
      Given a client that has failed password entry 5 times in a short window
      When it attempts again
      Then the attempt is delayed or rejected with a try-again-later message

  @req:gate-page-serves-link-previews
  Rule: Gate page serves link previews
    Open Graph tags render previews despite the password.

    Scenario: Link shared to a messaging app
      Given a crawler without a session
      When it fetches any site URL
      Then the response includes OG title, description, and image tags

  @req:qr-token-bypasses-the-password-gate
  Rule: QR token bypasses the password gate
    Valid party tokens authenticate without a password and identify the party.

    Scenario: Valid token unlocks and identifies
      Given a valid party token parameter
      When a visitor opens any site URL carrying it
      Then a session is granted without a password and the party context is attached to the session

    Scenario: Invalid token falls back
      Given an invalid or unknown token parameter
      When a visitor opens a URL carrying it
      Then they are sent to the password gate with a friendly message that does not leak token validity semantics
