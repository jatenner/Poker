"use client";

import { useState, useCallback } from "react";
import {
  type AvatarConfig,
  AVATAR_OPTIONS,
  PRESETS,
  VIBE_COMBOS,
  buildAvatarUrl,
  randomizeConfig,
  randomizeSection,
} from "@/lib/avatarConfig";

interface AvatarBuilderProps {
  config: AvatarConfig;
  onConfigChange: (config: AvatarConfig) => void;
}

type TabId = "face" | "hair" | "outfit" | "extras" | "vibe";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "face", label: "Face", emoji: "\u{1F3AD}" },
  { id: "hair", label: "Hair", emoji: "\u{1F487}" },
  { id: "outfit", label: "Outfit", emoji: "\u{1F454}" },
  { id: "extras", label: "Extras", emoji: "\u{1F3A9}" },
  { id: "vibe", label: "Vibe", emoji: "\u{1F60E}" },
];

const TAB_SECTION_MAP: Record<TabId, string> = {
  face: "face",
  hair: "hair",
  outfit: "outfit",
  extras: "extras",
  vibe: "vibe",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
      {children}
    </h4>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 truncate ${
        selected
          ? "bg-felt-600 text-white border-felt-400 shadow-sm"
          : "bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white/80"
      }`}
    >
      {label}
    </button>
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const displayColor = color.startsWith("#") ? color : `#${color}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 transition-all duration-150 flex-shrink-0 ${
        selected
          ? "border-felt-400 ring-2 ring-felt-400/50 scale-110"
          : "border-white/10 hover:border-white/30"
      }`}
      style={{ backgroundColor: displayColor }}
      title={color}
    />
  );
}

function OptionGrid({
  options,
  selectedValue,
  onChange,
}: {
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      {options.map((opt) => (
        <OptionButton
          key={opt.value}
          label={opt.label}
          selected={selectedValue === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}

function ColorRow({
  options,
  selectedValue,
  onChange,
}: {
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <ColorSwatch
          key={opt.value}
          color={opt.value}
          selected={selectedValue === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AvatarBuilder({
  config,
  onConfigChange,
}: AvatarBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabId>("face");
  const [diceAnimating, setDiceAnimating] = useState(false);

  const updateField = useCallback(
    (field: keyof AvatarConfig, value: string) => {
      onConfigChange({ ...config, [field]: value });
    },
    [config, onConfigChange],
  );

  const handleGlobalRandomize = useCallback(() => {
    setDiceAnimating(true);
    onConfigChange(randomizeConfig());
    setTimeout(() => setDiceAnimating(false), 400);
  }, [onConfigChange]);

  const handleSectionRandomize = useCallback(
    (section: string) => {
      onConfigChange(randomizeSection(config, section));
    },
    [config, onConfigChange],
  );

  const handlePresetClick = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      onConfigChange(preset.config);
    },
    [onConfigChange],
  );

  const handleVibeClick = useCallback(
    (combo: (typeof VIBE_COMBOS)[number]) => {
      onConfigChange({
        ...config,
        eyes: combo.eyes,
        eyebrows: combo.eyebrows,
        mouth: combo.mouth,
      });
    },
    [config, onConfigChange],
  );

  const isVibeActive = (combo: (typeof VIBE_COMBOS)[number]) =>
    config.eyes === combo.eyes &&
    config.eyebrows === combo.eyebrows &&
    config.mouth === combo.mouth;

  const isPresetActive = (preset: (typeof PRESETS)[number]) => {
    const pc = preset.config;
    return (Object.keys(pc) as (keyof AvatarConfig)[]).every(
      (k) => config[k] === pc[k],
    );
  };

  // ─── Tab content renderers ──────────────────────────────────────────────

  function renderFaceTab() {
    return (
      <div className="space-y-4">
        <div>
          <SectionLabel>Skin Tone</SectionLabel>
          <ColorRow
            options={AVATAR_OPTIONS.skinColor}
            selectedValue={config.skinColor}
            onChange={(v) => updateField("skinColor", v)}
          />
        </div>
        <div>
          <SectionLabel>Eyes</SectionLabel>
          <OptionGrid
            options={AVATAR_OPTIONS.eyes}
            selectedValue={config.eyes}
            onChange={(v) => updateField("eyes", v)}
          />
        </div>
        <div>
          <SectionLabel>Eyebrows</SectionLabel>
          <OptionGrid
            options={AVATAR_OPTIONS.eyebrows}
            selectedValue={config.eyebrows}
            onChange={(v) => updateField("eyebrows", v)}
          />
        </div>
        <div>
          <SectionLabel>Mouth</SectionLabel>
          <OptionGrid
            options={AVATAR_OPTIONS.mouth}
            selectedValue={config.mouth}
            onChange={(v) => updateField("mouth", v)}
          />
        </div>
      </div>
    );
  }

  function renderHairTab() {
    return (
      <div className="space-y-4">
        <div>
          <SectionLabel>Style</SectionLabel>
          <OptionGrid
            options={AVATAR_OPTIONS.top}
            selectedValue={config.top}
            onChange={(v) => updateField("top", v)}
          />
        </div>
        <div>
          <SectionLabel>Color</SectionLabel>
          <ColorRow
            options={AVATAR_OPTIONS.hairColor}
            selectedValue={config.hairColor}
            onChange={(v) => updateField("hairColor", v)}
          />
        </div>
      </div>
    );
  }

  function renderOutfitTab() {
    return (
      <div className="space-y-4">
        <div>
          <SectionLabel>Clothing</SectionLabel>
          <OptionGrid
            options={AVATAR_OPTIONS.clothing}
            selectedValue={config.clothing}
            onChange={(v) => updateField("clothing", v)}
          />
        </div>
        <div>
          <SectionLabel>Clothes Color</SectionLabel>
          <ColorRow
            options={AVATAR_OPTIONS.clothesColor}
            selectedValue={config.clothesColor}
            onChange={(v) => updateField("clothesColor", v)}
          />
        </div>
        {config.clothing === "graphicShirt" && (
          <div>
            <SectionLabel>Graphic</SectionLabel>
            <OptionGrid
              options={AVATAR_OPTIONS.clothingGraphic}
              selectedValue={config.clothingGraphic}
              onChange={(v) => updateField("clothingGraphic", v)}
            />
          </div>
        )}
      </div>
    );
  }

  function renderExtrasTab() {
    return (
      <div className="space-y-4">
        <div>
          <SectionLabel>Accessories</SectionLabel>
          <OptionGrid
            options={AVATAR_OPTIONS.accessories}
            selectedValue={config.accessories}
            onChange={(v) => updateField("accessories", v)}
          />
        </div>
        <div>
          <SectionLabel>Facial Hair</SectionLabel>
          <OptionGrid
            options={AVATAR_OPTIONS.facialHair}
            selectedValue={config.facialHair}
            onChange={(v) => updateField("facialHair", v)}
          />
        </div>
        {config.facialHair && config.facialHair !== "" && (
          <div>
            <SectionLabel>Facial Hair Color</SectionLabel>
            <ColorRow
              options={AVATAR_OPTIONS.facialHairColor}
              selectedValue={config.facialHairColor ?? config.hairColor}
              onChange={(v) => updateField("facialHairColor", v)}
            />
          </div>
        )}
      </div>
    );
  }

  function renderVibeTab() {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {VIBE_COMBOS.map((combo) => {
          const active = isVibeActive(combo);
          return (
            <button
              key={combo.name}
              type="button"
              onClick={() => handleVibeClick(combo)}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all duration-150 text-left ${
                active
                  ? "bg-felt-600/60 border-felt-400 text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
              }`}
            >
              <span className="text-sm font-semibold">{combo.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const TAB_RENDERERS: Record<TabId, () => React.ReactNode> = {
    face: renderFaceTab,
    hair: renderHairTab,
    outfit: renderOutfitTab,
    extras: renderExtrasTab,
    vibe: renderVibeTab,
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* ── Presets Row ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex gap-2 pb-1">
          {PRESETS.slice(0, 8).map((preset) => {
            const active = isPresetActive(preset);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border flex-shrink-0 transition-all duration-150 min-w-[72px] ${
                  active
                    ? "bg-felt-700/60 border-felt-400"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <img
                  src={buildAvatarUrl(preset.config)}
                  alt={preset.name}
                  className="w-10 h-10 rounded-full"
                  width={40}
                  height={40}
                />
                <span className="text-[10px] font-medium text-white/70 truncate max-w-[64px]">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Global Randomize ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleGlobalRandomize}
        className={`self-center px-5 py-2 rounded-xl bg-felt-600 hover:bg-felt-500 text-white font-semibold text-sm border border-felt-400/50 shadow-md transition-all duration-200 ${
          diceAnimating ? "scale-125" : "scale-100"
        }`}
      >
        <span className="mr-1.5">{"\u{1F3B2}"}</span>
        Randomize Everything
      </button>

      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "bg-felt-600 text-white border-felt-400"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/70"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSectionRandomize(TAB_SECTION_MAP[tab.id]);
                }}
                className="ml-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                title={`Randomize ${tab.label}`}
              >
                {"\u{1F3B2}"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────── */}
      <div className="min-h-[200px]">{TAB_RENDERERS[activeTab]()}</div>
    </div>
  );
}
