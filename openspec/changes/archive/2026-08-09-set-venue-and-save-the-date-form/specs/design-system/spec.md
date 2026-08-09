## ADDED Requirements

### Requirement: Staged page reveal on the guest frontend
Guest-facing pages SHALL arrive in stages rather than all at once. Each page SHALL designate one
focal element — its hero photo or page heading — which reveals as soon as the page loads. Every
other element opted into the reveal SHALL reveal when it is first scrolled into view, and SHALL
stay revealed thereafter. The reveal SHALL be a fade with a small upward movement, driven by the
same theme timing as the site's other motion, and SHALL apply to opacity and position only —
existing floral animation keeps its own timing. Opting in SHALL be per element: an element that
does not opt in is always visible. Elements that arrive together — on load, or when several cross into view at once — SHALL
reveal as a cascade: ordered by vertical position, each one a fixed step behind the one above
it, with the focal element leading. The step SHALL stop growing past a small number of
elements so a large group never drags.

#### Scenario: Focal element arrives first
- **WHEN** a guest opens a page carrying a focal element
- **THEN** that element reveals on load, before any other revealing section on the page

#### Scenario: Section reveals when reached
- **WHEN** a guest scrolls a revealing section below the fold into view
- **THEN** that section reveals, and it remains visible if scrolled away from and back

#### Scenario: A group reveals as a cascade
- **WHEN** several revealing sections cross into view in the same batch
- **THEN** each is revealed a step later than the one above it, ordered by vertical position rather than by the order they were reported

#### Scenario: A long cascade stops growing
- **WHEN** more sections arrive together than the cascade cap allows
- **THEN** the delay stops increasing at the cap so the tail does not drag

#### Scenario: A section added after navigation still animates
- **WHEN** a revealing section is created by a client-side navigation and crosses into view in the same frame
- **THEN** its hidden state is painted before it reveals, so the transition runs

#### Scenario: Untagged content is always visible
- **WHEN** a page contains elements that have not opted into the reveal
- **THEN** those elements render visible with no reveal behaviour

### Requirement: Reveal never withholds content
The reveal SHALL be presentation over server-rendered content that is already in the document, and SHALL never be the reason a visitor cannot read the page. Content SHALL NOT be painted visible and then hidden — the hidden state SHALL ship in the server-rendered markup, and SHALL take effect only while a marker set by an inline script before first paint is present. A visitor without JavaScript, a crawler, or a page whose client never hydrates SHALL therefore see the full page: the marker is never added without JavaScript, and SHALL be withdrawn automatically if no revealing element mounts. A revealing element already within the viewport when it mounts SHALL reveal immediately rather than waiting on an observer. Where `IntersectionObserver` is unavailable, all revealing elements SHALL be revealed immediately. Where the visitor has `prefers-reduced-motion` enabled, no element SHALL be hidden and no reveal motion SHALL run.

#### Scenario: No JavaScript
- **WHEN** a page is rendered without its client JavaScript running
- **THEN** every section is visible and no element carries a hidden state

#### Scenario: Reduced motion
- **WHEN** the visitor's OS has `prefers-reduced-motion` enabled
- **THEN** every section renders visible immediately with no reveal animation

#### Scenario: Observer unavailable
- **WHEN** the browser does not support `IntersectionObserver`
- **THEN** every revealing element is revealed immediately on load

#### Scenario: Hydration never runs
- **WHEN** a page's client JavaScript loads but never hydrates
- **THEN** the hidden state is lifted and every section becomes visible

#### Scenario: Already on screen at mount
- **WHEN** a revealing element is within the viewport as the page loads
- **THEN** it reveals without waiting for an intersection callback

### Requirement: Reveal is scoped to the guest frontend
The reveal SHALL apply only to guest-facing pages. Admin pages and print routes SHALL NOT use it,
so that printed output can never capture an element mid-reveal.

#### Scenario: Print routes unaffected
- **WHEN** a print route is rendered
- **THEN** no element on it carries reveal behaviour and every element is fully visible

#### Scenario: Admin pages unaffected
- **WHEN** an admin page is rendered
- **THEN** no element on it carries reveal behaviour
