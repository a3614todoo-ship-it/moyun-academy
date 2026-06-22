import { z } from "zod";
import { normalizeTaiwanMobile } from "@/lib/phone";

const phonePattern = /^(?:\+?886[-\s]?)?0?9\d{8}$/;

export const coursePaymentReportSchema = z.object({
  purchaseNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^CP\d{12}$/, "請填寫正確的課程購買編號。"),
  name: z.string().trim().min(2, "請填寫購買人姓名。").max(50),
  phone: z
    .string()
    .trim()
    .transform(normalizeTaiwanMobile)
    .refine((value) => phonePattern.test(value), "請填寫有效的手機號碼。"),
  bankLast5: z.string().trim().regex(/^\d{5}$/, "請填寫匯款帳號後五碼。"),
  amount: z.coerce.number().int().positive("匯款金額必須大於 0。").max(1000000),
  paidAt: z.coerce.date({ error: "請選擇匯款日期。" }),
  payerName: z.string().trim().min(2, "請填寫匯款人姓名。").max(50),
  note: z.string().trim().max(500, "備註不可超過 500 字。").optional(),
});

export type CoursePaymentReportValues = z.infer<typeof coursePaymentReportSchema>;
