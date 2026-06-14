"use client";

import { Mode } from "@/hooks/useAudioEngine";

interface ModeSelectorProps {
  mode: Mode;
  onSelect: (mode: Mode) => void;
  disabled?: boolean;
}

const MODES: { id: Mode; icon: string; color: string }[] = [
  { id: "focus",      icon: "◈", color: "#378ADD" },
  { id: "meditation", icon: "◎", color: "#5BA3F5" },
  { id: "sleep",      icon: "◑", color: "#A8D4FF" },
  { id: "silence",    icon: "◌", color: "#7fb3e8" },
  { id: "gamma",      icon: "✦", color: "#B8E0FF" },
];

const LABELS: Record<Mode, string> = {
  focus:      "Фокус",
  meditation: "Медитация",
  sleep:      "Сон",
  silence:    "Тишина",
  gamma:      "Гамма",
};

const DESCRIPTIONS: Record<Mode, string> = {
  focus:      "Бета · 14–18 Гц",
  meditation: "Альфа · 8–12 Гц",
  sleep:      "Дельта · 1–4 Гц",
  silence:    "Тета · 4–8 Гц",
  gamma:      "Гамма · 40 Гц",
};

export default function ModeSelector({ mode, onSelect, disabled }: ModeSelectorProps) {
  const firstFour = MODES.slice(0, 4);
  const last = MODES[4];

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-2 gap-3">
        {firstFour.map((m) => (
          <ModeCard key={m.id} m={m} active={m.id === mode} onSelect={onSelect} disabled={disabled} />
        ))}
      </div>
      <div>
        <ModeCard m={last} active={last.id === mode} onSelect={onSelect} disabled={disabled} fullWidth />
      </div>
    </div>
  );
}

function ModeCard({
  m,
  active,
  onSelect,
  disabled,
  fullWidth,
}: {
  m: { id: Mode; icon: string; color: string };
  active: boolean;
  onSelect: (mode: Mode) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(m.id)}
      disabled={disabled}
      style={{
        borderColor: active ? m.color : "transparent",
        backgroundColor: active ? `${m.color}18` : "#0d1f3c",
        boxShadow: active ? `0 0 20px ${m.color}33` : "none",
      }}
      className={`relative flex ${fullWidth ? "flex-row items-center gap-4" : "flex-col items-start"} gap-1 rounded-2xl border p-4 text-left transition-all duration-300 disabled:opacity-40 active:scale-95`}
    >
      <span
        className="text-2xl transition-transform duration-300"
        style={{ color: active ? m.color : "#3d6b9e" }}
      >
        {m.icon}
      </span>
      <div>
        <div
          className="font-semibold text-sm tracking-wide"
          style={{ color: active ? m.color : "#7fb3e8" }}
        >
          {LABELS[m.id]}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#3d6b9e" }}>
          {DESCRIPTIONS[m.id]}
        </div>
      </div>
      {active && (
        <span
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ backgroundColor: m.color }}
        />
      )}
    </button>
  );
}
