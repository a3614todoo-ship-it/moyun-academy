type ReplayWindow = {
  replayEnabled: boolean;
  replayOpenAt: Date | null;
  replayCloseAt: Date | null;
};

export type ReplayState = "DISABLED" | "NOT_OPEN" | "OPEN" | "CLOSED";

export function replayState(course: ReplayWindow, now = new Date()): ReplayState {
  if (!course.replayEnabled) return "DISABLED";
  if (course.replayOpenAt && now < course.replayOpenAt) return "NOT_OPEN";
  if (course.replayCloseAt && now >= course.replayCloseAt) return "CLOSED";
  return "OPEN";
}

export function replayStateMessage(state: ReplayState) {
  switch (state) {
    case "DISABLED":
      return "管理員目前未開放這門課的回看。";
    case "NOT_OPEN":
      return "這門課的回看尚未開放。";
    case "CLOSED":
      return "這門課的回看期限已結束。";
    case "OPEN":
    default:
      return "回看目前開放中。";
  }
}
