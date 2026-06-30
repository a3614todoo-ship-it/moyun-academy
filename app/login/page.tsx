import type { Metadata } from "next";
import { MemberLoginForm } from "@/components/member-login-form";
import { getMemberSession } from "@/lib/member/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "會員登入" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getMemberSession();
  if (session) redirect("/account");

  return (
    <main>
      <section className="page-hero compact-page-hero">
        <div className="container">
          <span className="eyebrow">會員登入</span>
          <h1>回到你的學習書桌</h1>
          <p>登入後可查看會員資格、已購買課程與會員免費課程入口。</p>
        </div>
      </section>
      <section className="section">
        <div className="container member-auth-layout">
          <div className="member-auth-card">
            <h2>登入會員中心</h2>
            <MemberLoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
