# site-gate

## Purpose

Password protection for the whole public site: shared-password entry, session cookie, rate limiting, an OG-friendly gate page so shared links still preview, and a QR-token bypass that authenticates and identifies invited parties.

## Requirements

### Requirement: Site is password protected
The system SHALL require visitors to authenticate before viewing any public page. Unauthenticated visitors SHALL be redirected to a gate page where they can enter a shared password. A correct password SHALL establish a session cookie granting access to the whole public site.

#### Scenario: Unauthenticated visitor is gated
- **WHEN** a visitor without a valid session requests any public page
- **THEN** they are redirected to the gate page and the requested content is not served

#### Scenario: Correct shared password unlocks the site
- **WHEN** a visitor submits the correct shared password on the gate page
- **THEN** a session cookie is set and they are redirected to the home page

#### Scenario: Incorrect password is rejected
- **WHEN** a visitor submits an incorrect password
- **THEN** an error message is shown and no session is created

### Requirement: Password attempts are rate limited
The system SHALL rate limit password attempts per client IP, delaying or rejecting attempts after repeated failures.

#### Scenario: Repeated failures are throttled
- **WHEN** a client fails password entry 5 times in a short window
- **THEN** subsequent attempts from that client are delayed or rejected with a "try again later" message

### Requirement: Gate page serves link previews
The gate page SHALL include Open Graph meta tags (title, description, image) so links shared to messaging apps and social platforms render a preview despite the password protection.

#### Scenario: Link shared to a messaging app
- **WHEN** a crawler fetches any site URL without a session
- **THEN** the response includes OG title, description, and image tags

### Requirement: QR token bypasses the password gate
A URL carrying a valid party token SHALL authenticate the visitor without a password, set the same session cookie as the password path, and attach the party's identity to the session for RSVP pre-identification. Token matching SHALL be case-insensitive.

#### Scenario: Valid token unlocks and identifies
- **WHEN** a visitor opens any site URL with a valid party token parameter
- **THEN** they are granted a session without entering the password and their party context is attached to the session

#### Scenario: Invalid token falls back
- **WHEN** a visitor opens a URL with an invalid or unknown token
- **THEN** they are sent to the password gate with a friendly message (no error detail leaking token validity semantics)

#### Scenario: Token matches regardless of letter case
- **WHEN** a visitor manually types a valid party token with different letter casing than it was generated in
- **THEN** they are granted a session and identified exactly as if the casing matched

### Requirement: Gated visitors are offered no navigation
While a visitor has no session, the site chrome SHALL offer no navigation to gated pages: the nav links, the mobile menu control, and the home link on the site header SHALL all be withheld, so the only route onward is through the password gate. Once a session exists the full navigation SHALL be restored. This is presentation only — route protection remains enforced independently.

#### Scenario: No navigation before the gate
- **WHEN** a visitor without a session is shown the gate page
- **THEN** the header offers no navigation links, no menu control, and no link to the home page

#### Scenario: Navigation returns after sign-in
- **WHEN** a visitor with a valid session views any gated page
- **THEN** the full site navigation is shown

#### Scenario: Hiding navigation is not the access control
- **WHEN** a visitor without a session requests a gated route directly
- **THEN** they are redirected to the gate regardless of whether any link to it was rendered
