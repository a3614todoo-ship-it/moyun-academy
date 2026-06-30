import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/set-password-form";
import { verifySetPasswordToken } from "@/lib/member/auth";

export const metadata: Metadata = { title: "設定會員密碼" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function SetPasswordPage({ searchParams }: Props) {
  const token = (await searchParams).token || "";
  const member = token ? await verifySetPasswordToken(token) : null;

  return (
    <main>
      <section className="page-hero compact-page-hero">
        <div className="container">
          <span className="eyebrow">啟用會員帳號</span>
          <h1>設定你的網站密碼</h1>
          <p>完成後，就可以用 Email 與密碼登入會員中心。</p>
        </div>
      </section>
      <section className="section">
        <div className="container member-auth-layout">
          <div className="member-auth-card">
            {member ? (
              <>
                <h2>{member.name}，歡迎加入我輩學堂</h2>
                <p>帳號 Email：{member.email}</p>
                <SetPasswordForm token={token} />
              </>
            ) : (
              <>
                <h2>連結已失效</h2>
                <p>這個設定密碼連結可能已過期，或帳號已經設定過密碼。請回到登入頁，或聯繫學堂重新寄送通知信。</p>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
