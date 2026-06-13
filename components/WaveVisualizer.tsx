"use client";

import { Mode } from "@/hooks/useAudioEngine";

interface WaveVisualizerProps {
  isPlaying: boolean;
  mode: Mode;
}

const MODE_COLORS: Record<Mode, { primary: string; secondary: string }> = {
  focus:      { primary: "#378ADD", secondary: "#5BA3F5" },
  meditation: { primary: "#5BA3F5", secondary: "#A8D4FF" },
  sleep:      { primary: "#A8D4FF", secondary: "#7fb3e8" },
  silence:    { primary: "#7fb3e8", secondary: "#378ADD" },
};

const BAR_COUNT = 32;

export default function WaveVisualizer({ isPlaying, mode }: WaveVisualizerProps) {
  const colors = MODE_COLORS[mode];

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const delay = (i / BAR_COUNT) * 1.6;
    const height = 20 + Math.sin((i / BAR_COUNT) * Math.PI * 2) * 60 + Math.random() * 20;
    return { delay, height };
  });

  return (
    <div className="relative flex items-center justify-center w-full" style={{ height: 120 }}>
      {/* Glow background */}
      <div
        className="absolute inset-0 rounded-3xl transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary}15 0%, transparent 70%)`,
          opacity: isPlaying ? 1 : 0,
        }}
      />

      {/* Bars */}
      <div className="relative flex items-center gap-[3px]" style={{ height: 100 }}>
        {bars.map((bar, i) => (
          <div
            key={i}
            className="rounded-full transition-colors duration-700"
            style={{
              width: 3,
              height: `${bar.height}%`,
              background: i % 2 === 0 ? colors.primary : colors.secondary,
              opacity: isPlaying ? 0.85 : 0.2,
              transformOrigin: "center",
              animation: isPlaying
                ? `wave-bar ${0.8 + (i % 5) * 0.15}s ease-in-out ${bar.delay}s infinite`
                : "none",
              transform: isPlaying ? undefined : "scaleY(0.15)",
            }}
          />
        ))}
      </div>

      {/* Center ring */}
      <div
        className="absolute rounded-full border transition-all duration-700"
        style={{
          width: 80,
          height: 80,
          borderColor: colors.primary,
          borderWidth: 1,
          opacity: isPlaying ? 0.3 : 0.05,
          animation: isPlaying ? "wave-pulse 2s ease-in-out infinite" : "none",
        }}
      />
      <div
        className="absolute rounded-full border transition-all duration-700"
        style={{
          width: 56,
          height: 56,
          borderColor: colors.secondary,
          borderWidth: 1,
          opacity: isPlaying ? 0.4 : 0.05,
          animation: isPlaying ? "wave-pulse 2s ease-in-out 0.4s infinite" : "none",
        }}
      />
    </div>
  );
}
