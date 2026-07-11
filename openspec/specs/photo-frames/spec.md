# photo-frames

## Purpose

Photos of the couple presented in decorative floral SVG frames consistent with the site's design system, with subtle scroll-driven animation and responsive image delivery.

## Requirements

### Requirement: Photos in floral frames
The system SHALL display photos of the couple inside decorative floral SVG frames consistent with the site's design system, placed across the public pages.

#### Scenario: Framed photo renders
- **WHEN** a guest views a page containing a framed photo
- **THEN** the photo renders clipped within a floral frame using theme colours

### Requirement: Frames animate on scroll
Floral frame decorations SHALL animate subtly (slight rotation/twist of floral elements) driven by scroll position, respecting `prefers-reduced-motion` and degrading to static frames on unsupported browsers.

#### Scenario: Scroll animates frame florals
- **WHEN** a guest scrolls past a framed photo
- **THEN** the frame's floral elements rotate/twist subtly in response to scroll

#### Scenario: Reduced motion
- **WHEN** the visitor has `prefers-reduced-motion` enabled
- **THEN** frames render statically

### Requirement: Responsive image delivery
Photos SHALL be served at responsive sizes appropriate to the viewport without layout shift.

#### Scenario: Phone viewport image load
- **WHEN** a framed photo loads on a phone-sized viewport
- **THEN** an appropriately sized image variant is served and the layout does not shift as it loads
