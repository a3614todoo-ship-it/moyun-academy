"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { MemberUserStatus } from "@/generated/prisma/enums";
import { createMemberSession, verifySetPasswordToken } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";

export type SetPasswordState = { message: string };

export async function setMemberPassword(
  _previousState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const member = await verifySetPasswordToken(token);

  if (!member) {
    return { message: "這個設定密碼連結已失效，請聯繫學堂重新寄送通知信。" };
  }

  if (password.length < 12) {
    return { message: "密碼至少需要 12 個字元。" };
  }

  if (password !== confirmPassword) {
    return { message: "兩次輸入的密碼不一致。" };
  }

  const passwordHash = await hash(password, 12);
  await prisma.memberUser.update({
    where: { id: member.id },
    data: {
      passwordHash,
      passwordSetAt: new Date(),
      status: MemberUserStatus.ACTIVE,
    },
  });

  await createMemberSession(member.id);
  redirect("/account?password_set=1");
}
