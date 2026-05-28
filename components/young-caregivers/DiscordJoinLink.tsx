"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const DISCORD_URL = "https://discord.com/invite/R8Mkj5VJsk";

interface DiscordJoinLinkProps {
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

export default function DiscordJoinLink({ className, style, children }: DiscordJoinLinkProps) {
  const trackClick = () => {
    fetch("/api/activity/track-page-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: "/caregiver-support/young-caregivers",
        event_type: "discord_join_clicked",
        metadata: {
          referrer: document.referrer || null,
        },
      }),
      keepalive: true,
    }).catch(() => {});
  };

  return (
    <Link
      href={DISCORD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={trackClick}
    >
      {children}
    </Link>
  );
}
