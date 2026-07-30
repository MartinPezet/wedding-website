## MODIFIED Requirements

### Requirement: Secure party tokens
Each party token SHALL be 10 characters drawn from the Crockford base32 alphabet (`0-9`, `A-Z` excluding `I`, `L`, `O`, `U`) and be unique. Tokens SHALL be usable in URLs and short/unambiguous enough for a guest to transcribe by hand from a printed letter.

#### Scenario: Token generation
- **WHEN** a party is created
- **THEN** it receives a unique 10-character token drawn from the Crockford base32 alphabet
