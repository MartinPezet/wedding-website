## ADDED Requirements

### Requirement: Admin area requires separate login
The system SHALL protect all admin pages and admin API routes behind an admin login distinct from the public site gate. A public-site session SHALL NOT grant admin access.

#### Scenario: Guest session cannot reach admin
- **WHEN** a visitor with only a public-site session requests an admin page or admin API route
- **THEN** access is denied and they are redirected to the admin login

#### Scenario: Admin login succeeds
- **WHEN** the correct admin password is submitted
- **THEN** an admin session is established and admin pages become accessible

### Requirement: Admin login is rate limited
Admin password attempts SHALL be rate limited per client IP with backoff after repeated failures.

#### Scenario: Brute force throttled
- **WHEN** a client fails admin login 5 times in a short window
- **THEN** further attempts from that client are delayed or rejected

### Requirement: Admin API enforced server-side
Every admin API route SHALL verify the admin session server-side, independent of any UI routing.

#### Scenario: Direct API call without session
- **WHEN** an admin API endpoint is called without a valid admin session (or backup bearer secret where applicable)
- **THEN** the request is rejected with an authorisation error
