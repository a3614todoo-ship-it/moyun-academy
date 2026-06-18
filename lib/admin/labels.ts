import { ApplicationStatus, EmailStatus, EmailType } from "@/generated/prisma/enums";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  PENDING_PAYMENT: "待匯款",
  PAYMENT_REPORTED: "已回報，待審核",
  APPROVED: "審核通過",
  JOINED_FACEBOOK_GROUP: "已加入社團",
  REJECTED: "未通過",
  CANCELLED: "已取消",
};

export const emailTypeLabels: Record<EmailType, string> = {
  APPLICATION_CREATED: "報名成功",
  PAYMENT_REPORTED_USER: "匯款回報確認",
  PAYMENT_REPORTED_ADMIN: "管理員待審核",
  APPLICATION_APPROVED: "審核通過",
  FACEBOOK_GROUP_JOINED: "已加入社團",
};

export const emailStatusLabels: Record<EmailStatus, string> = {
  PENDING: "待寄送",
  SENT: "已寄送",
  FAILED: "寄送失敗",
};

export function statusClass(status: ApplicationStatus) {
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
