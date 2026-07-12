@admin-auth
Feature: Admin auth
  Separate admin login with rate limiting and server-side API enforcement.

  @req:admin-area-requires-separate-login
  Rule: Admin area requires separate login
    Public-site sessions never grant admin access.

    Scenario: Guest session cannot reach admin
      Given a visitor with only a public-site session
      When they request an admin page or admin API route
      Then access is denied and they are redirected to the admin login

    Scenario: Admin login succeeds
      Given the admin login page
      When the correct admin password is submitted
      Then an admin session is established and admin pages become accessible

  @req:admin-login-is-rate-limited
  Rule: Admin login is rate limited
    Repeated failures back off per client IP.

    Scenario: Brute force throttled
      Given a client that has failed admin login 5 times in a short window
      When it attempts again
      Then the attempt is delayed or rejected

  @req:admin-api-enforced-server-side
  Rule: Admin API enforced server-side
    Every admin API route verifies the admin session independent of UI routing.

    Scenario: Direct API call without session
      Given no valid admin session or backup bearer secret
      When an admin API endpoint is called directly
      Then the request is rejected with an authorisation error
