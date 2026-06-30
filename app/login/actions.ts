"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { MemberUserStatus } from "@/generated/prisma/enums";
import { createMemberSession } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";

export type MemberLoginState = { message: string };

export async function loginMember(
  _previousState: MemberLoginState,
  formData: FormData,
): Promise<MemberLoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { message: "請輸入 Email 與密碼。" };

  const member = await prisma.memberUser.findUnique({ where: { email } });
  const valid =
    member?.status === MemberUserStatus.ACTIVE && member.passwordHash
      ? await compare(password, member.passwordHash)
      : false;

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
