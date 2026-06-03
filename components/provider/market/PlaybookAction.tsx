"use client";

import { useState } from "react";

/**
 * Playbook action — either a link to a real product surface (reviews, call sheet)
 * or a one-click "contact the team" request that notifies Olera and morphs into a
 * warm confirmation inline (no mailto, no leaving the page).
 */
export default function PlaybookAction({
  label, href, requestType, city, state,
}: { label: string; href?: string; requestType?: string; city?: string; state?: string }) {
  const [state2, setState2] = useState<"idle" | "sending" | "done" | "error">("idle");

  const linkCls =
    "inline-flex items-center gap-1 text-[12.5px] font-medium text-[#199087] mt-2 hover:text-[#147a72] hover:gap-1.5 transition-all";

  if (href) {
    return (
      <a href={href} className={linkCls}>
        {label} <span aria-hidden>→</span>
      </a>
    );
  }

  if (state2 === "done") {
    return (
      <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700 mt-2 animate-[fadeUp_.35s_ease-out]">
        <style dangerouslySetInnerHTML={{ __html: "@keyframes fadeUp{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}" }} />
        <span aria-hidden>✓</span> Got it — the team will reach out
      </div>
    );
  }

  const onClick = () => {
    if (state2 === "sending") return; // allow retry from idle or error
    setState2("sending");
    fetch("/api/provider/market-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: requestType, city, state }),
    })
      .then((r) => setState2(r.ok ? "done" : "error"))
      .catch(() => setState2("error"));
  };

  if (state2 === "error") {
    return (
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-amber-700 mt-2 hover:text-amber-800 transition-colors">
        Couldn&apos;t send — tap to try again
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={state2 === "sending"} className={`${linkCls} disabled:opacity-60`}>
      {label} <span aria-hidden>→</span>
    </button>
  );
}
