@admin-navigation
Feature: Admin navigation
  Responsive Nuxt UI sidebar for the authenticated admin shell, with an explicit
  mobile toggle and no auto-open on navigation.

  @req:admin-sidebar-navigation
  Rule: Admin sidebar navigation
    The admin layout presents section navigation in a Nuxt UI sidebar with links
    to every admin section, plus View site and Log out, with the current route
    marked active.

    Scenario: Sidebar exposes all admin sections
      Given an authenticated admin
      When an admin page is rendered
      Then the sidebar shows links to Dashboard, Seating, Print, Import, and Settings
      And it shows a "View site" link and a "Log out" control

    Scenario: Current section is marked active
      Given an authenticated admin on the "/admin/seating" route
      When the admin layout is rendered
      Then the sidebar Seating link is marked active
      And no other section link is marked active

    Scenario: Log out control ends the session
      Given an authenticated admin
      When the admin activates the "Log out" control in the sidebar
      Then the admin session is cleared
      And the admin is redirected to "/admin/login"

  @req:responsive-sidebar-visibility
  Rule: Responsive sidebar visibility
    The sidebar is a static panel at lg and above, and an off-screen slideover
    below lg.

    @manual
    Scenario: Sidebar is static on large screens
      Given the viewport is at or above the lg breakpoint
      When an admin page is rendered
      Then the sidebar is visible without any toggle interaction
      And no sidebar toggle control is shown

    @manual
    Scenario: Sidebar is hidden on small screens
      Given the viewport is below the lg breakpoint
      When an admin page is rendered
      Then the sidebar is off-screen and its links are not visible
      And a panel header with a sidebar toggle control is shown

  @req:mobile-navigation-toggle
  Rule: Mobile navigation toggle
    Below lg, a panel-header toggle opens and closes the sidebar overlay; opening
    requires an explicit toggle activation.

    @manual
    Scenario: Toggle opens the sidebar
      Given the viewport is below lg and the sidebar is closed
      When the admin activates the panel-header toggle
      Then the sidebar overlay opens and its links become visible

    @manual
    Scenario: Toggle closes the sidebar
      Given the viewport is below lg and the sidebar overlay is open
      When the admin activates the panel-header toggle again
      Then the sidebar overlay closes

  @req:sidebar-does-not-auto-open-on-navigation
  Rule: Sidebar does not auto-open on navigation
    Navigating between admin pages never opens the sidebar; following a link
    below lg closes it.

    @manual
    Scenario: Sidebar stays closed across navigation
      Given the viewport is below lg with the sidebar closed
      When the admin navigates to a new admin page
      Then the destination page renders with the sidebar still closed

    @manual
    Scenario: Following a link closes the open sidebar
      Given the viewport is below lg with the sidebar open
      When the admin taps a section link
      Then the destination page loads
      And the sidebar is closed
