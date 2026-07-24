"use client";

import { useEffect, useState, type ReactNode } from "react";

export type HomeDesign = "original" | "window";

const designLabels: Record<HomeDesign, string> = {
  original: "原版",
  window: "窗景版",
};

export function HomeDesignSwitcher({
  initialDesign,
  original,
  windowDesign,
}: {
  initialDesign: HomeDesign;
  original: ReactNode;
  windowDesign: ReactNode;
}) {
  const [design, setDesign] = useState<HomeDesign>(initialDesign);

  useEffect(() => {
    document.documentElement.dataset.homeDesign = design;
    document.cookie = `home-design=${design}; Max-Age=31536000; Path=/; SameSite=Lax`;

    const url = new URL(window.location.href);
    if (url.searchParams.get("design") !== design) {
      url.searchParams.set("design", design);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }

    return () => {
      delete document.documentElement.dataset.homeDesign;
    };
  }, [design]);

  function selectDesign(nextDesign: HomeDesign) {
    if (nextDesign === design) return;

    setDesign(nextDesign);
  }

  return (
    <>
      <aside className="home-design-toolbar" aria-label="首頁風格切換">
        <div className="home-design-toolbar-inner">
          <span className="home-design-toolbar-label">首頁風格</span>
          <div className="home-design-options" role="group" aria-label="選擇首頁風格">
            {(Object.keys(designLabels) as HomeDesign[]).map((option) => (
              <button
                aria-pressed={design === option}
                className="home-design-option"
                key={option}
                onClick={() => selectDesign(option)}
                type="button"
              >
                {designLabels[option]}
              </button>
            ))}
          </div>
          <span className="visually-hidden" aria-live="polite">
            目前顯示{designLabels[design]}
          </span>
        </div>
      </aside>
      {design === "original" ? original : windowDesign}
    </>
  );
}
