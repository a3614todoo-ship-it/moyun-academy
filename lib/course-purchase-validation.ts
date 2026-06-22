import { z } from "zod";
import { normalizeTaiwanMobile } from "@/lib/phone";

const phonePattern = /^(?:\+?886[-\s]?)?0?9\d{8}$/;

export const coursePurchaseSchema = z.object({
  courseId: z.string().trim().min(1, "請選擇課程。"),
  name: z.string().trim().min(2, "請填寫至少 2 個字的姓名。").max(50),
  phone: z
    .string()
    .trim()
    .transform(normalizeTaiwanMobile)
    .refine((value) => phonePattern.test(value), "請填寫有效的手機號碼。"),
  email: z.string().trim().toLowerCase().email("請填寫有效的 Email。"),
  agreedToTerms: z.literal("on", {
    error: "請勾選確認購買與匯款資訊。",
  }),
});

export type CoursePurchaseFormValues = z.infer<typeof coursePurchaseSchema>;
