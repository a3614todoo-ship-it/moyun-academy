import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminRecoveryCodeLoginForm } from "@/components/admin-recovery-code-login-form";
import { getAdminMfaChallenge, getAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "管理員救援碼驗證" };

export default async function AdminRecoveryCodePage() {
  if (await getAdminSession()) redirect("/admin");
  if (!(await getAdminMfaChallenge())) redirect("/admin/login");

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-mark">安</div>
        <span className="eyebrow">備用驗證方式</span>
        <h1>輸入救援碼</h1>
        <p>請輸入一組尚未使用的救援碼。驗證成功後，該組碼會立即失效。</p>
        <AdminRecoveryCodeLoginForm />
      </section>
    </main>
  );
}

