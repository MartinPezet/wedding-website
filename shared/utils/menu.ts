import { menu } from '../content'
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

type GuestChoices = { attending: boolean | null } & Partial<Record<CourseField, string | null>>

/** some attending guest has yet to choose for a defined course */
export const awaitingFoodChoice = (guests: GuestChoices[]) =>
  guests.some(guest => guest.attending === true && menu.courses.some(course => !guest[COURSE_FIELDS[course.id]]))
