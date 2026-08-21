"use client";

import { useEffect, useRef, useState } from "react";

type ScanResult = { success: boolean; message: string; attendee?: { name: string; registrationNo: string; checkedInAt: string } };
type DetectorResult = { rawValue: string };
type Detector = { detect(source: HTMLVideoElement): Promise<DetectorResult[]> };
type DetectorConstructor = new (options: { formats: string[] }) => Detector;

export function EventCheckInScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null); const streamRef = useRef<MediaStream | null>(null); const scanningRef = useRef(false);
  const [active, setActive] = useState(false); const [result, setResult] = useState<ScanResult | null>(null); const [manualToken, setManualToken] = useState("");

  async function submitToken(raw: string) {
    if (scanningRef.current) return; scanningRef.current = true;
    try { const token = raw.trim().replace(/^WBEVT:/, ""); const response = await fetch("/api/admin/event-check-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, token }) }); const data = await response.json() as ScanResult; setResult(data); if (data.success && "vibrate" in navigator) navigator.vibrate(120); }
    catch { setResult({ success: false, message: "報到連線失敗，請改用人工搜尋。" }); }
    finally { window.setTimeout(() => { scanningRef.current = false; }, 1200); }
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  async function startCamera() {
    const DetectorClass = (globalThis as typeof globalThis & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!DetectorClass) { setResult({ success: false, message: "此瀏覽器不支援相機掃描，請輸入票券碼或使用人工搜尋。" }); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); streamRef.current = stream; const video = videoRef.current; if (!video) return; video.srcObject = stream; await video.play(); setActive(true); const detector = new DetectorClass({ formats: ["qr_code"] });
      const tick = async () => { if (!streamRef.current || !videoRef.current) return; try { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) await submitToken(codes[0].rawValue); } catch { /* 下一幀重試，避免單次辨識失敗中斷相機。 */ } requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    } catch { setResult({ success: false, message: "無法啟用相機，請確認瀏覽器權限或改用人工搜尋。" }); }
  }

  function stopCamera() { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; setActive(false); }

  return <section className="checkin-scanner"><div className="checkin-scanner-head"><div><span>QR SCAN</span><h2>掃描電子票券</h2></div><button onClick={active ? stopCamera : startCamera} type="button">{active ? "關閉相機" : "開啟相機"}</button></div><div className={`checkin-camera ${active ? "is-active" : ""}`}><video muted playsInline ref={videoRef} /><span>{active ? "將票券 QR Code 對準框內" : "相機尚未啟用"}</span></div><form onSubmit={(event) => { event.preventDefault(); void submitToken(manualToken); }} className="checkin-token-form"><label>票券內容／代碼<input value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="WBEVT:…" /></label><button type="submit">驗證報到</button></form>{result ? <div className={`checkin-result ${result.success ? "is-success" : "is-error"}`} role="status"><strong>{result.message}</strong>{result.attendee ? <span>{result.attendee.name}・{result.attendee.registrationNo}</span> : null}</div> : null}</section>;
}
