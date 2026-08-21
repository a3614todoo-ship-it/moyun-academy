import { AdminEventForm } from "@/components/admin-event-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewEventPage() {
  const session = await requireAdmin();
  return <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}><div className="admin-page-heading"><div><span>建立活動基本資料與報名規則</span><h1>新增實體活動</h1></div></div><AdminEventForm /></AdminShell>;
}
