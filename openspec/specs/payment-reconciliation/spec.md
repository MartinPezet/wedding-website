# payment-reconciliation Specification

## Purpose
Admin-triggered Monzo sync that matches incoming credits to parties' room payments, with manual assignment for anything unrecognised, while keeping the couple's non-wedding activity on the shared joint account out of the database. Created by archiving change add-payment-and-room-allocation.

## Requirements
### Requirement: Admin-triggered Monzo reconciliation
The system SHALL reconcile room payments only when an admin asks it to. Each run SHALL begin with the admin authorising Monzo afresh, fetch transactions once, and discard the access token when the run ends. The system SHALL NOT poll Monzo, subscribe to webhooks, or store any Monzo access or refresh token.

#### Scenario: Admin runs a check
- **WHEN** an admin authorises Monzo and the check runs
- **THEN** transactions are fetched once, payments are matched, and no Monzo token is left stored

#### Scenario: No credentials configured
- **WHEN** the Monzo client credentials are absent from runtime config
- **THEN** the reconciliation page reports itself unavailable and no authorisation is attempted

#### Scenario: Authorisation refused
- **WHEN** the admin declines the Monzo authorisation or the callback carries an error
- **THEN** the run is abandoned, nothing is stored, and the last-checked time is unchanged

### Requirement: Only incoming credits since the last successful check
The system SHALL consider only transactions with a positive amount, and only those dated since the last successful check. The last-checked time SHALL advance only when a run completes successfully.

#### Scenario: Spending ignored
- **WHEN** the fetched transactions include card payments and direct debits
- **THEN** none of them are considered for matching

#### Scenario: Window advances on success
- **WHEN** a check completes successfully
- **THEN** the last-checked time is updated to that run's time

#### Scenario: Window held on failure
- **WHEN** a check fails partway through
- **THEN** the last-checked time is left as it was, so the next run covers the same period

### Requirement: Match order is reference, then payer name, then amount
The system SHALL attempt to match each credit to a party in a fixed order: the payment reference `RSVP-<partyId>` first, the payer's name against that party's guest names second, and the amount against the party's outstanding balance last. A credit that matches two or more parties equally SHALL be treated as unmatched rather than assigned to either.

#### Scenario: Reference wins
- **WHEN** a credit carries the reference of one party and an amount equal to a different party's balance
- **THEN** it is matched to the party named by the reference

#### Scenario: Name used when no reference
- **WHEN** a credit carries no recognisable reference but the payer's name matches a guest on exactly one party
- **THEN** it is matched to that party

#### Scenario: Amount alone is not enough to pick between parties
- **WHEN** a credit has no reference, no matching payer name, and its amount equals the outstanding balance of two parties
- **THEN** it is left unmatched

### Requirement: Matched payments are recorded and never double-counted
The system SHALL record each matched payment against its Monzo transaction id. A party's amount paid SHALL be the sum of its recorded payments. Running a check again SHALL NOT record a transaction that has already been recorded.

#### Scenario: Payment recorded
- **WHEN** a credit is matched to a party
- **THEN** a payment is recorded for that party and the party's amount paid rises by the credit's amount

#### Scenario: Re-running a check
- **WHEN** a check runs twice over a period containing the same transaction
- **THEN** the transaction is recorded once and the party's amount paid is unchanged by the second run

#### Scenario: Manual override still reconciles
- **WHEN** an admin records a payment by hand for cash or a transfer made outside the link
- **THEN** it is recorded with no transaction id and counts towards the party's amount paid

### Requirement: Unmatched credits are shown once and never stored
The system SHALL return unmatched credits in the response of the check so the admin can assign one to a party, and SHALL NOT persist any detail of a credit that has not been assigned. Assigning an unmatched credit SHALL record it as a payment; dismissing one SHALL store nothing.

#### Scenario: Unmatched credit offered for assignment
- **WHEN** a check finds a credit it cannot match
- **THEN** it is shown to the admin for assignment and nothing about it is written to the database

#### Scenario: Dismissed credit leaves no trace
- **WHEN** the admin dismisses an unmatched credit
- **THEN** no record of it exists after the page is closed

#### Scenario: Assigned credit becomes a payment
- **WHEN** the admin assigns an unmatched credit to a party
- **THEN** a payment is recorded for that party carrying the credit's transaction id and amount

### Requirement: Reconciliation freshness is visible
The admin SHALL be able to see when the last successful check ran. Because transactions older than ninety days cannot be fetched, the system SHALL warn the admin as that window approaches.

#### Scenario: Last check shown
- **WHEN** the admin opens the payments page
- **THEN** the time of the last successful check is shown

#### Scenario: Stale check warned
- **WHEN** the last successful check is approaching ninety days old
- **THEN** the admin is warned that older transactions will become unreachable
