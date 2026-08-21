import { saveAnnualMembershipPlan } from "@/app/admin/membership-plans/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

function benefitsText(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join("\n")
    : "";
}

export default async function AdminMembershipPlansPage({ searchParams }: Props) {
  const [session, plan, params] = await Promise.all([
    requireAdmin(),
    prisma.membershipPlan.findUnique({
      where: { code: "annual" },
      include: { _count: { select: { applications: true } } },
    }),
    searchParams,
  ]);

  return (
    <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}>
      <div className="admin-page-heading">
        <div>
          <span>單一年度會員制</span>
          <h1>會員方案管理</h1>
        </div>
      </div>

      {params.saved === "1" ? <div className="admin-success-message">年度會員方案已儲存。</div> : null}
      {params.error ? <div className="admin-form-error admin-course-message">請確認方案名稱與費用是否正確。</div> : null}

      <section className="admin-panel admin-plan-editor-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>年度會員</h2>
            <p>新申請會使用儲存後的費用；既有申請與訂閱仍保留當時金額。</p>
          </div>
        </div>
        <form action={saveAnnualMembershipPlan} className="admin-plan-form">
          <div className="admin-settings-grid">
            <label>方案代碼<input disabled value="annual" /></label>
            <label>方案名稱<input defaultValue={plan?.name || "年度會員"} name="name" required /></label>
            <label>年費<input defaultValue={plan?.price ?? 2500} min="0" name="price" required type="number" /></label>
            <label>會員效期<input disabled value="365 天" /></label>
          </div>
          <label>
            方案說明
            <textarea defaultValue={plan?.description || "一年內持續參與我輩學堂的會員課程與學習活動。"} name="description" rows={3} />
          </label>
          <label>
            權益說明（一行一項）
            <textarea
              defaultValue={benefitsText(plan?.benefits) || "會員期間不限次數觀看會員課程\n加入 Facebook 私密學習社團\n付費課程提前 7 天開放報名\n優先取得學堂活動資訊"}
              name="benefits"
              rows={5}
            />
          </label>
          <p>目前已有 {plan?._count.applications ?? 0} 筆申請使用年度會員方案。</p>
          <button className="admin-primary-button" type="submit">儲存年度會員方案</button>
        </form>
      </section>
    </AdminShell>
  );
}
