@payment-reconciliation
Feature: Payment reconciliation
  Admin-triggered Monzo sync that matches incoming credits to parties, with manual assignment for the rest.

  @req:admin-triggered-monzo-reconciliation
  Rule: Admin-triggered Monzo reconciliation
    Every run is authorised by hand, fetches once, and leaves no stored token.

    Scenario: Admin runs a check
      Given an admin who has authorised Monzo
      When the check runs
      Then transactions are fetched once, payments are matched, and no Monzo token is left stored

    Scenario: No credentials configured
      Given Monzo client credentials absent from runtime config
      When the admin opens the reconciliation page
      Then it reports itself unavailable and no authorisation is attempted

    Scenario: Authorisation refused
      Given an admin who declines the Monzo authorisation
      When the callback is processed
      Then the run is abandoned, nothing is stored, and the last-checked time is unchanged

  @req:only-incoming-credits-since-the-last-successful-check
  Rule: Only incoming credits since the last successful check
    Debits are discarded, the window starts at the last success, and only success advances it.

    Scenario: Spending ignored
      Given fetched transactions including card payments and direct debits
      When the check matches them
      Then none of them are considered for matching

    Scenario: Window advances on success
      Given a check that completes successfully
      When it finishes
      Then the last-checked time is updated to that run's time

    Scenario: Window held on failure
      Given a check that fails partway through
      When it aborts
      Then the last-checked time is left as it was, so the next run covers the same period

  @req:match-order-is-reference-then-payer-name-then-amount
  Rule: Match order is reference, then payer name, then amount
    Reference beats name, name beats amount, and an ambiguous credit is never assigned.

    Scenario: Reference wins
      Given a credit carrying one party's reference and an amount equal to another party's balance
      When the credit is matched
      Then it is matched to the party named by the reference

    Scenario: Name used when no reference
      Given a credit with no recognisable reference whose payer name matches a guest on exactly one party
      When the credit is matched
      Then it is matched to that party

    Scenario: Amount alone is not enough to pick between parties
      Given a credit with no reference, no matching payer name, and an amount equal to two parties' balances
      When the credit is matched
      Then it is left unmatched

  @req:matched-payments-are-recorded-and-never-double-counted
  Rule: Matched payments are recorded and never double-counted
    Payments key on the Monzo transaction id; amount paid is their sum.

    Scenario: Payment recorded
      Given a credit that matches a party
      When the credit is recorded
      Then a payment is recorded for that party and the party's amount paid rises by the credit's amount

    Scenario: Re-running a check
      Given a transaction already recorded by an earlier check
      When a check runs again over the same period
      Then the transaction is recorded once and the party's amount paid is unchanged by the second run

    Scenario: Manual override still reconciles
      Given an admin recording a cash payment by hand
      When it is saved
      Then it is recorded with no transaction id and counts towards the party's amount paid

  @req:unmatched-credits-are-shown-once-and-never-stored
  Rule: Unmatched credits are shown once and never stored
    Nothing about an unassigned credit reaches the database — the account carries non-wedding income.

    Scenario: Unmatched credit offered for assignment
      Given a check that finds a credit it cannot match
      When the check returns
      Then the credit is shown to the admin for assignment and nothing about it is written to the database

    Scenario: Dismissed credit leaves no trace
      Given an unmatched credit shown to the admin
      When the admin dismisses it
      Then no record of it exists afterwards

    Scenario: Assigned credit becomes a payment
      Given an unmatched credit shown to the admin
      When the admin assigns it to a party
      Then a payment is recorded for that party carrying the credit's transaction id and amount

  @req:reconciliation-freshness-is-visible
  Rule: Reconciliation freshness is visible
    The ninety-day fetch limit makes staleness a real failure mode, so it is surfaced.

    Scenario: Last check shown
      Given a previous successful check
      When the admin opens the payments page
      Then the time of the last successful check is shown

    Scenario: Stale check warned
      Given a last successful check approaching ninety days old
      When the admin opens the payments page
      Then the admin is warned that older transactions will become unreachable
