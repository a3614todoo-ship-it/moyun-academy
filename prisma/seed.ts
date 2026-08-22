import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";
import { courses } from "../lib/courses";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("缺少 DATABASE_URL，無法執行初始化資料。");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedMembershipPlan() {
  const benefits = [
    "會員期間觀看會員免費課程",
    "加入 Facebook 私密學習社團",
    "下載課程講義與延伸閱讀",
    "會員限定活動與講座資訊",
  ];

  const plans = [
    {
      code: "annual",
      name: "年度會員",
      price: 2500,
      durationDays: 365,
      description: "適合希望有系統、持續閱讀古典文學的學習者。",
      sortOrder: 1,
    },
  ];

  await prisma.membershipPlan.updateMany({
    where: { code: { not: "annual" } },
    data: { isActive: false },
  });

  await Promise.all(
    plans.map((plan) =>
      prisma.membershipPlan.upsert({
        where: { code: plan.code },
        update: { ...plan, benefits, isActive: true },
        create: { ...plan, benefits, isActive: true },
      }),
    ),
  );
}

async function seedCourses() {
  await Promise.all(
    courses.map((course, index) =>
      prisma.course.upsert({
        where: { slug: course.slug },
        update: {
          title: course.title,
          subtitle: course.subtitle,
          category: course.category,
          excerpt: course.excerpt,
          description: course.description,
          outline: course.outline,
          audiences: course.audiences,
          lessonCount: course.lessons,
          durationText: course.duration,
          isPublished: true,
          isFeatured: Boolean(course.featured),
          sortOrder: index + 1,
        },
        create: {
          slug: course.slug,
          title: course.title,
          subtitle: course.subtitle,
          category: course.category,
          excerpt: course.excerpt,
          description: course.description,
          outline: course.outline,
          audiences: course.audiences,
          lessonCount: course.lessons,
          durationText: course.duration,
          isPublished: true,
          isFeatured: Boolean(course.featured),
          sortOrder: index + 1,
          publishedAt: new Date(),
        },
      }),
    ),
  );
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "張曼娟大學堂管理員";

  if (!email || !password) {
    console.info("未設定 ADMIN_EMAIL 或 ADMIN_INITIAL_PASSWORD，略過管理員初始化。");
    return;
  }

  if (password.length < 12) {
    throw new Error("ADMIN_INITIAL_PASSWORD 至少需要 12 個字元。");
  }

  const passwordHash = await hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    // 已存在的帳號不可被 seed 重設密碼或重新啟用。
    update: { name },
    create: { email, name, passwordHash },
  });
}

async function main() {
  await seedMembershipPlan();
  await seedCourses();
  await seedAdmin();
  console.info("資料庫初始化完成。");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
