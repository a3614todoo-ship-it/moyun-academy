"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/#author", label: "關於作家" },
  { href: "/#beliefs", label: "學堂理念" },
  { href: "/#path", label: "閱讀路徑" },
  { href: "/courses", label: "課程" },
  { href: "/membership", label: "會員方案" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="我輩學堂首頁">
            <span className="brand-seal">我</span>
            <span>
              <strong>我輩學堂</strong>
              <small>張曼娟的古典文學學堂</small>
            </span>
          </Link>
          <nav className="main-nav" aria-label="主要選單">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
          <Link className="login-link" href="/admin/login">管理員登入</Link>
          <Link className="button button-gold header-cta" href="/membership">立即加入</Link>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand">
              <span className="brand-seal">我</span>
              <span><strong>我輩學堂</strong><small>以經典照見這一輩的生活</small></span>
            </div>
            <p>跟著張曼娟慢讀經典，把古人的生命經驗帶回今日。</p>
          </div>
          <div>
            <strong>快速連結</strong>
            <Link href="/courses">所有課程</Link>
            <Link href="/membership">學員方案</Link>
            <Link href="/payment-report">匯款回報</Link>
          </div>
          <div>
            <strong>聯絡我們</strong>
            <span>service@wobei-academy.tw</span>
            <span>週一至週五 10:00–18:00</span>
          </div>
        </div>
        <div className="container copyright">© 2026 我輩學堂。保留所有權利。</div>
      </footer>
    </>
  );
}
