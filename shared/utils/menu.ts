import type { CourseId, MenuCourse } from '../content'

/** course id → guest choice field, mirroring the db columns */
export const COURSE_FIELDS = {
  starter: 'starterChoiceId',
  main: 'mainChoiceId',
  dessert: 'dessertChoiceId',
} as const satisfies Record<CourseId, string>

export type CourseField = (typeof COURSE_FIELDS)[CourseId]

/** children get a course's child options when defined, the adult options otherwise */
export function optionsFor(course: MenuCourse, isChild: boolean) {
  return isChild && course.childOptions?.length ? course.childOptions : course.options
}
