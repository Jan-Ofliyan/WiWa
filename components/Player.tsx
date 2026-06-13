"use client";

import { useState } from "react";
import { useAudioEngine, Intensity } from "@/hooks/useAudioEngine";
import ModeSelector from "./ModeSelector";
import WaveVisualizer from "./WaveVisualizer";

const DURATIONS = [15, 25, 45, 60];

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
  const [showHeadphonesHint, setShowHeadphonesHint] = useState(false);

  const handlePlay = () => {
    if (!audio.isPlaying) {
      setShowHeadphonesHint(true);
      setTimeout(() => setShowHeadphonesHint(false), 4000);
      audio.start();
    } else {
      audio.pause();
    }
  };

  const handleStop = () => {
    audio.stop();
  };

  const progressPercent = audio.duration > 0
    ? (audio.elapsed / (audio.duration * 60)) * 100
    : 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-widest" style={{ color: "#e8f4ff" }}>
          THE WAVES
        </h1>
        <p className="text-xs mt-1 tracking-wider uppercase" style={{ color: "#3d6b9e" }}>
          нейромузыка
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
        <WaveVisualizer isPlaying={audio.isPlaying} mode={audio.mode} />

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

      {/* Play controls */}
      <div className="flex items-center gap-4 w-full justify-center mt-2">
        {/* Stop */}
        <button
          onClick={handleStop}
          disabled={!audio.isPlaying && audio.elapsed === 0}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30"
          style={{ backgroundColor: "#0d1f3c", border: "1px solid #1a3a6b", color: "#3d6b9e" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect width="14" height="14" rx="2" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={handlePlay}
          className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95"
          style={{
            background: audio.isPlaying
              ? "linear-gradient(135deg, #378ADD, #5BA3F5)"
              : "linear-gradient(135deg, #378ADD, #5BA3F5)",
            boxShadow: audio.isPlaying
              ? "0 0 30px #378ADD55, 0 0 60px #378ADD22"
              : "0 4px 20px #378ADD44",
          }}
        >
          {audio.isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <rect x="3" y="2" width="5" height="16" rx="1.5" />
              <rect x="12" y="2" width="5" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="white" style={{ marginLeft: 3 }}>
              <path d="M4 2l16 9-16 9V2z" />
            </svg>
          )}
        </button>

        {/* Skip +10s */}
        <button
          onClick={() => {/* future: skip */}}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ backgroundColor: "#0d1f3c", border: "1px solid #1a3a6b", color: "#3d6b9e" }}
        >
          <span className="text-xs font-bold">+10</span>
        </button>
      </div>

      {/* Mode description */}
      <p className="text-xs text-center" style={{ color: "#3d6b9e" }}>
        {audio.modeConfig.label} — {audio.modeConfig.description}
      </p>
    </div>
  );
}
