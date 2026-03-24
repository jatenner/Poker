"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/supabase/client";
import AvatarDisplay from "@/components/AvatarDisplay";
import AvatarBuilder from "@/components/AvatarBuilder";
import {
  type AvatarConfig,
  DEFAULT_CONFIG,
  buildAvatarUrl,
  parseAvatarUrl,
} from "@/lib/avatarConfig";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AvatarMode = "build" | "upload";

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

  // Avatar mode
  const [mode, setMode] = useState<AvatarMode>("build");

  // AvatarBuilder config state
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_CONFIG);

  /* ---- Auth redirect ---- */

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  /* ---- Hydrate from profile ---- */

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? null);

      if (profile.avatar_url) {
        const parsed = parseAvatarUrl(profile.avatar_url);
        if (parsed) {
          setConfig(parsed);
          setMode("build");
        } else if (
          !profile.avatar_url.startsWith("emoji:") &&
          !profile.avatar_url.startsWith("initials:")
        ) {
          // It's an uploaded image URL
          setMode("upload");
        } else {
          setConfig(DEFAULT_CONFIG);
          setMode("build");
        }
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } else if (user) {
      const name = user.user_metadata?.display_name ?? user.email ?? "";
      setDisplayName(name);
      setConfig(DEFAULT_CONFIG);
    }
  }, [user, profile]);

  /* ---- Derived URLs ---- */

  const currentBuildUrl = buildAvatarUrl(config);
  const previewUrl = mode === "build" ? currentBuildUrl : avatarUrl;

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
      setMode("upload");
      setMessage({
        type: "success",
        text: "Photo uploaded! Click Save to apply.",
      });
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

  /* ---- Save ---- */

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    const finalAvatarUrl = mode === "build" ? currentBuildUrl : avatarUrl;

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
      setAvatarUrl(finalAvatarUrl ?? null);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }

    setSaving(false);
  };

  /* ---- Loading ---- */

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-felt-700 border-t-felt-400" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center px-4 pt-20 pb-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Your Poker Identity
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Customize how you appear at the table
          </p>
        </div>

        {/* Preview Section */}
        <div className="card-surface">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-10">
            {/* Left: Large avatar preview */}
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Your Avatar
              </h2>
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-felt-400/20 blur-xl" />
                <div className="relative overflow-hidden rounded-full border-[3px] border-felt-400/50 shadow-xl">
                  <div
                    className="rounded-full overflow-hidden bg-gradient-to-br from-felt-500 to-felt-700"
                    style={{ width: "120px", height: "120px" }}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                        {displayName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-chip-gold">
                {displayName || "Your Name"}
              </div>
            </div>

            {/* Right: Table Preview */}
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Table Preview
              </h2>
              <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-felt-900/40 to-black/30 px-10 py-5">
                {/* Glow ring */}
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full bg-felt-400/20 blur-md" />
                  <div className="relative overflow-hidden rounded-full border-[2.5px] border-felt-400/60 shadow-lg">
                    <AvatarDisplay
                      avatarUrl={previewUrl}
                      displayName={displayName}
                      size="lg"
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
        </div>

        {/* Mode Tabs */}
        <div className="card-surface">
          <div className="mb-5 flex gap-1 rounded-full bg-black/30 p-1">
            <button
              onClick={() => setMode("build")}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                mode === "build"
                  ? "bg-felt-700/60 text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.03]"
              }`}
            >
              Build Avatar
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                mode === "upload"
                  ? "bg-felt-700/60 text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.03]"
              }`}
            >
              Upload Photo
            </button>
          </div>

          {/* Build Avatar Mode */}
          {mode === "build" && (
            <AvatarBuilder config={config} onConfigChange={setConfig} />
          )}

          {/* Upload Photo Mode */}
          {mode === "upload" && (
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
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Uploading...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-felt-800/40">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-felt-400"
                      >
                        <path
                          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="17 8 12 3 7 8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="12"
                          y1="3"
                          x2="12"
                          y2="15"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
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
              {avatarUrl &&
                !avatarUrl.startsWith("emoji:") &&
                !avatarUrl.startsWith("initials:") &&
                !avatarUrl.includes("api.dicebear.com") && (
                  <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3">
                    <img
                      src={avatarUrl}
                      alt="Current"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Current uploaded photo
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="card-surface">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Display Name
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
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
