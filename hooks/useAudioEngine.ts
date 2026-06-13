"use client";

import { useRef, useState, useCallback } from "react";

export type Mode = "focus" | "meditation" | "sleep" | "silence";
export type Intensity = "light" | "medium" | "deep";

interface ModeConfig {
  beatFreq: number;
  carrierFreq: number;
  noiseGain: number;
  label: string;
  description: string;
}

const MODE_CONFIGS: Record<Mode, ModeConfig> = {
  focus: {
    beatFreq: 16,
    carrierFreq: 200,
    noiseGain: 0.04,
    label: "Фокус",
    description: "Бета-волны 14–18 Гц",
  },
  meditation: {
    beatFreq: 10,
    carrierFreq: 180,
    noiseGain: 0.03,
    label: "Медитация",
    description: "Альфа-волны 8–12 Гц",
  },
  sleep: {
    beatFreq: 2,
    carrierFreq: 150,
    noiseGain: 0.06,
    label: "Сон",
    description: "Дельта-волны 1–4 Гц",
  },
  silence: {
    beatFreq: 6,
    carrierFreq: 160,
    noiseGain: 0.01,
    label: "Тишина",
    description: "Тета-волны 4–8 Гц",
  },
};

const INTENSITY_GAIN: Record<Intensity, number> = {
  light: 0.3,
  medium: 0.6,
  deep: 1.0,
};

const FADE_DURATION = 3;

function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

export function useAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setModeState] = useState<Mode>("focus");
  const [intensity, setIntensityState] = useState<Intensity>("medium");
  const [volume, setVolumeState] = useState(0.8);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDurationState] = useState(25);
  const startTimeRef = useRef<number>(0);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const stopNodes = useCallback(() => {
    const now = ctxRef.current?.currentTime ?? 0;
    const gain = masterGainRef.current;
    if (gain) {
      gain.gain.setTargetAtTime(0, now, FADE_DURATION / 3);
    }
    setTimeout(() => {
      leftOscRef.current?.stop();
      rightOscRef.current?.stop();
      noiseSourceRef.current?.stop();
      leftOscRef.current = null;
      rightOscRef.current = null;
      noiseSourceRef.current = null;
    }, FADE_DURATION * 1000);
  }, []);

  const start = useCallback((targetMode?: Mode, targetIntensity?: Intensity, targetDuration?: number) => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    const activeMode = targetMode ?? mode;
    const activeIntensity = targetIntensity ?? intensity;
    const activeDuration = targetDuration ?? duration;
    const config = MODE_CONFIGS[activeMode];
    const intensityGain = INTENSITY_GAIN[activeIntensity];

    stopNodes();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume * intensityGain, ctx.currentTime + FADE_DURATION);
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Left channel — carrier
    const merger = ctx.createChannelMerger(2);
    merger.connect(masterGain);

    const leftOsc = ctx.createOscillator();
    leftOsc.frequency.value = config.carrierFreq;
    leftOsc.type = "sine";
    const leftGain = ctx.createGain();
    leftGain.gain.value = 0.5;
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    leftOsc.start();
    leftOscRef.current = leftOsc;

    // Right channel — carrier + beat
    const rightOsc = ctx.createOscillator();
    rightOsc.frequency.value = config.carrierFreq + config.beatFreq;
    rightOsc.type = "sine";
    const rightGain = ctx.createGain();
    rightGain.gain.value = 0.5;
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    rightOsc.start();
    rightOscRef.current = rightOsc;

    // Pink noise
    const noiseBuffer = createPinkNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = config.noiseGain;
    noiseSource.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();
    noiseSourceRef.current = noiseSource;
    noiseGainRef.current = noiseGain;

    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsPlaying(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= activeDuration * 60) {
        stop();
      }
    }, 1000);
  }, [mode, intensity, duration, volume, getCtx, stopNodes]);

  const pause = useCallback(() => {
    ctxRef.current?.suspend();
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resume = useCallback(() => {
    ctxRef.current?.resume();
    setIsPlaying(true);
    startTimeRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= duration * 60) stop();
    }, 1000);
  }, [elapsed, duration]);

  const stop = useCallback(() => {
    stopNodes();
    setIsPlaying(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopNodes]);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    if (isPlaying) {
      stop();
    }
  }, [isPlaying, stop]);

  const setIntensity = useCallback((i: Intensity) => {
    setIntensityState(i);
    if (masterGainRef.current && ctxRef.current) {
      const config = MODE_CONFIGS[mode];
      masterGainRef.current.gain.setTargetAtTime(
        volume * INTENSITY_GAIN[i],
        ctxRef.current.currentTime,
        0.3
      );
      if (noiseGainRef.current) {
        noiseGainRef.current.gain.setTargetAtTime(config.noiseGain, ctxRef.current.currentTime, 0.3);
      }
    }
  }, [mode, volume]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        v * INTENSITY_GAIN[intensity],
        ctxRef.current.currentTime,
        0.1
      );
    }
  }, [intensity]);

  const setDuration = useCallback((d: number) => {
    setDurationState(d);
  }, []);

  const remaining = duration * 60 - elapsed;

  return {
    isPlaying,
    mode,
    intensity,
    volume,
    duration,
    elapsed,
    remaining,
    modeConfig: MODE_CONFIGS[mode],
    modeConfigs: MODE_CONFIGS,
    start,
    pause,
    resume,
    stop,
    setMode,
    setIntensity,
    setVolume,
    setDuration,
  };
}
