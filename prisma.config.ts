import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migration 使用直連或 Session pooler，避免 transaction pooler 限制。
    url: env("DIRECT_URL"),
  },
});
