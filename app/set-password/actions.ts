"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { MemberUserStatus } from "@/generated/prisma/enums";
import { createMemberSession, verifySetPasswordToken } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { validateNewPassword } from "@/lib/security/password";

export type SetPasswordState = { message: string };

export async function setMemberPassword(
  _previousState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const rateLimit = await checkRateLimit({
    scope: "set-password",
    limit: 5,
    windowSeconds: 15 * 60,
    identifiers: [token.slice(0, 80)],
  });
  if (!rateLimit.allowed) return { message: "嘗試次數過多，請稍後再試。" };
  const member = await verifySetPasswordToken(token);

  if (!member) {
    return { message: "這個設定密碼連結已失效，請聯繫學堂重新寄送通知信。" };
  }

  const passwordError = validateNewPassword(password);
  if (passwordError) return { message: passwordError };

  if (password !== confirmPassword) {
    return { message: "兩次輸入的密碼不一致。" };
  }

  const passwordHash = await hash(password, 12);
  await prisma.$transaction([
    prisma.memberUser.update({
      where: { id: member.id },
      data: {
        passwordHash,
        passwordSetAt: new Date(),
        status: MemberUserStatus.ACTIVE,
      },
    }),
    prisma.memberSession.deleteMany({ where: { memberUserId: member.id } }),
  ]);

  await createMemberSession(member.id);
  redirect("/account?password_set=1");
}
