"use client";

import { Mode } from "@/hooks/useAudioEngine";

interface Props {
  isPlaying: boolean;
  mode: Mode;
}

// Generates a sine wave path across 1200 SVG units (6 full periods × 200px each)
function wavePath(amplitude: number, cy = 60, invert = false): string {
  const period = 200;
  const hi = cy - amplitude;
  const lo = cy + amplitude;
  const [cp1y, cp2y] = invert ? [lo, hi] : [hi, lo];
  let d = `M0,${cy}`;
  for (let i = 0; i < 6; i++) {
    const x = i * period;
    d += ` C${x + 50},${cp1y} ${x + 150},${cp2y} ${x + period},${cy}`;
  }
  return d;
}

type Layer = { path: string; color: string; opacity: number; width: number; speed: number };

const MODE_LAYERS: Record<Mode, Layer[]> = {
  focus: [
    { path: wavePath(28),           color: "#FF6B35", opacity: 0.85, width: 2,   speed: 3   },
    { path: wavePath(18, 60, true), color: "#E91E8C", opacity: 0.5,  width: 1.5, speed: 5   },
    { path: wavePath(10, 62),       color: "#FFB300", opacity: 0.28, width: 1,   speed: 7.5 },
  ],
  meditation: [
    { path: wavePath(22),           color: "#4FC3F7", opacity: 0.8,  width: 2,   speed: 5   },
    { path: wavePath(14, 60, true), color: "#00BCD4", opacity: 0.45, width: 1.5, speed: 7.5 },
    { path: wavePath(8,  62),       color: "#90CAF9", opacity: 0.28, width: 1,   speed: 11  },
  ],
  sleep: [
    { path: wavePath(15),           color: "#CE93D8", opacity: 0.75, width: 2,   speed: 9   },
    { path: wavePath(10, 60, true), color: "#F48FB1", opacity: 0.4,  width: 1.5, speed: 13  },
    { path: wavePath(6,  62),       color: "#7C4DFF", opacity: 0.22, width: 1,   speed: 18  },
  ],
  silence: [
    { path: wavePath(20),           color: "#26C6DA", opacity: 0.72, width: 1.8, speed: 7   },
    { path: wavePath(12, 60, true), color: "#00E5FF", opacity: 0.35, width: 1.2, speed: 11  },
    { path: wavePath(7,  63),       color: "#4CAF50", opacity: 0.2,  width: 0.8, speed: 15  },
  ],
  gamma: [
    { path: wavePath(16),           color: "#E0F7FA", opacity: 0.88, width: 1.5, speed: 1.6 },
    { path: wavePath(11, 60, true), color: "#00BFA5", opacity: 0.55, width: 1.2, speed: 2.4 },
    { path: wavePath(7,  62),       color: "#448AFF", opacity: 0.35, width: 1,   speed: 3.6 },
    { path: wavePath(4,  58),       color: "#80DEEA", opacity: 0.22, width: 0.7, speed: 5.5 },
  ],
};

export default function WaveVisualizer({ isPlaying, mode }: Props) {
  const layers = MODE_LAYERS[mode];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: 100 }}>
      {/* Glow */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, ${layers[0].color}22 0%, transparent 70%)`,
          opacity: isPlaying ? 1 : 0.35,
        }}
      />

      {/* Wave layers — each div is 200% wide so translateX(-50%) = one seamless loop */}
      {layers.map((layer, i) => (
        <div
          key={i}
          className={`absolute top-0 bottom-0 left-0 ${isPlaying ? "wave-animate" : ""}`}
          style={{
            width: "200%",
            opacity: isPlaying ? layer.opacity : layer.opacity * 0.18,
            transition: "opacity 0.8s ease",
            "--wave-speed": `${layer.speed}s`,
          } as React.CSSProperties}
        >
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%" }}
          >
            <path
              d={layer.path}
              fill="none"
              stroke={layer.color}
              strokeWidth={layer.width}
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
