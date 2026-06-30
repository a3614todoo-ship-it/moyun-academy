import { saveMembershipPlan, toggleMembershipPlanActive } from "@/app/admin/membership-plans/actions";
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

const errorMessages: Record<string, string> = {
  invalid: "請確認方案代碼、名稱、費用、效期與排序是否正確。方案代碼只能使用小寫英文、數字與連字號。",
  duplicate: "這個方案代碼已經被使用，請換一個代碼。",
  missing: "找不到要更新的會員方案。",
};

export default async function AdminMembershipPlansPage({ searchParams }: Props) {
  const [session, plans, params] = await Promise.all([
    requireAdmin(),
    prisma.membershipPlan.findMany({
      include: { _count: { select: { applications: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    searchParams,
  ]);

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <span>會員類型、費用與效期</span>
          <h1>會員方案管理</h1>
        </div>
      </div>

      {params.saved === "1" ? <div className="admin-success-message">會員方案已儲存。</div> : null}
      {params.error ? (
        <div className="admin-form-error admin-course-message">
          {errorMessages[params.error] || "會員方案儲存失敗，請再檢查一次。"}
        </div>
      ) : null}

      <section className="admin-panel admin-plan-editor-panel">
        <div className="admin-panel-heading">
          <h2>新增會員方案</h2>
        </div>
        <form action={saveMembershipPlan} className="admin-plan-form">
          <div className="admin-settings-grid">
            <label>
              方案代碼
              <input name="code" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="monthly" required />
            </label>
            <label>
              方案名稱
              <input name="name" placeholder="一個月會員" required />
            </label>
            <label>
              費用
              <input min="0" name="price" placeholder="600" required type="number" />
            </label>
            <label>
              會員天數
              <input min="1" name="durationDays" placeholder="30" required type="number" />
            </label>
            <label>
              排序
              <input defaultValue={plans.length + 1} name="sortOrder" required type="number" />
            </label>
            <label className="admin-inline-check">
              <input defaultChecked name="isActive" type="checkbox" />
              前台顯示此方案
            </label>
          </div>
          <label>
            方案說明
            <textarea name="description" placeholder="適合短期體驗我輩學堂的學員。" rows={3} />
          </label>
          <label>
            權益說明（一行一項）
            <textarea
              name="benefits"
              placeholder={"會員期間觀看會員免費課程\n加入 Facebook 私密學習社團\n下載課程講義與延伸閱讀"}
              rows={5}
            />
          </label>
          <button className="admin-primary-button" type="submit">新增方案</button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>既有方案</h2>
        </div>
        <div className="admin-plan-list">
          {plans.map((plan) => (
            <article className="admin-plan-card" key={plan.id}>
              <form action={saveMembershipPlan} className="admin-plan-form">
                <input name="id" type="hidden" value={plan.id} />
                <div className="admin-plan-card-heading">
                  <div>
                    <span className={`admin-publish-state ${plan.isActive ? "is-published" : ""}`}>
                      {plan.isActive ? "前台顯示" : "已停用"}
                    </span>
                    <h3>{plan.name}</h3>
                    <p>已有 {plan._count.applications} 筆會員申請使用此方案。</p>
                  </div>
                  <div className="admin-table-actions">
                    <button type="submit">儲存</button>
                  </div>
                </div>
                <div className="admin-settings-grid">
                  <label>
                    方案代碼
                    <input defaultValue={plan.code} name="code" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
                  </label>
                  <label>
                    方案名稱
                    <input defaultValue={plan.name} name="name" required />
                  </label>
                  <label>
                    費用
                    <input defaultValue={plan.price} min="0" name="price" required type="number" />
                  </label>
                  <label>
                    會員天數
                    <input defaultValue={plan.durationDays} min="1" name="durationDays" required type="number" />
                  </label>
                  <label>
                    排序
                    <input defaultValue={plan.sortOrder} name="sortOrder" required type="number" />
                  </label>
                  <label className="admin-inline-check">
                    <input defaultChecked={plan.isActive} name="isActive" type="checkbox" />
                    前台顯示此方案
                  </label>
                </div>
                <label>
                  方案說明
                  <textarea defaultValue={plan.description || ""} name="description" rows={3} />
                </label>
                <label>
                  權益說明（一行一項）
                  <textarea defaultValue={benefitsText(plan.benefits)} name="benefits" rows={5} />
                </label>
              </form>
              <form action={toggleMembershipPlanActive} className="admin-plan-toggle-form">
                <input name="id" type="hidden" value={plan.id} />
                <button type="submit">{plan.isActive ? "停用方案" : "啟用方案"}</button>
              </form>
            </article>
          ))}
          {!plans.length ? <p className="admin-empty">目前尚未建立會員方案。</p> : null}
        </div>
      </section>
    </AdminShell>
  );
}
