"use client";

import { useEffect, useRef } from "react";
import { Mode } from "@/hooks/useAudioEngine";

interface Props {
  isPlaying: boolean;
  mode: Mode;
  analyserNode: React.MutableRefObject<AnalyserNode | null>;
}

const MODE_COLORS: Record<Mode, [string, string, string]> = {
  focus:      ["#FF6B35", "#E91E8C", "#FFB300"],
  meditation: ["#4FC3F7", "#00BCD4", "#90CAF9"],
  sleep:      ["#CE93D8", "#F48FB1", "#7C4DFF"],
  silence:    ["#26C6DA", "#00E5FF", "#4CAF50"],
  gamma:      ["#E0F7FA", "#00BFA5", "#448AFF"],
};

export default function WaveVisualizer({ isPlaying, mode, analyserNode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const colors = MODE_COLORS[mode];

    const draw = () => {
      const W = canvas.offsetWidth || 400;
      const H = canvas.offsetHeight || 100;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      const analyser = analyserNode.current;

      if (isPlaying && analyser) {
        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyser.getByteTimeDomainData(data);

        const yOffsets = [0, -12, 12];
        const alphas   = [0.9, 0.45, 0.2];
        const lineWidths = [2, 1.5, 1];
        const glows    = [14, 8, 4];

        colors.forEach((color, i) => {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.globalAlpha = alphas[i];
          ctx.lineWidth   = lineWidths[i];
          ctx.shadowColor = color;
          ctx.shadowBlur  = glows[i];

          for (let j = 0; j < bufLen; j++) {
            const x = (j / (bufLen - 1)) * W;
            const v = (data[j] / 128.0) - 1.0;
            const y = H / 2 + v * H * 0.38 + yOffsets[i];
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
      } else {
        // Gentle idle animation when not playing
        const t = Date.now() / 1000;
        colors.forEach((color, i) => {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.14 - i * 0.04;
          ctx.lineWidth   = 1.5 - i * 0.3;
          ctx.shadowBlur  = 0;

          const freq  = 2 + i * 0.5;
          const speed = 0.25 + i * 0.08;
          const amp   = 8 - i * 2;
          const yOff  = (i - 1) * 12;

          for (let x = 0; x <= W; x++) {
            const y = H / 2 + Math.sin((x / W) * Math.PI * 2 * freq + t * speed) * amp + yOff;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, mode, analyserNode]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: 100 }}>
      {/* Glow background */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, ${MODE_COLORS[mode][0]}22 0%, transparent 70%)`,
          opacity: isPlaying ? 1 : 0.35,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
