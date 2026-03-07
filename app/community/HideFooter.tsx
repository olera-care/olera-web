"use client";

import { useLayoutEffect } from "react";

export default function HideFooter() {
  useLayoutEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "none";
    }
    return () => {
      if (footer) {
        footer.style.display = "";
      }
    };
  }, []);

  return null;
}
