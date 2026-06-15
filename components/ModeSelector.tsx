"use client";

import { Mode } from "@/hooks/useAudioEngine";
import WavePattern from "./WavePattern";

const MODES: Array<{ id: Mode; label: string; sub: string; desc: string; icon: string; color: string }> = [
  { id: "focus",      label: "Фокус",     sub: "Бета · 16 Гц",  desc: "Ясность мышления и рабочий поток",       icon: "◈", color: "#FF6B35" },
  { id: "meditation", label: "Медитация", sub: "Альфа · 10 Гц", desc: "Спокойствие без сонливости",             icon: "◎", color: "#4FC3F7" },
  { id: "sleep",      label: "Сон",       sub: "Дельта · 2 Гц", desc: "Глубокое восстановление организма",      icon: "◑", color: "#CE93D8" },
  { id: "silence",    label: "Тишина",    sub: "Тета · 6 Гц",   desc: "Творчество, интуиция, подсознание",      icon: "◌", color: "#26C6DA" },
  { id: "gamma",      label: "Гамма",     sub: "Гамма · 40 Гц", desc: "Пиковая осознанность и поток",           icon: "✦", color: "#80DEEA" },
];

interface Props {
  mode: Mode;
  onSelect: (m: Mode) => void;
  disabled?: boolean;
}

export default function ModeSelector({ mode, onSelect, disabled }: Props) {
  const firstFour = MODES.slice(0, 4);
  const last = MODES[4];

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {firstFour.map((m) => (
          <ModeCard key={m.id} m={m} active={m.id === mode} onSelect={onSelect} disabled={disabled} />
        ))}
      </div>
      <ModeCard m={last} active={last.id === mode} onSelect={onSelect} disabled={disabled} wide />
    </div>
  );
}

function ModeCard({
  m,
  active,
  onSelect,
  disabled,
  wide,
}: {
  m: (typeof MODES)[0];
  active: boolean;
  onSelect: (m: Mode) => void;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(m.id)}
      disabled={disabled}
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 text-left ${wide ? "h-32" : "h-44"}`}
      style={{
        border: active ? `2px solid ${m.color}` : "2px solid rgba(255,255,255,0.06)",
        boxShadow: active ? `0 0 24px ${m.color}44, 0 0 48px ${m.color}18` : "none",
      }}
    >
      {/* SVG wave background */}
      <WavePattern mode={m.id} className="absolute inset-0 w-full h-full" />

      {/* Bottom gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }}
      />

      {/* Icon top-left */}
      <span className="absolute top-3 left-3 text-base" style={{ color: "rgba(255,255,255,0.65)" }}>
        {m.icon}
      </span>

      {/* Active dot */}
      {active && (
        <span
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}` }}
        />
      )}

      {/* Text bottom-left */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="text-white font-semibold text-sm leading-tight">{m.label}</div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{m.sub}</div>
        <div className="text-xs mt-1.5 leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>{m.desc}</div>
      </div>
    </button>
  );
}
