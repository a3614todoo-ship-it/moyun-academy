export const MEMBER_PRIORITY_DAYS = 7;

type RegistrationWindow = {
  publicRegistrationOpenAt: Date | null;
  registrationCloseAt: Date | null;
};

export type RegistrationState =
  | "NOT_OPEN"
  | "MEMBER_PRIORITY"
  | "OPEN_MEMBER"
  | "OPEN_PUBLIC"
  | "CLOSED";

export function memberRegistrationOpenAt(publicOpenAt: Date | null) {
  if (!publicOpenAt) return null;
  return new Date(publicOpenAt.getTime() - MEMBER_PRIORITY_DAYS * 24 * 60 * 60 * 1000);
}

export function registrationState(
  course: RegistrationWindow,
  isActiveMember: boolean,
  now = new Date(),
): RegistrationState {
  if (course.registrationCloseAt && now >= course.registrationCloseAt) return "CLOSED";
  if (!course.publicRegistrationOpenAt || now >= course.publicRegistrationOpenAt) return "OPEN_PUBLIC";

  const memberOpenAt = memberRegistrationOpenAt(course.publicRegistrationOpenAt);
  if (memberOpenAt && now >= memberOpenAt) {
    return isActiveMember ? "OPEN_MEMBER" : "MEMBER_PRIORITY";
  }

  return "NOT_OPEN";
}

export function canCreateCoursePurchase(state: RegistrationState) {
  return state === "OPEN_MEMBER" || state === "OPEN_PUBLIC";
}
