"use client";

import { useState, useEffect } from "react";
import { useAudioEngine, Intensity } from "@/hooks/useAudioEngine";
import { useSoundscape, SOUNDSCAPES } from "@/hooks/useSoundscape";
import ModeSelector from "./ModeSelector";
import WaveVisualizer from "./WaveVisualizer";

const DURATIONS = [5, 10, 15, 20, 30];

const INTENSITIES: { id: Intensity; label: string }[] = [
  { id: "light", label: "Лёгкая" },
  { id: "medium", label: "Средняя" },
  { id: "deep", label: "Глубокая" },
];

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Player() {
  const audio = useAudioEngine();
  const soundscape = useSoundscape();
  const [showHeadphonesHint, setShowHeadphonesHint] = useState(false);

  useEffect(() => {
    audio.setAmbientActive(soundscape.active !== "none");
  }, [soundscape.active]);

  const handlePlay = () => {
    if (audio.isPlaying) {
      audio.pause();
    } else if (audio.isPaused) {
      audio.resume();
    } else {
      setShowHeadphonesHint(true);
      setTimeout(() => setShowHeadphonesHint(false), 4000);
      audio.start();
    }
  };

  const progressPercent = audio.duration > 0
    ? (audio.elapsed / (audio.duration * 60)) * 100
    : 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <img
          src="/wiwa-logo.svg"
          alt="WiWa"
          className="w-32"
          style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
        />
        <p className="text-sm tracking-widest" style={{ color: "#7fb3e8" }}>
          Wisdom Waves
        </p>
        <p className="text-xs tracking-wider" style={{ color: "#3d6b9e" }}>
          нейромузыка для твоего мозга
        </p>
      </div>

      {/* Mode Selector */}
      <ModeSelector
        mode={audio.mode}
        onSelect={audio.setMode}
        disabled={audio.isPlaying}
      />

      {/* Visualizer */}
      <div
        className="w-full rounded-3xl p-4"
        style={{ backgroundColor: "#0a1628", border: "1px solid #1a3a6b" }}
      >
        <WaveVisualizer isPlaying={audio.isPlaying} mode={audio.mode} analyserNode={audio.analyserNode} />

        {/* Timer */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs font-mono" style={{ color: "#3d6b9e" }}>
            {formatTime(audio.elapsed)}
          </span>
          <span
            className="text-2xl font-mono font-bold tracking-widest"
            style={{ color: "#e8f4ff" }}
          >
            {formatTime(audio.remaining > 0 ? audio.remaining : 0)}
          </span>
          <span className="text-xs font-mono" style={{ color: "#3d6b9e" }}>
            {audio.duration}мин
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#1a3a6b" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #378ADD, #A8D4FF)",
            }}
          />
        </div>
      </div>

      {/* Headphones hint */}
      {showHeadphonesHint && (
        <div
          className="w-full rounded-2xl px-4 py-3 text-sm text-center animate-fade-in"
          style={{ backgroundColor: "#0d1f3c", border: "1px solid #378ADD33", color: "#7fb3e8" }}
        >
          🎧 Используйте наушники для бинауральных биений
        </div>
      )}

      {/* Duration selector */}
      <div className="w-full">
        <p className="text-xs mb-2 tracking-wider uppercase" style={{ color: "#3d6b9e" }}>
          Длительность
        </p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => audio.setDuration(d)}
              disabled={audio.isPlaying}
              className="flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-200 disabled:opacity-40"
              style={{
                backgroundColor: audio.duration === d ? "#378ADD22" : "#0d1f3c",
                border: `1px solid ${audio.duration === d ? "#378ADD" : "#1a3a6b"}`,
                color: audio.duration === d ? "#5BA3F5" : "#3d6b9e",
              }}
            >
              {d}м
            </button>
          ))}
        </div>
      </div>

      {/* Intensity selector */}
      <div className="w-full">
        <p className="text-xs mb-2 tracking-wider uppercase" style={{ color: "#3d6b9e" }}>
          Интенсивность
        </p>
        <div className="flex gap-2">
          {INTENSITIES.map((i) => (
            <button
              key={i.id}
              onClick={() => audio.setIntensity(i.id)}
              className="flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: audio.intensity === i.id ? "#378ADD22" : "#0d1f3c",
                border: `1px solid ${audio.intensity === i.id ? "#378ADD" : "#1a3a6b"}`,
                color: audio.intensity === i.id ? "#5BA3F5" : "#3d6b9e",
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs tracking-wider uppercase" style={{ color: "#3d6b9e" }}>
            Громкость
          </p>
          <span className="text-xs font-mono" style={{ color: "#3d6b9e" }}>
            {Math.round(audio.volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={audio.volume}
          onChange={(e) => audio.setVolume(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(90deg, #378ADD ${audio.volume * 100}%, #1a3a6b ${audio.volume * 100}%)`,
          }}
        />
      </div>

      {/* Soundscape */}
      <div className="w-full">
        <p className="text-xs mb-2 tracking-wider uppercase" style={{ color: "#3d6b9e" }}>
          Атмосфера
        </p>
        <div className="grid grid-cols-4 gap-2">
          {SOUNDSCAPES.map((s) => {
            const isActive = soundscape.active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => soundscape.setActive(isActive ? "none" : s.id)}
                className="flex flex-col items-center gap-1 rounded-2xl py-3 transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: isActive ? "#378ADD22" : "#0d1f3c",
                  border: `1px solid ${isActive ? "#378ADD" : "#1a3a6b"}`,
                }}
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs" style={{ color: isActive ? "#5BA3F5" : "#3d6b9e" }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
        {soundscape.active !== "none" && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs tracking-wider uppercase" style={{ color: "#3d6b9e" }}>
                Громкость атмосферы
              </span>
              <span className="text-xs font-mono" style={{ color: "#3d6b9e" }}>
                {Math.round(soundscape.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={soundscape.volume}
              onChange={(e) => soundscape.setVolume(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #378ADD ${soundscape.volume * 100}%, #1a3a6b ${soundscape.volume * 100}%)`,
              }}
            />
          </div>
        )}
      </div>

      {/* Play / Stop */}
      <div className="flex items-center justify-center mt-2">
        <button
          onClick={handlePlay}
          className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #378ADD, #5BA3F5)",
            boxShadow: audio.isPlaying
              ? "0 0 30px #378ADD55, 0 0 60px #378ADD22"
              : "0 4px 20px #378ADD44",
          }}
        >
          {audio.isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="white">
              <rect x="3" y="2" width="5" height="18" rx="1.5" />
              <rect x="14" y="2" width="5" height="18" rx="1.5" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="white" style={{ marginLeft: 3 }}>
              <path d="M4 2l16 9-16 9V2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Mode description card */}
      <div
        className="w-full rounded-2xl px-4 py-4 transition-all duration-500"
        style={{ backgroundColor: "#0d1f3c", border: "1px solid #1a3a6b" }}
      >
        <p className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: "#378ADD" }}>
          {audio.modeConfig.feeling}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#7fb3e8" }}>
          {audio.modeConfig.effect}
        </p>
      </div>
    </div>
  );
}
