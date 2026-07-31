// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { qrSvg } from '../../shared/utils/qr'

describe('qrSvg', () => {
  it('renders a transparent background with petal-deep, partially rounded modules', async () => {
    const svg = await qrSvg('https://example.test/?t=abc123')

    // no legacy opaque background rect (old renderer's full-canvas path)
    expect(svg).not.toMatch(/H\d+(?:\.\d+)?z/)
    expect(svg).toContain('#4c66ac')

    const finderGroup = svg.match(/<g data-qr-finder[^>]*>[\s\S]*?<\/g>/)?.[0] ?? ''
    const dataGroup = svg.match(/<g data-qr-data[^>]*>[\s\S]*?<\/g>/)?.[0] ?? ''
    expect(finderGroup).toContain('<rect')
    expect(dataGroup).toContain('<rect')
    // finder-pattern squares stay sharp; data modules are rounded
    expect(finderGroup).not.toContain('rx=')
    expect(dataGroup).toMatch(/rx="0\.\d+"/)
  })
})
