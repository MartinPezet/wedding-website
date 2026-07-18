@photo-frames
Feature: Photo frames
  Responsive delivery of the couple's hero photos.

  @manual @req:responsive-image-delivery
  Rule: Responsive image delivery
    Photos are served at viewport-appropriate sizes without layout shift.

    @manual
    Scenario: Phone viewport image load
      Given a phone-sized viewport
      When a hero photo loads
      Then an appropriately sized image variant is served and the layout does not shift
