@room-allocation
Feature: Room allocation
  Manual pairing of match-me requests, the combined rooming picture, and the venue rooming list.

  @req:admin-pairs-match-me-requests-by-hand
  Rule: Admin pairs match-me requests by hand
    Same night, match-me only, symmetric, never automatic.

    Scenario: Two match-me requests paired
      Given two unpaired match-me requests for the same night
      When the admin pairs them
      Then each request records the other as its partner and both leave the unpaired list

    Scenario: Pairing across nights refused
      Given a night-before match-me request and a night-of match-me request
      When the admin attempts to pair them
      Then the pairing is refused and neither request is changed

    Scenario: Pairing a non-match-me request refused
      Given a request for a room of the party's own
      When the admin attempts to pair it with a match-me request
      Then the pairing is refused and neither request is changed

    Scenario: Unpairing clears both sides
      Given two paired match-me requests
      When the admin unpairs one of them
      Then both requests return to the unpaired list with no partner recorded

    Scenario: Already-paired request cannot be paired again
      Given a match-me request that already has a partner
      When the admin attempts to pair it with a third request
      Then the pairing is refused and the existing pairing is left intact

  @req:combined-rooming-view-across-both-nights
  Rule: Combined rooming view across both nights
    Every room for both nights with its occupants, parties, and outstanding pairings.

    Scenario: Rooming view reflects bookings
      Given room requests across both nights and several parties
      When the admin opens the rooming view
      Then every room request appears under its night with its occupants and party

    Scenario: Unpaired requests surfaced
      Given a match-me request with no partner
      When the admin opens the rooming view
      Then it is listed as awaiting a partner rather than shown as a complete room

    Scenario: Named share shows the supplied name
      Given a party sharing a room with a named person from another party
      When the admin opens the rooming view
      Then the room shows that name alongside the party's own guest

  @req:venue-rooming-list-export
  Rule: Venue rooming list export
    One row per room in the venue pack, unallocated requests flagged.

    Scenario: Rooming sheet in the venue pack
      Given booked rooms across both nights
      When the admin requests the venue export
      Then the workbook contains a rooming sheet with one row per room, listing night, occupants, and parties

    Scenario: Unallocated rooms flagged in the export
      Given a match-me request with no partner at export time
      When the venue workbook is generated
      Then its row appears on the rooming sheet marked as unallocated
