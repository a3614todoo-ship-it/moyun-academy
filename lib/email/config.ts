export function getEmailConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !user || !password || !from) {
    throw new Error("Gmail SMTP 設定不完整，請檢查 SMTP_HOST、SMTP_USER、SMTP_PASSWORD 與 EMAIL_FROM。");
  }

  return {
    host,
    port,
    secure: port === 465,
    user,
    password,
    from,
    adminEmail: process.env.ADMIN_EMAIL || user,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };
}
