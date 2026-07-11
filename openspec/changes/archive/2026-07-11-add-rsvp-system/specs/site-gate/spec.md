## ADDED Requirements

### Requirement: QR token bypasses the password gate
A URL carrying a valid party token SHALL authenticate the visitor without a password, set the same session cookie as the password path, and attach the party's identity to the session for RSVP pre-identification.

#### Scenario: Valid token unlocks and identifies
- **WHEN** a visitor opens any site URL with a valid party token parameter
- **THEN** they are granted a session without entering the password and their party context is attached to the session

#### Scenario: Invalid token falls back
- **WHEN** a visitor opens a URL with an invalid or unknown token
- **THEN** they are sent to the password gate with a friendly message (no error detail leaking token validity semantics)
