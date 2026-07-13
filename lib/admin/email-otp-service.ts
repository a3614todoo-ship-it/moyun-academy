import {
  ADMIN_EMAIL_OTP_TTL_MINUTES,
  generateAdminEmailOtp,
  hashAdminEmailOtp,
} from "@/lib/admin/email-otp";
import { sendAdminLoginCode } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";

export async function issueAdminEmailOtp(adminUserId: string, email: string) {
  const code = generateAdminEmailOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ADMIN_EMAIL_OTP_TTL_MINUTES * 60 * 1000);

  const otp = await prisma.$transaction(async (transaction) => {
    await transaction.adminEmailOtp.deleteMany({
      where: {
        adminUserId,
        expiresAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    await transaction.adminEmailOtp.updateMany({
      where: { adminUserId, consumedAt: null },
      data: { consumedAt: now },
    });
    return transaction.adminEmailOtp.create({
      data: {
        adminUserId,
        codeHash: hashAdminEmailOtp(code),
        expiresAt,
      },
      select: { id: true },
    });
  });

  try {
    await sendAdminLoginCode(email, code);
  } catch (error) {
    await prisma.adminEmailOtp.updateMany({
      where: { id: otp.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    throw error;
  }

  return { otpId: otp.id, expiresAt };
}
