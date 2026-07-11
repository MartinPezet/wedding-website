@seating-editor
Feature: Seating editor
  Drag-and-drop table layout and guest seat assignment with warnings and autosave.

  @req:table-layout-editing
  Rule: Table layout editing
    Add, rename, reposition, and delete round or rectangular tables with capacity.

    Scenario: Table created and placed
      Given the seating canvas
      When the admin adds a round table with capacity 10 and drags it into position
      Then the table renders at that position with 10 seat positions and persists across reloads

  @req:guest-seat-assignment-by-drag-and-drop
  Rule: Guest seat assignment by drag and drop
    Guests move from a party-grouped sidebar onto seats and between them.

    Scenario: Guest seated
      Given an attending guest in the sidebar
      When the admin drags the guest onto an empty seat
      Then the guest occupies that seat, appears on the table, and the assignment persists

    Scenario: Guest moved
      Given an already-seated guest
      When the admin drags them to a different seat or table
      Then the assignment updates and the previous seat becomes free

  @req:seating-validation-warnings
  Rule: Seating validation warnings
    Non-blocking warnings for unseated, over-capacity, and stale assignments.

    Scenario: Unseated guests flagged
      Given attending guests not assigned to any seat
      When the editor renders
      Then it shows a count or list of unseated guests

    Scenario: Seated guest declines
      Given a seated guest whose RSVP changes to not attending
      When the editor renders
      Then it flags the stale assignment and offers one-click removal

  @req:layout-persists-and-survives-reloads
  Rule: Layout persists and survives reloads
    Edits autosave and reload identically.

    Scenario: Autosave
      Given seating edits made by the admin
      When the editor is reopened later
      Then the layout and assignments match the last edits with no explicit save action
