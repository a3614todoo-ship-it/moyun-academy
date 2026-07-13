"use server";

import { redirect } from "next/navigation";
import { MemberUserStatus } from "@/generated/prisma/enums";
import { createMemberSession } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyPassword } from "@/lib/security/password";

export type MemberLoginState = { message: string };

export async function loginMember(
  _previousState: MemberLoginState,
  formData: FormData,
): Promise<MemberLoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { message: "請輸入 Email 與密碼。" };

  const rateLimit = await checkRateLimit({
    scope: "member-login",
    limit: 5,
    windowSeconds: 15 * 60,
    identifiers: [email],
  });
  if (!rateLimit.allowed) return { message: "登入嘗試次數過多，請稍後再試。" };

  const member = await prisma.memberUser.findUnique({ where: { email } });
  const valid = await verifyPassword(
    password,
    member?.status === MemberUserStatus.ACTIVE ? member.passwordHash : null,
  );

  if (!member || !valid) {
    return { message: "Email 或密碼錯誤，或帳號尚未完成密碼設定。" };
  }

  await prisma.$transaction([
    prisma.memberSession.deleteMany({
      where: { memberUserId: member.id, expiresAt: { lte: new Date() } },
    }),
    prisma.memberUser.update({
      where: { id: member.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);
  await createMemberSession(member.id);
  redirect("/account");
}
