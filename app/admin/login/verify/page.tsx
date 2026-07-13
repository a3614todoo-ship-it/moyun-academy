import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminEmailCodeLoginForm } from "@/components/admin-email-code-login-form";
import { getAdminMfaChallenge, getAdminSession } from "@/lib/admin/auth";
import { maskAdminEmail } from "@/lib/admin/email-otp";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "管理員 Email 驗證" };

type Props = { searchParams: Promise<{ delivery?: string }> };

export default async function AdminEmailCodePage({ searchParams }: Props) {
  if (await getAdminSession()) redirect("/admin");
  const challenge = await getAdminMfaChallenge();
  if (!challenge) redirect("/admin/login");
  const [admin, query] = await Promise.all([
    prisma.adminUser.findFirst({
      where: { id: challenge.adminUserId, isActive: true },
      select: { email: true },
    }),
    searchParams,
  ]);
  if (!admin) redirect("/admin/login");

  const deliveryMessage = query.delivery === "failed"
    ? "驗證碼寄送失敗，請重新寄送或改用救援碼。"
    : query.delivery === "limited"
      ? "寄送次數過多，請稍後再試或改用救援碼。"
      : "";

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-mark">安</div>
        <span className="eyebrow">第二階段驗證</span>
        <h1>輸入 Email 驗證碼</h1>
        <p>請輸入信件中的 6 位數驗證碼。驗證碼於 10 分鐘後失效。</p>
        {deliveryMessage ? <div className="admin-form-error" role="alert">{deliveryMessage}</div> : null}
        <AdminEmailCodeLoginForm maskedEmail={maskAdminEmail(admin.email)} />
      </section>
    </main>
  );
}

