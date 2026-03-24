"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/supabase/client";
import AvatarDisplay from "@/components/AvatarDisplay";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type AvatarTab = "upload" | "emoji" | "color";

const EMOJI_AVATARS = [
  "😎", "🤠", "🧑‍🚀", "👨‍🎤", "🦊", "🐱", "🐶", "🦁", "🐼", "🐸",
  "🤖", "👽", "💀", "🎃", "🦄", "🐙", "🦅", "🐺", "🧙", "👑",
  "🎭", "🃏", "🎲", "🎯", "🔥", "⚡", "💎", "🌟", "🍀", "🎪",
];

const EMOJI_BG_COLORS = [
  { name: "Red", value: "bg-chip-red", hex: "#ef4444" },
  { name: "Blue", value: "bg-chip-blue", hex: "#3b82f6" },
  { name: "Gold", value: "bg-chip-gold", hex: "#d4a017" },
  { name: "Green", value: "bg-felt-500", hex: "#4caf50" },
  { name: "Purple", value: "bg-purple-600", hex: "#9333ea" },
  { name: "Orange", value: "bg-orange-600", hex: "#ea580c" },
  { name: "Teal", value: "bg-teal-600", hex: "#0d9488" },
  { name: "Pink", value: "bg-pink-600", hex: "#db2777" },
];

const INITIALS_COLORS = [
  { name: "Emerald", value: "bg-felt-500", hex: "#4caf50" },
  { name: "Forest", value: "bg-felt-700", hex: "#2e7d32" },
  { name: "Red", value: "bg-chip-red", hex: "#ef4444" },
  { name: "Blue", value: "bg-chip-blue", hex: "#3b82f6" },
  { name: "Gold", value: "bg-chip-gold", hex: "#d4a017" },
  { name: "Purple", value: "bg-purple-600", hex: "#9333ea" },
  { name: "Orange", value: "bg-orange-600", hex: "#ea580c" },
  { name: "Teal", value: "bg-teal-600", hex: "#0d9488" },
  { name: "Pink", value: "bg-pink-600", hex: "#db2777" },
  { name: "Indigo", value: "bg-indigo-600", hex: "#4f46e5" },
  { name: "Rose", value: "bg-rose-600", hex: "#e11d48" },
  { name: "Slate", value: "bg-slate-600", hex: "#475569" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<AvatarTab>("emoji");

  // Emoji picker state
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedEmojiBg, setSelectedEmojiBg] = useState(EMOJI_BG_COLORS[0].value);

  // Initials color state
  const [selectedInitialsColor, setSelectedInitialsColor] = useState(INITIALS_COLORS[0].value);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? null);

      // Parse existing avatar to set tab state
      if (profile.avatar_url?.startsWith("emoji:")) {
        const parts = profile.avatar_url.split(":");
        if (parts.length >= 3) {
          setSelectedEmoji(parts[1]);
          setSelectedEmojiBg(parts.slice(2).join(":"));
          setActiveTab("emoji");
        }
      } else if (profile.avatar_url?.startsWith("initials:")) {
        const color = profile.avatar_url.replace("initials:", "");
        setSelectedInitialsColor(color || INITIALS_COLORS[0].value);
        setActiveTab("color");
      } else if (profile.avatar_url) {
        setActiveTab("upload");
      }
    } else if (user) {
      setDisplayName(
        user.user_metadata?.display_name ?? user.email ?? ""
      );
    }
  }, [user, profile]);

  /* ---- Upload ---- */

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) return;

      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please upload an image file." });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image must be under 2MB." });
        return;
      }

      setUploading(true);
      setMessage(null);

      const supabase = createBrowserClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setMessage({ type: "error", text: uploadError.message });
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const newUrl = publicUrl + "?t=" + Date.now();
      setAvatarUrl(newUrl);
      setMessage({ type: "success", text: "Photo uploaded! Click Save to apply." });
      setUploading(false);
    },
    [user]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadAvatar(file);
    },
    [uploadAvatar]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  /* ---- Emoji selection ---- */

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    const url = `emoji:${emoji}:${selectedEmojiBg}`;
    setAvatarUrl(url);
  };

  const handleSelectEmojiBg = (bg: string) => {
    setSelectedEmojiBg(bg);
    if (selectedEmoji) {
      setAvatarUrl(`emoji:${selectedEmoji}:${bg}`);
    }
  };

  /* ---- Initials color selection ---- */

  const handleSelectInitialsColor = (color: string) => {
    setSelectedInitialsColor(color);
    setAvatarUrl(`initials:${color}`);
  };

  /* ---- Save ---- */

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    // Determine the final avatar URL
    let finalAvatarUrl = avatarUrl;
    if (activeTab === "color") {
      finalAvatarUrl = `initials:${selectedInitialsColor}`;
    } else if (activeTab === "emoji" && selectedEmoji) {
      finalAvatarUrl = `emoji:${selectedEmoji}:${selectedEmojiBg}`;
    }
    // For upload tab, avatarUrl is already set from upload handler

    const supabase = createBrowserClient();
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName.trim(),
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setAvatarUrl(finalAvatarUrl);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }

    setSaving(false);
  };

  /* ---- Derived avatar for preview ---- */

  const getPreviewAvatarUrl = (): string | null => {
    if (activeTab === "emoji" && selectedEmoji) {
      return `emoji:${selectedEmoji}:${selectedEmojiBg}`;
    }
    if (activeTab === "color") {
      return `initials:${selectedInitialsColor}`;
    }
    return avatarUrl;
  };

  /* ---- Loading ---- */

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-felt-700 border-t-felt-400" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  const previewUrl = getPreviewAvatarUrl();

  const tabs: { key: AvatarTab; label: string; icon: string }[] = [
    { key: "emoji", label: "Choose Avatar", icon: "🎭" },
    { key: "upload", label: "Upload Photo", icon: "📷" },
    { key: "color", label: "Initials Color", icon: "🎨" },
  ];

  return (
    <div className="flex min-h-screen justify-center px-4 pt-20 pb-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Your Profile
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Customize how you appear at the table
          </p>
        </div>

        {/* Preview Card */}
        <div className="card-surface">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Table Preview
          </h2>
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-felt-900/40 to-black/30 px-10 py-5">
              {/* Glow ring */}
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-felt-400/20 blur-md" />
                <div className="relative overflow-hidden rounded-full border-[2.5px] border-felt-400/60 shadow-lg">
                  <AvatarDisplay
                    avatarUrl={previewUrl}
                    displayName={displayName}
                    size="xl"
                  />
                </div>
              </div>
              <div className="mt-1 text-sm font-semibold text-chip-gold">
                {displayName || "Your Name"}
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-felt-300">
                <span className="text-felt-400/60">$</span>
                1,000
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Selection */}
        <div className="card-surface">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Avatar
          </h2>

          {/* Tabs */}
          <div className="mb-5 flex gap-1 rounded-xl bg-black/30 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-felt-700/60 text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Upload Photo Tab */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all ${
                  dragOver
                    ? "border-felt-400 bg-felt-900/20"
                    : "border-white/10 bg-black/20 hover:border-felt-600/50 hover:bg-black/30"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-felt-400 border-t-transparent" />
                    <span className="text-sm text-[var(--color-text-secondary)]">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-felt-800/40">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-felt-400">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        Click to upload or drag & drop
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {/* Show current uploaded photo if exists */}
              {avatarUrl && !avatarUrl.startsWith("emoji:") && !avatarUrl.startsWith("initials:") && (
                <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3">
                  <img src={avatarUrl} alt="Current" className="h-12 w-12 rounded-full object-cover" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Current uploaded photo</span>
                </div>
              )}
            </div>
          )}

          {/* Choose Avatar (Emoji) Tab */}
          {activeTab === "emoji" && (
            <div className="space-y-5">
              {/* Emoji Grid */}
              <div>
                <p className="mb-2.5 text-xs font-medium text-[var(--color-text-secondary)]">
                  Pick a character
                </p>
                <div className="grid grid-cols-10 gap-2">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all hover:scale-110 ${
                        selectedEmoji === emoji
                          ? "bg-felt-600/40 ring-2 ring-felt-400 shadow-lg shadow-felt-500/20"
                          : "bg-black/30 hover:bg-white/[0.06]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <p className="mb-2.5 text-xs font-medium text-[var(--color-text-secondary)]">
                  Background color
                </p>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_BG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleSelectEmojiBg(color.value)}
                      className={`h-9 w-9 rounded-full transition-all hover:scale-110 ${
                        selectedEmojiBg === color.value
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--color-bg-surface)]"
                          : ""
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Mini preview */}
              {selectedEmoji && (
                <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3">
                  <AvatarDisplay
                    avatarUrl={`emoji:${selectedEmoji}:${selectedEmojiBg}`}
                    displayName={displayName}
                    size="lg"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Selected: {selectedEmoji}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Choose Color Tab */}
          {activeTab === "color" && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Your initials will be shown in a colored circle. Pick a color:
              </p>
              <div className="grid grid-cols-6 gap-3">
                {INITIALS_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleSelectInitialsColor(color.value)}
                    className={`group relative flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white transition-all hover:scale-110 ${
                      selectedInitialsColor === color.value
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--color-bg-surface)]"
                        : ""
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {displayName
                      ? displayName
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "?"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="card-surface">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Details
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none transition focus:border-felt-500 focus:ring-1 focus:ring-felt-500"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email ?? ""}
                disabled
                className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text-secondary)] opacity-60"
              />
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]/60">
                Email cannot be changed
              </p>
            </div>

            {message && (
              <p
                className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
                  message.type === "error"
                    ? "bg-chip-red/10 text-chip-red"
                    : "bg-felt-600/10 text-felt-300"
                }`}
              >
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </span>
              ) : (
                "Save Profile"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
