"use client";

import { useState } from "react";

interface AvatarDisplayProps {
  avatarUrl: string | null | undefined;
  displayName: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl" | "xxl" | "seat";
  className?: string;
}

const SIZE_MAP = {
  sm: { px: 32, text: "text-xs" },
  md: { px: 48, text: "text-sm" },
  lg: { px: 64, text: "text-base" },
  seat: { px: 72, text: "text-lg" },
  xl: { px: 96, text: "text-xl" },
  xxl: { px: 128, text: "text-2xl" },
} as const;

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDefaultDiceBearUrl(displayName: string | null | undefined): string {
  const seed = encodeURIComponent(displayName?.trim() || "default");
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
}

export default function AvatarDisplay({
  avatarUrl,
  displayName,
  size = "md",
  className = "",
}: AvatarDisplayProps) {
  const s = SIZE_MAP[size];
  const dim = `${s.px}px`;
  const [imgError, setImgError] = useState(false);

  const baseClasses =
    "rounded-full border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.4)]";

  // Determine the image URL to use
  const imageUrl = avatarUrl && !avatarUrl.startsWith("emoji:") && !avatarUrl.startsWith("initials:")
    ? avatarUrl
    : null;

  const effectiveUrl = imageUrl || getDefaultDiceBearUrl(displayName);

  // If image hasn't errored, render an <img>
  if (!imgError) {
    return (
      <img
        src={effectiveUrl}
        alt={displayName ?? "Avatar"}
        className={`${baseClasses} object-cover ${className}`}
        style={{ width: dim, height: dim, minWidth: dim }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Ultimate fallback: initials
  return (
    <div
      className={`flex items-center justify-center ${baseClasses} bg-gradient-to-br from-felt-500 to-felt-700 ${s.text} font-bold text-white ${className}`}
      style={{ width: dim, height: dim, minWidth: dim }}
    >
      {getInitials(displayName)}
    </div>
  );
}

export { getInitials, getDefaultDiceBearUrl };
