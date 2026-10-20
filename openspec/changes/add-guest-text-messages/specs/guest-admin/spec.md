## ADDED Requirements

### Requirement: Text messages to parties from the dashboard
The admin dashboard SHALL provide an editable message box, pre-filled with an RSVP reminder, in which `{name}`, `{link}` and `{food_link}` are replaced per party with the party name, that party's personal RSVP link, and that party's personal food-choice (menu) link. Each listed party with a contact phone SHALL offer a "Text" link (`sms:` URI) and a "WhatsApp" link (`https://wa.me/` URL), each pre-filled with that party's message, so the admin sends from their own phone. Parties without a contact phone SHALL offer neither link. The site SHALL NOT send any message itself.

#### Scenario: Reminder pre-filled for an outstanding party
- **WHEN** the admin opens the dashboard and selects the "not yet responded" filter
- **THEN** each listed party with a phone has a Text link and a WhatsApp link to its number whose message is the default reminder containing that party's name and RSVP link

#### Scenario: Edited message used for every party
- **WHEN** the admin replaces the message box text with a new message using `{name}` and `{link}`
- **THEN** every party's Text and WhatsApp links carry the new message with that party's name and RSVP link filled in

#### Scenario: Food link placeholder
- **WHEN** the message box text contains `{food_link}`
- **THEN** each party's Text and WhatsApp links carry that party's personal food-choice link (the menu page with its token) in its place

#### Scenario: Party without a phone
- **WHEN** the admin views a party that has no contact phone
- **THEN** that party shows no Text or WhatsApp link

#### Scenario: Link opens the messaging app
- **WHEN** the admin taps a party's Text or WhatsApp link on their phone
- **THEN** the messaging app opens addressed to that party's number with the message pre-filled, ready to send
