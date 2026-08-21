"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logoutAdmin } from "@/app/admin/actions";
import { AdminScrollToTop } from "@/components/admin-scroll-to-top";

type Props = {
  adminName: string;
  adminRole?: "OWNER" | "ADMIN" | "CHECKIN_STAFF";
  children: React.ReactNode;
};

type NavItem = { href: string; label: string; ownerOnly?: boolean };

const navGroups: Array<{ id: string; label: string; items: NavItem[] }> = [
  {
    id: "members-payments",
    label: "會員及付費管理",
    items: [
      { href: "/admin/membership-plans", label: "會員方案" },
      { href: "/admin/applications", label: "會員申請" },
      { href: "/admin/course-purchases", label: "課程訂單" },
    ],
  },
  {
    id: "learning",
    label: "教學管理",
    items: [
      { href: "/admin/courses", label: "課程管理" },
      { href: "/admin/questions", label: "課程問答" },
    ],
  },
  {
    id: "events",
    label: "活動管理",
    items: [
      { href: "/admin/events", label: "實體活動" },
      { href: "/admin/check-in", label: "現場報到" },
    ],
  },
  {
    id: "system",
    label: "系統管理",
    items: [
      { href: "/admin/emails", label: "Email 寄送" },
      { href: "/admin/settings", label: "系統設定" },
      { href: "/admin/security", label: "安全設定" },
      { href: "/admin/admin-users", label: "管理員帳號", ownerOnly: true },
    ],
  },
];

export function AdminShell({ adminName, adminRole = "ADMIN", children }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayAdminName = adminName || "我輩學堂管理員";
  const visibleGroups = useMemo(() => navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.ownerOnly || adminRole === "OWNER"),
  })).filter((group) => group.items.length), [adminRole]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeGroupId = visibleGroups.find((group) => group.items.some((item) => isActive(item.href)))?.id;
  const [openGroups, setOpenGroups] = useState<string[]>(activeGroupId ? [activeGroupId] : []);

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((current) => current.includes(activeGroupId) ? current : [...current, activeGroupId]);
    }
    setMenuOpen(false);
  }, [activeGroupId, pathname]);

  function toggleGroup(id: string, open: boolean) {
    setOpenGroups((current) => open
      ? current.includes(id) ? current : [...current, id]
      : current.filter((item) => item !== id));
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-app">
      <AdminScrollToTop />
      {menuOpen ? <button aria-label="關閉後台選單" className="admin-sidebar-scrim" onClick={closeMenu} type="button" /> : null}
      <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <button aria-label="關閉後台選單" className="admin-sidebar-close" onClick={closeMenu} type="button">×</button>
        <Link className="admin-brand" href="/admin">
          <span>我</span>
          <div>
            <strong>我輩學堂</strong>
            <small>管理後台</small>
          </div>
        </Link>
        <nav aria-label="管理後台主要導覽" className="admin-nav">
          <Link aria-current={pathname === "/admin" ? "page" : undefined} className="admin-nav-overview" href="/admin" onClick={closeMenu}>總覽</Link>
          {adminRole === "CHECKIN_STAFF" ? (
            <Link aria-current={isActive("/admin/check-in") ? "page" : undefined} className="admin-nav-overview" href="/admin/check-in" onClick={closeMenu}>現場報到</Link>
          ) : visibleGroups.map((group) => (
            <details className="admin-nav-group" key={group.id} onToggle={(event) => toggleGroup(group.id, event.currentTarget.open)} open={openGroups.includes(group.id)}>
              <summary className={group.id === activeGroupId ? "is-active" : undefined}>{group.label}</summary>
              <div className="admin-nav-group-links">
                {group.items.map((item) => (
                  <Link aria-current={isActive(item.href) ? "page" : undefined} href={item.href} key={item.href} onClick={closeMenu}>{item.label}</Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
        <Link className="admin-back-site" href="/" onClick={closeMenu}>← 返回前台網站</Link>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button aria-expanded={menuOpen} aria-label="開啟後台選單" className="admin-mobile-menu-button" onClick={() => setMenuOpen(true)} type="button">選單</button>
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
