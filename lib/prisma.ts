import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const SSL_QUERY_PARAMS = ["sslmode", "uselibpqcompat", "sslrootcert", "sslcert", "sslkey"];

function buildPostgresConnectionConfig(connectionString: string) {
  const encodedCa = process.env.DATABASE_CA_CERT_BASE64?.trim();
  if (!encodedCa) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("正式環境缺少 DATABASE_CA_CERT_BASE64，已拒絕降低 TLS 驗證等級");
    }
    return { connectionString };
  }

  const ca = Buffer.from(encodedCa, "base64").toString("utf8").trim();
  if (!ca.startsWith("-----BEGIN CERTIFICATE-----") || !ca.endsWith("-----END CERTIFICATE-----")) {
    throw new Error("DATABASE_CA_CERT_BASE64 不是有效的 PEM 憑證");
  }

  // connectionString 內的 SSL 參數會覆蓋 pg 的 ssl 物件，需先移除再強制完整驗證。
  const url = new URL(connectionString);
  for (const key of SSL_QUERY_PARAMS) url.searchParams.delete(key);

  return {
    connectionString: url.toString(),
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
  };
}

function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("缺少 DATABASE_URL，請確認執行環境設定。");
  }

  const pool = globalForPrisma.pgPool ?? new Pool({
    ...buildPostgresConnectionConfig(connectionString),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    options: "-c statement_timeout=15000 -c idle_in_transaction_session_timeout=15000",
  });
  const client = new PrismaClient({ adapter: new PrismaPg(pool) });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
    globalForPrisma.prisma = client;
  }

  return client;
}

// 讓現有呼叫維持 prisma.model.*，但直到真正查詢時才建立連線。
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = client[property as keyof PrismaClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
