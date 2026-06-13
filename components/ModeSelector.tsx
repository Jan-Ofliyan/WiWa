"use client";

import { Mode } from "@/hooks/useAudioEngine";

interface ModeSelectorProps {
  mode: Mode;
  onSelect: (mode: Mode) => void;
  disabled?: boolean;
}

const MODES: { id: Mode; label: string; description: string; icon: string; color: string }[] = [
  {
    id: "focus",
    label: "Фокус",
    description: "Бета-волны · 14–18 Гц",
    icon: "◈",
    color: "#378ADD",
  },
  {
    id: "meditation",
    label: "Медитация",
    description: "Альфа-волны · 8–12 Гц",
    icon: "◎",
    color: "#5BA3F5",
  },
  {
    id: "sleep",
    label: "Сон",
    description: "Дельта-волны · 1–4 Гц",
    icon: "◑",
    color: "#A8D4FF",
  },
  {
    id: "silence",
    label: "Тишина",
    description: "Тета-волны · 4–8 Гц",
    icon: "◌",
    color: "#7fb3e8",
  },
];

export default function ModeSelector({ mode, onSelect, disabled }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            disabled={disabled}
            style={{
              borderColor: active ? m.color : "transparent",
              backgroundColor: active ? `${m.color}18` : "#0d1f3c",
              boxShadow: active ? `0 0 20px ${m.color}33` : "none",
            }}
            className="relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-300 disabled:opacity-40 active:scale-95"
          >
            <span
              className="text-2xl mb-1 transition-transform duration-300"
              style={{ color: active ? m.color : "#3d6b9e" }}
            >
              {m.icon}
            </span>
            <span
              className="font-semibold text-sm tracking-wide"
              style={{ color: active ? m.color : "#7fb3e8" }}
            >
              {m.label}
            </span>
            <span className="text-xs" style={{ color: "#3d6b9e" }}>
              {m.description}
            </span>
            {active && (
              <span
                className="absolute top-3 right-3 w-2 h-2 rounded-full"
                style={{ backgroundColor: m.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
