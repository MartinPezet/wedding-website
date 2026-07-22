import { describe, expect, it } from 'vitest'
import { menu } from '#shared/content'
import { COURSE_FIELDS } from '#shared/utils/menu'

const optionShape = (option: unknown) => {
  expect(option).toMatchObject({ id: expect.any(String), name: expect.any(String) })
}

describe('menu.json', () => {
  it('defines only known courses, each with at least one option', () => {
    expect(menu.courses.length).toBeGreaterThan(0)
    for (const course of menu.courses) {
      expect(Object.keys(COURSE_FIELDS)).toContain(course.id)
      expect(course.name).toEqual(expect.any(String))
      expect(course.options.length).toBeGreaterThan(0)
      course.options.forEach(optionShape)
      course.childOptions?.forEach(optionShape)
    }
  })

  it('option ids are unique across all courses and child options', () => {
    const ids = menu.courses.flatMap(course => [...course.options, ...course.childOptions ?? []]).map(option => option.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('courses are not duplicated', () => {
    const ids = menu.courses.map(course => course.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
