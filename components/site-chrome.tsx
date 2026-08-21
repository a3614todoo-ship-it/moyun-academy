"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/author", label: "講師介紹" },
  { href: "/#path", label: "學習路徑" },
  { href: "/courses", label: "課程總覽" },
  { href: "/events", label: "實體活動" },
  { href: "/membership", label: "會員專區" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="我輩學堂首頁">
            <span className="brand-seal" aria-hidden="true">我</span>
            <span>
              <strong>我輩學堂</strong>
              <small>張曼娟線上文學學習平台</small>
            </span>
          </Link>
          <nav className="main-nav" aria-label="主要導覽">
            {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link className="login-link" href="/login">登入</Link>
            <Link className="header-join-link" href="/membership">加入會員</Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link className="brand footer-brand" href="/">
              <span className="brand-seal" aria-hidden="true">我</span>
              <span><strong>我輩學堂</strong><small>張曼娟線上文學學習平台</small></span>
            </Link>
            <p>從閱讀經典到書寫生活，讓文學成為理解自己的一種方式。</p>
          </div>
          <div><strong>快速導覽</strong><Link href="/author">認識張曼娟</Link><Link href="/courses">課程總覽</Link><Link href="/events">實體活動</Link><Link href="/membership">會員專區</Link><Link href="/login">會員登入</Link></div>
          <div><strong>聯絡我們</strong><span>service@wobei-academy.tw</span><span>服務時間：週一至週五 10:00–18:00</span></div>
        </div>
        <div className="container copyright">
          <span>© 2026 我輩學堂</span>
          <Link className="footer-admin-login" href="/admin/login">管理者登入</Link>
        </div>
      </footer>
    </>
  );
}
