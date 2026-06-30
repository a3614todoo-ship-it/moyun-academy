"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validPlanCode(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function redirectWithError(error: string, id?: string) {
  const suffix = id ? `&id=${encodeURIComponent(id)}` : "";
  redirect(`/admin/membership-plans?error=${error}${suffix}`);
}

export async function saveMembershipPlan(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  const code = text(formData, "code").toLowerCase();
  const name = text(formData, "name");
  const price = Number.parseInt(text(formData, "price"), 10);
  const durationDays = Number.parseInt(text(formData, "durationDays"), 10);
  const sortOrder = Number.parseInt(text(formData, "sortOrder"), 10);
  const description = text(formData, "description");
  const benefits = lines(text(formData, "benefits"));
  const isActive = formData.get("isActive") === "on";

  if (
    !code ||
    !name ||
    !validPlanCode(code) ||
    !Number.isInteger(price) ||
    price < 0 ||
    !Number.isInteger(durationDays) ||
    durationDays <= 0 ||
    !Number.isInteger(sortOrder)
  ) {
    redirectWithError("invalid", id);
  }

  const duplicate = await prisma.membershipPlan.findFirst({
    where: { code, id: id ? { not: id } : undefined },
    select: { id: true },
  });

  if (duplicate) {
    redirectWithError("duplicate", id);
  }

  const data = {
    code,
    name,
    price,
    durationDays,
    description: description || null,
    benefits,
    isActive,
    sortOrder,
  };

  if (id) {
    const existing = await prisma.membershipPlan.findUnique({ where: { id }, select: { id: true } });
    if (!existing) redirect("/admin/membership-plans?error=missing");
    await prisma.membershipPlan.update({ where: { id }, data });
  } else {
    await prisma.membershipPlan.create({ data });
  }

  revalidatePath("/admin/membership-plans");
  revalidatePath("/membership");
  revalidatePath("/apply");
  redirect("/admin/membership-plans?saved=1");
}

export async function toggleMembershipPlanActive(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const plan = await prisma.membershipPlan.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!plan) redirect("/admin/membership-plans?error=missing");

  await prisma.membershipPlan.update({
    where: { id },
    data: { isActive: !plan.isActive },
  });

  revalidatePath("/admin/membership-plans");
  revalidatePath("/membership");
  revalidatePath("/apply");
  redirect("/admin/membership-plans?saved=1");
}
