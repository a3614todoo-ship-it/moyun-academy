import { z } from "zod";

export const eventRegistrationSchema = z.object({
  eventId: z.string().trim().min(1),
  name: z.string().trim().min(2, "請填寫姓名").max(50),
  phone: z.string().trim().regex(/^09\d{8}$/, "請填寫 10 碼手機號碼"),
  email: z.email("請填寫正確的 Email").trim().toLowerCase().max(120),
  agreedToPrivacy: z.literal("on", { error: "請閱讀並同意個資蒐集告知" }),
});
