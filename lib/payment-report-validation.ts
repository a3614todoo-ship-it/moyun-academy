import { z } from "zod";
import { normalizeTaiwanMobile } from "@/lib/phone";

const phonePattern = /^(?:\+?886[-\s]?)?0?9\d{8}$/;

export const paymentReportSchema = z.object({
  applicationNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^CL\d{12}$/, "請填寫正確的報名編號"),
  name: z.string().trim().min(2, "請填寫報名時使用的姓名").max(50),
  phone: z
    .string()
    .trim()
    .transform(normalizeTaiwanMobile)
    .refine((value) => phonePattern.test(value), "請填寫有效的台灣手機號碼"),
  bankLast5: z.string().trim().regex(/^\d{5}$/, "請填寫匯款帳號後五碼"),
  amount: z.coerce.number().int().positive("匯款金額必須大於 0").max(1000000),
  paidAt: z.coerce.date({ error: "請選擇匯款日期" }),
  payerName: z.string().trim().min(2, "請填寫匯款人姓名").max(50),
  note: z.string().trim().max(500, "備註不可超過 500 個字").optional(),
});
