import {
  ApplicationStatus,
  CoursePurchaseStatus,
  EmailStatus,
  EmailType,
} from "@/generated/prisma/enums";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  PENDING_PAYMENT: "待匯款",
  PAYMENT_REPORTED: "已回報匯款",
  APPROVED: "審核通過",
  JOINED_FACEBOOK_GROUP: "已加入社團",
  REJECTED: "已拒絕",
  CANCELLED: "已取消",
};

export const coursePurchaseStatusLabels: Record<CoursePurchaseStatus, string> = {
  PENDING_PAYMENT: "待匯款",
  PAYMENT_REPORTED: "已回報匯款",
  APPROVED: "審核通過",
  REJECTED: "已拒絕",
  CANCELLED: "已取消",
};

export const emailTypeLabels: Record<EmailType, string> = {
  APPLICATION_CREATED: "會員申請建立",
  PAYMENT_REPORTED_USER: "會員匯款回報通知",
  PAYMENT_REPORTED_ADMIN: "會員匯款待審核",
  APPLICATION_APPROVED: "會員審核通過",
  FACEBOOK_GROUP_JOINED: "已加入 Facebook 社團",
  COURSE_PURCHASE_CREATED: "課程購買申請建立",
  COURSE_PAYMENT_REPORTED_USER: "課程匯款回報通知",
  COURSE_PAYMENT_REPORTED_ADMIN: "課程匯款待審核",
  COURSE_PURCHASE_APPROVED: "課程購買審核通過",
  MEMBERSHIP_EXPIRING: "會員資格到期提醒",
  MEMBER_PRIORITY_OPEN: "會員優先報名通知",
  LIVE_REMINDER: "直播前提醒",
  REPLAY_CLOSING: "回看截止提醒",
  REPLAY_OPENED: "回看開放通知",
};

export const emailStatusLabels: Record<EmailStatus, string> = {
  PENDING: "待寄送",
  PROCESSING: "寄送中",
  SENT: "已寄送",
  FAILED: "寄送失敗",
};

export function statusClass(status: ApplicationStatus | CoursePurchaseStatus) {
  return `admin-status status-${status.toLowerCase().replaceAll("_", "-")}`;
}

export function formatTaipeiDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}
