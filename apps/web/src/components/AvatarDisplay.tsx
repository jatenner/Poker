"use client";

interface AvatarDisplayProps {
  avatarUrl: string | null | undefined;
  displayName: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: { px: 32, text: "text-xs", emoji: "text-base" },
  md: { px: 48, text: "text-sm", emoji: "text-xl" },
  lg: { px: 56, text: "text-base", emoji: "text-2xl" },
  xl: { px: 80, text: "text-xl", emoji: "text-4xl" },
} as const;

/** Parse `emoji:😎:bg-chip-red` format */
function parseEmojiAvatar(url: string): { emoji: string; bg: string } | null {
  if (!url.startsWith("emoji:")) return null;
  const parts = url.split(":");
  if (parts.length < 3) return null;
  return { emoji: parts[1], bg: parts.slice(2).join(":") };
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AvatarDisplay({
  avatarUrl,
  displayName,
  size = "md",
  className = "",
}: AvatarDisplayProps) {
  const s = SIZE_MAP[size];
  const dim = `${s.px}px`;

  // Emoji avatar
  if (avatarUrl && avatarUrl.startsWith("emoji:")) {
    const parsed = parseEmojiAvatar(avatarUrl);
    if (parsed) {
      return (
        <div
          className={`flex items-center justify-center rounded-full ${parsed.bg} ${className}`}
          style={{ width: dim, height: dim, minWidth: dim }}
        >
          <span className={s.emoji} role="img">
            {parsed.emoji}
          </span>
        </div>
      );
    }
  }

  // Initials with custom color: `initials:bg-chip-red`
  if (avatarUrl && avatarUrl.startsWith("initials:")) {
    const bgClass = avatarUrl.replace("initials:", "");
    return (
      <div
        className={`flex items-center justify-center rounded-full ${bgClass} ${s.text} font-bold text-white ${className}`}
        style={{ width: dim, height: dim, minWidth: dim }}
      >
        {getInitials(displayName)}
      </div>
    );
  }

  // Image URL
  if (avatarUrl && !avatarUrl.startsWith("emoji:")) {
    return (
      <img
        src={avatarUrl}
        alt={displayName ?? "Avatar"}
        className={`rounded-full object-cover ${className}`}
        style={{ width: dim, height: dim, minWidth: dim }}
      />
    );
  }

  // Initials fallback (no avatar set)
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-felt-500 to-felt-700 ${s.text} font-bold text-white ${className}`}
      style={{ width: dim, height: dim, minWidth: dim }}
    >
      {getInitials(displayName)}
    </div>
  );
}

export { parseEmojiAvatar, getInitials };
