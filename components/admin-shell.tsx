import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { AdminScrollToTop } from "@/components/admin-scroll-to-top";

type Props = {
  adminName: string;
  adminRole?: "OWNER" | "ADMIN" | "CHECKIN_STAFF";
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/courses", label: "課程管理" },
  { href: "/admin/events", label: "實體活動" },
  { href: "/admin/check-in", label: "現場報到" },
  { href: "/admin/course-purchases", label: "課程購買" },
  { href: "/admin/course-purchases?status=PAYMENT_REPORTED", label: "課程匯款審核" },
  { href: "/admin/questions", label: "課程問答" },
  { href: "/admin/membership-plans", label: "會員方案" },
  { href: "/admin/applications", label: "會員申請" },
  { href: "/admin/applications?status=PAYMENT_REPORTED", label: "會員匯款審核" },
  { href: "/admin/emails", label: "Email 寄送" },
  { href: "/admin/settings", label: "系統設定" },
  { href: "/admin/security", label: "安全設定" },
  { href: "/admin/admin-users", label: "管理員帳號", ownerOnly: true },
];

export function AdminShell({ adminName, adminRole = "ADMIN", children }: Props) {
  const displayAdminName = adminName || "我輩學堂管理員";

  return (
    <div className="admin-app">
      <AdminScrollToTop />
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span>我</span>
          <div>
            <strong>我輩學堂</strong>
            <small>管理後台</small>
          </div>
        </Link>
        <nav>
          {navItems.filter((item) => {
            if (adminRole === "CHECKIN_STAFF") return item.href === "/admin/check-in";
            return !item.ownerOnly || adminRole === "OWNER";
          }).map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <Link className="admin-back-site" href="/">返回前台網站</Link>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>管理員：{displayAdminName === "墨韻學堂管理員" ? "我輩學堂管理員" : displayAdminName}</span>
          <form action={logoutAdmin}>
            <button type="submit">登出</button>
          </form>
        </header>
        <main className="admin-page">{children}</main>
      </div>
    </div>
  );
}
