"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const scrollTriggerParams = ["saved", "updated"];

export function AdminScrollToTop() {
  const searchParams = useSearchParams();
  const shouldScrollTop = scrollTriggerParams.some((param) => searchParams.has(param));

  useEffect(() => {
    if (!shouldScrollTop) return;

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [shouldScrollTop]);

  return null;
}
