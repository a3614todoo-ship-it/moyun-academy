import { NextResponse } from "next/server";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { applicationStatusLabels, formatTaipeiDateTime } from "@/lib/admin/labels";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const rawStatus = url.searchParams.get("status");
  const status = Object.values(ApplicationStatus).includes(rawStatus as ApplicationStatus)
    ? (rawStatus as ApplicationStatus)
    : undefined;

  const rows = await prisma.application.findMany({
    where: {
      status,
      OR: q
        ? [
            { applicationNo: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ]
        : undefined,
    },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = ["報名編號", "姓名", "手機", "Email", "地址", "Facebook 名稱", "Facebook 連結", "方案", "狀態", "建立時間"];
  const csv = [
    header.map(csvCell).join(","),
    ...rows.map((item) =>
      [
        item.applicationNo, item.name, item.phone, item.email, item.address,
        item.facebookName, item.facebookProfileUrl, item.plan.name,
        applicationStatusLabels[item.status], formatTaipeiDateTime(item.createdAt),
      ].map(csvCell).join(","),
    ),
  ].join("\r\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
