## Why

The authenticated admin area navigates via a top nav bar that wraps awkwardly on
small screens, and its mobile menu re-opens on every route change — so tapping a
link on a phone dumps the user back into an open menu instead of the page they
asked for. There is no explicit control to open or close the nav, and no
persistent sidebar for the growing set of admin sections (Dashboard, Seating,
Print, Import, Settings).

## What Changes

- Replace the admin layout's top nav bar with a **left sidebar** built from Nuxt UI
  dashboard components (`UDashboardGroup` + `UDashboardSidebar` + `UDashboardPanel` +
  `UDashboardNavbar`).
- On **`lg` and above**, the sidebar is a static, always-visible panel.
- On **`lg` and below** (tablet/mobile), the sidebar collapses off-screen and is
  reachable only through an explicit **toggle** — it no longer auto-opens, and it
  closes after a link is followed (Nuxt UI `autoClose`, on by default).
- Add a **panel header** (`UDashboardNavbar`) shown on `lg` and below carrying the
  sidebar toggle button; the toggle is hidden at `lg`+ where the sidebar is always
  present.
- Add `@nuxt/ui` as a dependency and register its Nuxt module.
- **BREAKING** (internal): admin nav markup moves from `app/layouts/admin.vue`'s
  header into the dashboard sidebar; no public route or URL changes.

## Capabilities

### New Capabilities
- `admin-navigation`: The admin shell's navigation chrome — responsive sidebar
  behavior, the mobile/tablet toggle, panel header, and the links exposed to
  authenticated admins.

### Modified Capabilities
<!-- None: guest-admin, admin-auth, seating-editor etc. keep their requirements;
     only the surrounding navigation shell changes. -->

## Impact

- **Code**: `app/layouts/admin.vue` rewritten; all `app/pages/admin/**` pages
  render inside the new dashboard panel.
- **Dependencies**: adds `@nuxt/ui`; `nuxt.config.ts` gains `@nuxt/ui` in
  `modules` and the CSS/app-config wiring it requires. Tailwind v4 tokens from the
  design-system spec must still drive the sidebar's look.
- **Tests**: new `admin-navigation` feature; responsive/slideover behavior that
  can't be asserted headlessly is tagged `@manual`.
- **No server, API, or auth changes.**
