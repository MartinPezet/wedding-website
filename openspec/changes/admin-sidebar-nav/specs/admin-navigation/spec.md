## ADDED Requirements

### Requirement: Admin sidebar navigation

The authenticated admin layout SHALL present its section navigation in a left
sidebar built from Nuxt UI dashboard components. The sidebar MUST expose links to
Dashboard, Seating, Print, Import, and Settings, plus a "View site" link and a
"Log out" control. The link matching the current route MUST be marked active.

#### Scenario: Sidebar exposes all admin sections

- **WHEN** an authenticated admin loads any `/admin` page
- **THEN** the sidebar shows links to Dashboard, Seating, Print, Import, and Settings
- **AND** it shows a "View site" link and a "Log out" control

#### Scenario: Current section is marked active

- **WHEN** the admin is on `/admin/seating`
- **THEN** the sidebar's Seating link is marked active
- **AND** no other section link is marked active

#### Scenario: Log out control ends the session

- **WHEN** the admin activates the "Log out" control in the sidebar
- **THEN** the admin session is cleared and the admin is sent to `/admin/login`

### Requirement: Responsive sidebar visibility

The sidebar SHALL be a static, always-visible panel at the `lg` breakpoint and
above. At `lg` and below it MUST collapse off-screen and render as an overlay
(slideover) that is hidden until explicitly opened.

#### Scenario: Sidebar is static on large screens

- **WHEN** the viewport width is at or above the `lg` breakpoint
- **THEN** the sidebar is visible without any toggle interaction
- **AND** no sidebar toggle control is shown

#### Scenario: Sidebar is hidden on small screens

- **WHEN** the viewport width is below the `lg` breakpoint
- **THEN** the sidebar is off-screen and its links are not visible
- **AND** a panel header with a sidebar toggle control is shown

### Requirement: Mobile navigation toggle

At `lg` and below, a panel header (`UDashboardNavbar`) SHALL carry a toggle
control that opens and closes the sidebar overlay. Opening the sidebar MUST
require an explicit toggle activation.

#### Scenario: Toggle opens the sidebar

- **WHEN** the viewport is below `lg` and the admin activates the panel-header toggle
- **THEN** the sidebar overlay opens and its links become visible

#### Scenario: Toggle closes the sidebar

- **WHEN** the sidebar overlay is open below `lg` and the admin activates the toggle again
- **THEN** the sidebar overlay closes

### Requirement: Sidebar does not auto-open on navigation

Navigating between admin pages MUST NOT open the sidebar. Below `lg`, once a
sidebar link is followed the sidebar MUST close and the destination page MUST be
shown with the sidebar closed.

#### Scenario: Sidebar stays closed across navigation

- **WHEN** the admin is below `lg` with the sidebar closed and navigates to a new admin page
- **THEN** the destination page renders with the sidebar still closed

#### Scenario: Following a link closes the open sidebar

- **WHEN** the admin opens the sidebar below `lg` and taps a section link
- **THEN** the destination page loads
- **AND** the sidebar is closed
