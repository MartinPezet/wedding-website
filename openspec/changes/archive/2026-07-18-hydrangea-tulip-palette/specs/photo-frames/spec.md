## REMOVED Requirements

### Requirement: Photos in floral frames
**Reason**: The corner-garland floral frame is replaced on the only pages that
used it (`/` and `/gifts`) by the hero floral arch, which both clips the photo
and crowns it. `FloralFrame.vue` is deleted.
**Migration**: Photo clipping and floral decoration for hero photos now come from
the `Hero floral arch` requirement in the `design-system` capability.

### Requirement: Frames animate on scroll
**Reason**: The scroll-driven frame twist belonged to the corner-garland frame,
which is removed. The hero arch uses the site's standard load/sway motion, not a
scroll-driven twist.
**Migration**: Motion for hero floral art is covered by `design-system`'s floral
motion requirements (load reveal + reduced-motion handling).
