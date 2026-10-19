export const DEFAULT_MESSAGE
  = 'Hi {name}! Just a friendly nudge — we haven\'t had your RSVP for the wedding yet. It only takes a minute: {link}'

/** `{name}` and `{link}` → that party's values; a function replacer keeps `$` in names literal */
export const fillMessage = (template: string, values: { name: string, link: string }) =>
  template.replaceAll('{name}', () => values.name).replaceAll('{link}', () => values.link)

// ponytail: `?&body=` — RFC 5724 wants `?body=`, older iOS reads `&body=`; this form works on both
export const smsHref = (phone: string, body: string) => `sms:${phone}?&body=${encodeURIComponent(body)}`

/** wa.me wants the E.164 number without its `+` */
export const whatsappHref = (phone: string, body: string) =>
  `https://wa.me/${phone.replace(/^\+/, '')}?text=${encodeURIComponent(body)}`
