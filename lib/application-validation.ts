import { z } from "zod";
import { normalizeTaiwanMobile } from "@/lib/phone";

const taiwanPhonePattern = /^(?:\+?886[-\s]?)?0?9\d{8}$/;

export const applicationSchema = z.object({
  name: z.string().trim().min(2, "請填寫至少 2 個字的姓名").max(50, "姓名不可超過 50 個字"),
  phone: z
    .string()
    .trim()
    .transform(normalizeTaiwanMobile)
    .refine((value) => taiwanPhonePattern.test(value), "請填寫有效的台灣手機號碼"),
  email: z.string().trim().toLowerCase().email("請填寫有效的 Email"),
  address: z.string().trim().min(6, "請填寫完整通訊地址").max(200, "地址不可超過 200 個字"),
  facebookName: z.string().trim().min(1, "請填寫 Facebook 帳號名稱").max(100),
  facebookProfileUrl: z
    .string()
    .trim()
    .url("請填寫有效的 Facebook 個人頁連結")
    .refine(
      (value) => {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase();
        return url.protocol === "https:" && (hostname === "facebook.com" || hostname.endsWith(".facebook.com"));
      },
      "連結必須是 facebook.com 網址",
    ),
  planCode: z.string().trim().min(1, "請選擇會員方案"),
  agreedToTerms: z.literal("on", {
    error: "請先閱讀並同意會員規範",
  }),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
