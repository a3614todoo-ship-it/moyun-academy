import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migration 使用 DIRECT_URL，避免透過 transaction pooler 執行結構異動。
    url: env("DIRECT_URL"),
  },
});
