export const DEFAULT_MESSAGE
  = 'Hi {name}! Just a friendly nudge — we haven\'t had your RSVP for the wedding yet. It only takes a minute: {link}'

/** `{key}` → `values[key]`; unknown keys stay as typed, and the function replacer keeps `$` in values literal */
export const fillMessage = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder)

// ponytail: `?&body=` — RFC 5724 wants `?body=`, older iOS reads `&body=`; this form works on both
export const smsHref = (phone: string, body: string) => `sms:${phone}?&body=${encodeURIComponent(body)}`

/** wa.me wants the E.164 number without its `+` */
export const whatsappHref = (phone: string, body: string) =>
  `https://wa.me/${phone.replace(/^\+/, '')}?text=${encodeURIComponent(body)}`
