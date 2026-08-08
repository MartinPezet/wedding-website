import type { Directive } from 'vue'

/** gap between one element's reveal and the next in the same batch */
const STAGGER_MS = 400
/** past this many steps the delay stops growing, so a long group never drags */
const MAX_STAGGER_STEPS = 4

/**
 * Reveal a group as a cascade: top of the page first, each one a step behind the
 * one above it. Elements arrive together whenever several cross into view at once
 * — on load, or after a jump down the page — and cascading reads far better than
 * the whole screen lifting at once.
 */
const revealBatch = (elements: HTMLElement[]) => {
  const topOf = (el: HTMLElement) => el.getBoundingClientRect?.().top ?? 0
  const ordered = [...elements].sort((a, b) => topOf(a) - topOf(b))
  ordered.forEach((el, index) => {
    const step = Math.min(index, MAX_STAGGER_STEPS)
    el.style?.setProperty('--reveal-delay', `${step * STAGGER_MS}ms`)
    el.setAttribute('data-reveal', 'in')
  })
}

/** elements waiting to reveal, gathered so they cascade rather than lift together */
let pending: HTMLElement[] = []
let flushScheduled = false

/**
 * Gather elements and reveal them a frame later.
 *
 * The delay is what makes the transition run at all: an element created and
 * revealed inside the same frame — anything arriving via client-side navigation —
 * never has its hidden state painted, so there is nothing to animate from and it
 * simply appears. On a first load the server markup supplies that paint, which is
 * why the bug only ever showed after navigating.
 */
const scheduleReveal = (elements: HTMLElement[]) => {
  pending.push(...elements)
  if (flushScheduled) return
  flushScheduled = true

  let flushed = false
  const flush = () => {
    if (flushed) return
    flushed = true
    flushScheduled = false
    const batch = pending
    pending = []
    revealBatch(batch)
  }

  // Two frames: the first lets the browser paint the hidden state, the second
  // flips it, so the transition actually runs. The timer is the safety net —
  // frames never arrive in a document that is not compositing (background tab,
  // hidden embed) and content must never be stuck hidden waiting for one.
  globalThis.requestAnimationFrame?.(() => globalThis.requestAnimationFrame(flush))
  setTimeout(flush, 200)
}

/**
 * One observer for every scroll-revealed element, so elements crossing the
 * threshold together land in a single callback and can be cascaded. Per-element
 * observers fire separately and lose that grouping.
 */
let observer: IntersectionObserver | undefined

const observeForReveal = (el: HTMLElement) => {
  observer ??= new IntersectionObserver((entries) => {
    const arrived = entries
      .filter(entry => entry.isIntersecting)
      .map(entry => entry.target as HTMLElement)
    if (!arrived.length) return
    scheduleReveal(arrived)
    // one-shot: scrolling away must never hide it again
    for (const target of arrived) observer!.unobserve(target)
  }, { rootMargin: '0px 0px -10% 0px' })
  observer.observe(el)
}

/**
 * Staged page reveal for the guest frontend.
 *
 * `v-reveal.focal` marks the one element per page that arrives on load (the hero
 * or heading) and leads the cascade; plain `v-reveal` marks a section that arrives
 * when it is first scrolled into view, and stays arrived.
 *
 * The hidden state ships in the server markup so nothing is ever painted visible
 * and then hidden — that flash is what hiding at hydration looks like. It only
 * takes effect while the `reveal-armed` class set by the inline head script is
 * present, so a visitor without JavaScript, a crawler, or a failed hydration gets
 * the whole page. Reduced motion opts out in the stylesheet.
 */
export const revealDirective: Directive<HTMLElement> = {
  // server markup carries the hidden state; the stylesheet decides whether it bites
  getSSRProps: () => ({ 'data-reveal': 'hidden' }),
  mounted(el, binding) {
    // tells the head script's watchdog that hydration happened
    ;(globalThis as { __revealMounted?: boolean }).__revealMounted = true

    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      el.removeAttribute?.('data-reveal')
      return
    }

    el.setAttribute('data-reveal', 'hidden')

    // on screen at load — the focal element, or a section already in view.
    // Waiting on the observer would leave it hidden wherever the observer never
    // fires (background tab, a frame that never composites).
    const rect = el.getBoundingClientRect?.()
    const onScreen = rect && rect.top < (globalThis.innerHeight ?? 0) && rect.bottom > 0
    if (binding.modifiers.focal || typeof IntersectionObserver === 'undefined' || onScreen) {
      scheduleReveal([el])
      return
    }

    observeForReveal(el)
  },
}
