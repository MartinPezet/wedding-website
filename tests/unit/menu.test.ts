import { describe, expect, it } from 'vitest'
import { menu } from '../../shared/content'

const optionShape = (option: unknown) => {
  expect(option).toMatchObject({ id: expect.any(String), name: expect.any(String) })
}

describe('menu.json', () => {
  it('defines at least one meal option with unique ids', () => {
    expect(menu.options.length).toBeGreaterThan(0)
    menu.options.forEach(optionShape)
    const ids = [...menu.options, ...menu.childMenu ?? []].map(option => option.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('child menu, when present, has the same option shape', () => {
    if (!menu.childMenu) return
    expect(menu.childMenu.length).toBeGreaterThan(0)
    menu.childMenu.forEach(optionShape)
  })
})
