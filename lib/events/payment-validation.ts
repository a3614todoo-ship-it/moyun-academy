import { z } from "zod";

export const eventPaymentReportSchema = z.object({
  registrationNo: z.string().trim().toUpperCase().regex(/^EV\d{14}$/, "請填寫正確的活動報名編號"),
  name: z.string().trim().min(2).max(50),
  phone: z.string().trim().regex(/^09\d{8}$/, "請填寫 10 碼手機號碼"),
  bankLast5: z.string().trim().regex(/^\d{5}$/, "請填寫帳號後五碼"),
  amount: z.coerce.number().int().positive(),
  paidAt: z.coerce.date(),
  payerName: z.string().trim().min(2).max(50),
  note: z.string().trim().max(500).optional(),
});
