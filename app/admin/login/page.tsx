import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "管理員登入" };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-mark">墨</div>
        <span className="eyebrow">我輩學堂</span>
        <h1>管理員登入</h1>
        <p>登入後可查看會員報名、匯款回報與 Email 紀錄。</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
