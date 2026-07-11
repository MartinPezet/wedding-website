@photo-frames
Feature: Photo frames
  Couple photos in animated floral SVG frames with responsive delivery.

  @req:photos-in-floral-frames
  Rule: Photos in floral frames
    Photos render clipped inside decorative floral frames using theme colours.

    Scenario: Framed photo renders
      Given a page containing a framed photo
      When the page renders
      Then the photo is clipped within a floral frame using theme colours

  @manual @req:frames-animate-on-scroll
  Rule: Frames animate on scroll
    Floral elements twist subtly with scroll, respecting reduced-motion.

    @manual
    Scenario: Scroll animates frame florals
      Given a guest on a page with a framed photo
      When they scroll past the frame
      Then the floral elements rotate subtly in response to scroll

    @manual
    Scenario: Reduced motion
      Given a visitor with prefers-reduced-motion enabled
      When a framed photo renders
      Then the frame is static

  @manual @req:responsive-image-delivery
  Rule: Responsive image delivery
    Photos are served at viewport-appropriate sizes without layout shift.

    @manual
    Scenario: Phone viewport image load
      Given a phone-sized viewport
      When a framed photo loads
      Then an appropriately sized image variant is served and the layout does not shift
