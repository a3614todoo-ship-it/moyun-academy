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

export async function generateApplicationNumber() {
  const datePart = formatTaipeiDate(new Date());

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const sequence = randomInt(1, 10000).toString().padStart(4, "0");
    const applicationNo = `CL${datePart}${sequence}`;
    const exists = await prisma.application.findUnique({
      where: { applicationNo },
      select: { id: true },
    });

    if (!exists) {
      return applicationNo;
    }
  }

  throw new Error("暫時無法產生報名編號，請稍後再試。");
}
