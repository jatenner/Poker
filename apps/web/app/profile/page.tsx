"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/supabase/client";

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    } else if (user) {
      setDisplayName(
        user.user_metadata?.display_name ?? user.email ?? ""
      );
    }
  }, [user, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    const supabase = createBrowserClient();
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName.trim(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully." });
    }

    setSaving(false);
  };

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

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      });

      if (updateError) {
        setMessage({ type: "error", text: updateError.message });
      } else {
        setAvatarUrl(publicUrl + "?t=" + Date.now());
        setMessage({ type: "success", text: "Avatar updated." });
      }

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

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-20">
      <div className="w-full max-w-lg card-surface">
        <h1 className="mb-8 text-center text-2xl font-bold text-[var(--color-text-primary)]">
          Your Profile
        </h1>

        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 transition ${
              dragOver
                ? "border-felt-400 bg-felt-900/30"
                : "border-white/10 hover:border-felt-600"
            }`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-felt-900/20 text-3xl font-bold text-felt-300">
                {displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-felt-400 border-t-transparent" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-xs text-[var(--color-text-secondary)]">
            Click or drag an image to upload
          </p>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
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
          </div>

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

          {message && (
            <p
              className={`rounded-lg px-4 py-2 text-sm ${
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
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
