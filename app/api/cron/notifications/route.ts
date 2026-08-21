import { runScheduledNotifications } from "@/lib/email/scheduled-notifications";
import { isAuthorizedCronRequest } from "@/lib/security/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await runScheduledNotifications();
    return Response.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("每日營運通知排程執行失敗", error);
    return Response.json(
      { ok: false, error: "排程執行失敗，請查看伺服器紀錄。" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
