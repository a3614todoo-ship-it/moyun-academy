import { NextResponse } from "next/server";
import { getAuthorizedCoursePurchase } from "@/lib/course-access-session";
import { COURSE_HANDOUT_BUCKET, supabaseStorageAdmin } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await context.params;
  const purchase = await getAuthorizedCoursePurchase(slug);
  const lesson = purchase?.course.lessonUnits.find((item) => item.id === lessonId);
  if (!purchase || !lesson?.handoutStoragePath) return NextResponse.json({ message: "找不到教材或沒有觀看權限。" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const { data, error } = await supabaseStorageAdmin().storage.from(COURSE_HANDOUT_BUCKET).createSignedUrl(lesson.handoutStoragePath, 300, { download: lesson.handoutFileName || `${lesson.title}.pdf` });
  if (error || !data.signedUrl) return NextResponse.json({ message: "暫時無法建立教材下載連結。" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
