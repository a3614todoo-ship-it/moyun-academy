import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";

function formatTaipeiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
}

export async function generateCoursePurchaseNumber() {
  const datePart = formatTaipeiDate(new Date());

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const sequence = randomInt(1, 10000).toString().padStart(4, "0");
    const purchaseNo = `CP${datePart}${sequence}`;
    const exists = await prisma.coursePurchase.findUnique({
      where: { purchaseNo },
      select: { id: true },
    });

    if (!exists) return purchaseNo;
  }

  throw new Error("無法產生課程購買編號，請稍後再試。");
}
