import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

type Props = {
  adminName: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "營運總覽" },
  { href: "/admin/courses", label: "課程管理" },
  { href: "/admin/applications", label: "報名名單" },
  { href: "/admin/applications?status=PAYMENT_REPORTED", label: "匯款審核" },
  { href: "/admin/settings", label: "系統設定" },
];

export function AdminShell({ adminName, children }: Props) {
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span>我</span>
          <div><strong>我輩學堂</strong><small>管理後台</small></div>
        </Link>
        <nav>
          {navItems.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <Link className="admin-back-site" href="/">← 返回前台網站</Link>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>管理員：{adminName}</span>
          <form action={logoutAdmin}><button type="submit">登出</button></form>
        </header>
        <main className="admin-page">{children}</main>
      </div>
    </div>
  );
}
