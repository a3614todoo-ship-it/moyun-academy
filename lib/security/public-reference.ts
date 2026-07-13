import { createHmac, timingSafeEqual } from "node:crypto";

function publicReferenceSecret() {
  const value = process.env.PUBLIC_REFERENCE_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("缺少至少 32 字元的 PUBLIC_REFERENCE_SECRET 或 MEMBER_AUTH_SECRET。");
  }
  return value;
}

export function buildPublicReferenceSignature(kind: "application" | "purchase", reference: string) {
  return createHmac("sha256", publicReferenceSecret())
    .update(`${kind}:${reference}`)
    .digest("base64url");
}

export function verifyPublicReferenceSignature(
  kind: "application" | "purchase",
  reference: string,
  signature?: string,
) {
  if (!signature) return false;
  const expected = Buffer.from(buildPublicReferenceSignature(kind, reference));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function publicReferenceQuery(kind: "application" | "purchase", reference: string) {
  const name = kind === "application" ? "application_no" : "purchase_no";
  const signature = buildPublicReferenceSignature(kind, reference);
  return `${name}=${encodeURIComponent(reference)}&sig=${encodeURIComponent(signature)}`;
}
