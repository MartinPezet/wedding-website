## Context

The admin area (`app/layouts/admin.vue`) is used by authenticated admins to manage
guests, seating, printing, imports, and settings. It currently uses a horizontal
top nav that wraps on small screens and whose mobile menu re-opens on route
change. The wider site (`layouts/default.vue`) hand-rolls a mobile dropdown; the
admin area has no toggle at all. The project is Nuxt 4 + Tailwind v4 with design
tokens from the design-system spec, and the user has asked specifically to use
Nuxt UI components.

Nuxt UI (v4) ships a free dashboard component family that already implements the
exact responsive model requested: `UDashboardSidebar` is a static panel at `lg`+
and a slideover below, with `autoClose` (default on) closing it on navigation.

## Goals / Non-Goals

**Goals:**
- Admin nav lives in a Nuxt UI `UDashboardSidebar`: static at `lg`+, off-screen
  slideover below `lg`.
- An explicit toggle (in a `UDashboardNavbar` panel header) is the only way to
  open the sidebar below `lg`; it is absent at `lg`+.
- Navigation never auto-opens the sidebar; following a link closes it.
- Keep the site's floral/Tailwind-v4 look via design-system tokens, not Nuxt UI's
  default theme.

**Non-Goals:**
- No change to the public `default` layout or its mobile menu.
- No change to admin routes, auth, RSVP, or server code.
- No sidebar resize/collapse-to-rail on desktop (not requested; keep it simple).
- No global adoption of Nuxt UI across public pages in this change.

## Decisions

**Use Nuxt UI dashboard components over hand-rolling.**
`UDashboardGroup` (state + persistence) wrapping `UDashboardSidebar` +
`UDashboardPanel` + `UDashboardNavbar` gives the required responsive behavior,
the mobile toggle (`UDashboardSidebarToggle`, surfaced by the navbar), and
`autoClose` for free. Alternative — extend the existing hand-rolled dropdown with
a toggle and a `watch(route)` close — was rejected: it reinvents what the user
asked to adopt and is the source of the current auto-open bug.

**Sidebar links via `UDashboardSidebar`'s `menu`/`UNavigationMenu`.**
Model the five sections as navigation items with `to`, using route matching for
the active state (replacing the current `exact-active-class`). "View site" and
"Log out" go in the sidebar `footer` slot.

**Breakpoint = Nuxt UI default (`lg`).** The dashboard components already switch
between static and slideover at `lg`, matching "large and below." No custom
breakpoint override needed.

**Theme with design-system tokens.** Point Nuxt UI's app config / CSS at the
existing Tailwind v4 tokens (cream/ink/petal/leaf) so the sidebar matches the
site rather than shipping default Nuxt UI colors. Use the `ui` prop / `app.config`
`ui` overrides where component classes need site tokens.

**Dependency addition is intentional.** CLAUDE.md prefers built-ins, but the user
explicitly requested Nuxt UI; add `@nuxt/ui` and register the module. This also
sets up Nuxt UI for later reuse without committing to migrating public pages now.

## Risks / Trade-offs

- **New dependency weight / build wiring** → scope the module to what's needed;
  `@nuxt/ui` auto-registers components and Tailwind v4 integration, so config is
  small. Verify `npm run dev`, `lint`, and `typecheck` after adding.
- **Nuxt UI default theme fights the floral design** → override via app config
  tokens and `ui` props; visual parity is a `@manual` verification.
- **Responsive/slideover behavior is hard to assert in jsdom** → automate the
  structural requirements (links present, active state, toggle present below `lg`)
  and tag true viewport/overlay-visibility scenarios `@manual`.
- **Nuxt UI version drift** (v4 API) → pin the installed major; components used
  (`UDashboard*`) are stable in v4.

## Migration Plan

1. Add `@nuxt/ui`, register in `nuxt.config.ts` `modules`, wire CSS + app config
   tokens.
2. Rewrite `app/layouts/admin.vue` to the `UDashboardGroup` structure; move nav
   links into the sidebar and logout into the footer.
3. Admin pages are unchanged (they render in the `UDashboardPanel` body via
   `<slot />`).
4. Rollback = revert the layout file and drop the module; no data or route
   migration involved.

## Open Questions

- Should "Log out" and "View site" also appear in the desktop sidebar footer, or
  only in a user menu? (Assume sidebar footer for both, per proposal.)
