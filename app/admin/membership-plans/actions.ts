"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function lines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export async function saveAnnualMembershipPlan(formData: FormData) {
  const session = await requireAdmin();
  const name = text(formData, "name");
  const price = Number.parseInt(text(formData, "price"), 10);
  const description = text(formData, "description");
  const benefits = lines(text(formData, "benefits"));

  if (!name || !Number.isInteger(price) || price < 0) {
    redirect("/admin/membership-plans?error=invalid");
  }

  const previous = await prisma.membershipPlan.findUnique({
    where: { code: "annual" },
    select: { id: true, name: true, price: true },
  });

  const annualPlan = await prisma.$transaction(async (transaction) => {
    await transaction.membershipPlan.updateMany({
      where: { code: { not: "annual" } },
      data: { isActive: false },
    });

    return transaction.membershipPlan.upsert({
      where: { code: "annual" },
      create: {
        code: "annual",
        name,
        price,
        durationDays: 365,
        description: description || null,
        benefits,
        isActive: true,
        sortOrder: 1,
      },
      update: {
        name,
        price,
        durationDays: 365,
        description: description || null,
        benefits,
        isActive: true,
        sortOrder: 1,
      },
    });
  });

  await recordAdminAudit({
    adminUserId: session.adminUser.id,
    action: previous?.price !== price ? "MEMBERSHIP_PRICE_CHANGED" : "MEMBERSHIP_PLAN_UPDATED",
    targetType: "MembershipPlan",
    targetId: annualPlan.id,
    metadata: {
      oldPrice: previous?.price ?? null,
      newPrice: price,
      oldName: previous?.name ?? null,
      newName: name,
      durationDays: 365,
    },
  });

  revalidatePath("/admin/membership-plans");
  revalidatePath("/membership");
  revalidatePath("/apply");
  redirect("/admin/membership-plans?saved=1");
}
