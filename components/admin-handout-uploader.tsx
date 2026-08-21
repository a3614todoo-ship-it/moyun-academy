"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { createHandoutUpload, finalizeHandoutUpload, removeHandout } from "@/app/admin/courses/[id]/lessons/handout-actions";

function mb(value: number | null) { return value ? `${(value / 1024 / 1024).toFixed(1)} MB` : ""; }
export function AdminHandoutUploader({ courseId, lessonId, fileName, fileSize, hasFile }: { courseId: string; lessonId: string; fileName: string | null; fileSize: number | null; hasFile: boolean }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function upload(formData: FormData) {
    const file = formData.get("file");
    if (!(file instanceof File)) return;
    setBusy(true); setMessage("正在上傳教材…");
    try {
      const signed = await createHandoutUpload({ courseId, lessonId, fileName: file.name, fileSize: file.size, contentType: file.type });
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("尚未設定 Supabase 前端公開憑證。");
      const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error } = await client.storage.from(process.env.NEXT_PUBLIC_SUPABASE_HANDOUT_BUCKET || "course-handouts").uploadToSignedUrl(signed.path, signed.token, file, { contentType: "application/pdf" });
      if (error) throw error;
      await finalizeHandoutUpload({ courseId, lessonId, path: signed.path, fileName: signed.fileName, fileSize: signed.fileSize, contentType: signed.contentType });
      setMessage("教材已安全上傳，重新整理後會顯示最新檔案。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "教材上傳失敗。"); } finally { setBusy(false); }
  }
  async function remove() { setBusy(true); try { await removeHandout({ courseId, lessonId }); setMessage("教材已刪除，重新整理後會更新。"); } catch (error) { setMessage(error instanceof Error ? error.message : "教材刪除失敗。"); } finally { setBusy(false); } }
  return <section className="admin-course-info-box"><div className="form-section-heading"><span>PDF</span><div><h2>受保護教材</h2><p>僅通過課程權限驗證的學員可取得 5 分鐘有效下載連結；上限 25 MB。</p></div></div>
    {hasFile ? <p>目前檔案：<strong>{fileName || "教材.pdf"}</strong> {mb(fileSize)}</p> : <p>目前尚未上傳教材。</p>}
    <form action={upload} className="admin-upload-form"><input accept="application/pdf,.pdf" name="file" required type="file" /><button disabled={busy} type="submit">{busy ? "處理中…" : hasFile ? "更換 PDF" : "上傳 PDF"}</button></form>
    {hasFile ? <button className="admin-danger-button" disabled={busy} onClick={remove} type="button">刪除目前教材</button> : null}
    {message ? <p aria-live="polite">{message}</p> : null}
  </section>;
}
