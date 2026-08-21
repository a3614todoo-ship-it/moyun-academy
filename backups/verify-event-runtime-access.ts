import { prisma } from "../lib/prisma";

async function main() {
  try {
    const rows = await prisma.inPersonEvent.findMany({
      where: { status: "PUBLISHED", endsAt: { gte: new Date() } },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { startsAt: "asc" }],
      include: {
        registrations: {
          where: { status: { in: ["PENDING_PAYMENT", "PAYMENT_REPORTED", "CONFIRMED", "WAITLIST_OFFERED"] } },
          select: { id: true },
        },
      },
    });
    console.log(JSON.stringify({ rows: rows.length }));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
