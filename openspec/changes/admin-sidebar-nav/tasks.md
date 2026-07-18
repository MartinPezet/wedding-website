## 1. Add Nuxt UI

- [ ] 1.1 Install `@nuxt/ui`, add it to `nuxt.config.ts` `modules`, wire its CSS entry and `app.config` `ui` overrides to the design-system Tailwind v4 tokens (cream/ink/petal/leaf) — write/extend a smoke test that mounts a Nuxt UI component (e.g. `UButton`) and confirm it FAILS before wiring (red)
- [ ] 1.2 Complete the module + token wiring until the smoke test passes; `npm run dev` boots and renders a `UButton` with site tokens
- [ ] 1.3 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` green

## 2. Admin sidebar navigation

- [ ] 2.1 Install `admin-navigation.feature` into `tests/features/`, add `tests/steps/admin-navigation.steps.ts` covering the automatable Rules (`admin-sidebar-navigation`), plus any unit test mounting the admin layout — run `npm test`, confirm the new scenarios FAIL (red)
- [ ] 2.2 Rewrite `app/layouts/admin.vue` to `UDashboardGroup` > `UDashboardSidebar` + `UDashboardPanel`: move Dashboard/Seating/Print/Import/Settings into the sidebar navigation with route-based active state; put "View site" and "Log out" in the sidebar `footer` slot wired to the existing logout flow
- [ ] 2.3 Make the automatable scenarios pass (links present, active state, logout clears session and redirects to `/admin/login`)
- [ ] 2.4 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` green

## 3. Responsive toggle & no auto-open

- [ ] 3.1 Confirm the `responsive-sidebar-visibility`, `mobile-navigation-toggle`, and `sidebar-does-not-auto-open-on-navigation` Rules are present in the installed feature as `@manual` scenarios (skipped by the runner) — run `npm test` to confirm they are collected and skipped, not failing
- [ ] 3.2 Add the `UDashboardNavbar` panel header carrying the sidebar toggle (shown below `lg`, absent at `lg`+); confirm `UDashboardSidebar` uses default `mode="slideover"` and `autoClose` (default) so navigation never opens it and following a link closes it
- [ ] 3.3 Manually verify the `@manual` scenarios in a real browser at `lg`+ and below `lg`: static sidebar on desktop, off-screen slideover on mobile/tablet, toggle opens/closes, sidebar stays closed across navigation and closes after a link tap
- [ ] 3.4 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` green
