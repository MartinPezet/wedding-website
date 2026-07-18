# photo-frames

## Purpose

Responsive delivery of the couple's hero photos. The decorative floral treatment of hero photos now lives in the `design-system` capability (`Hero floral arch`).

## Requirements

### Requirement: Responsive image delivery
Photos SHALL be served at responsive sizes appropriate to the viewport without layout shift.

#### Scenario: Phone viewport image load
- **WHEN** a framed photo loads on a phone-sized viewport
- **THEN** an appropriately sized image variant is served and the layout does not shift as it loads
