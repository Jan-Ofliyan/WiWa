"use client";

import { useRef, useState, useCallback } from "react";

export type Mode = "focus" | "meditation" | "sleep" | "silence" | "gamma";
export type Intensity = "light" | "medium" | "deep";

interface ModeConfig {
  beatFreq: number;
  carrierFreq: number; // solfeggio frequency
  noiseGain: number;
  breathPeriod: number; // seconds per breath cycle
  label: string;
  description: string;
  feeling: string;
  effect: string;
}

// Solfeggio carrier frequencies replace the generic 150-200 Hz
const MODE_CONFIGS: Record<Mode, ModeConfig> = {
  focus: {
    beatFreq: 16,
    carrierFreq: 396,   // Ut — освобождение, ясность
    noiseGain: 0.04,
    breathPeriod: 4,
    label: "Фокус",
    description: "Бета-волны · 16 Гц",
    feeling: "Ясность и концентрация",
    effect: "Мозг входит в рабочий поток. Мысли чёткие, внимание устойчивое, задачи решаются легче.",
  },
  meditation: {
    beatFreq: 10,
    carrierFreq: 528,   // Mi — трансформация, восстановление
    noiseGain: 0.03,
    breathPeriod: 6,
    label: "Медитация",
    description: "Альфа-волны · 10 Гц",
    feeling: "Спокойствие без сонливости",
    effect: "Снятие стресса, лёгкость в теле. Мозг расслаблен, но осознан — идеально для медитации.",
  },
  sleep: {
    beatFreq: 2,
    carrierFreq: 174,   // глубокое расслабление, снятие боли
    noiseGain: 0.06,
    breathPeriod: 8,
    label: "Сон",
    description: "Дельта-волны · 2 Гц",
    feeling: "Глубокое погружение",
    effect: "Физическое восстановление, укрепление иммунитета, очищение мозга от токсинов через глимфатическую систему.",
  },
  silence: {
    beatFreq: 6,
    carrierFreq: 285,   // регенерация, интуиция
    noiseGain: 0.01,
    breathPeriod: 6,
    label: "Тишина",
    description: "Тета-волны · 6 Гц",
    feeling: "Ворота в подсознание",
    effect: "Творчество, озарения, интуиция. Консолидация памяти. Граница между сном и бодрствованием.",
  },
  gamma: {
    beatFreq: 40,
    carrierFreq: 963,   // пиковое сознание, пинеальная активация
    noiseGain: 0.02,
    breathPeriod: 4,
    label: "Гамма",
    description: "Гамма-волны · 40 Гц",
    feeling: "Пиковая осознанность",
    effect: "Максимальная когерентность мозга. Осознанное присутствие, интеграция информации, состояние потока.",
  },
};

const INTENSITY_GAIN: Record<Intensity, number> = {
  light: 0.3,
  medium: 0.6,
  deep: 1.0,
};

const FADE_DURATION = 0.4;

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
  const ctxRef          = useRef<AudioContext | null>(null);
  const masterGainRef   = useRef<GainNode | null>(null);
  const leftOscRef      = useRef<OscillatorNode | null>(null);
  const rightOscRef     = useRef<OscillatorNode | null>(null);
  const noiseSourceRef  = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef    = useRef<GainNode | null>(null);
  // isochronic
  const isoOscRef       = useRef<OscillatorNode | null>(null);
  const isoLfoRef       = useRef<OscillatorNode | null>(null);
  const isoConstRef     = useRef<ConstantSourceNode | null>(null);
  // breathing
  const breathLfoRef    = useRef<OscillatorNode | null>(null);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying]       = useState(false);
  const [mode, setModeState]            = useState<Mode>("focus");
  const [intensity, setIntensityState]  = useState<Intensity>("medium");
  const [volume, setVolumeState]        = useState(0.8);
  const [elapsed, setElapsed]           = useState(0);
  const [duration, setDurationState]    = useState(25);
  const startTimeRef = useRef<number>(0);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const stopNodes = useCallback(() => {
    const now = ctxRef.current?.currentTime ?? 0;
    const gain = masterGainRef.current;
    if (gain) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, FADE_DURATION / 3);
    }

    // Capture current node values before nulling refs
    const toStop = [
      leftOscRef.current,
      rightOscRef.current,
      isoOscRef.current,
      isoLfoRef.current,
      breathLfoRef.current,
      noiseSourceRef.current,
      isoConstRef.current,
    ];

    leftOscRef.current     = null;
    rightOscRef.current    = null;
    isoOscRef.current      = null;
    isoLfoRef.current      = null;
    breathLfoRef.current   = null;
    noiseSourceRef.current = null;
    isoConstRef.current    = null;

    setTimeout(() => {
      toStop.forEach(n => { try { (n as AudioScheduledSourceNode)?.stop(); } catch {} });
    }, FADE_DURATION * 1000);
  }, []);

  const start = useCallback((targetMode?: Mode, targetIntensity?: Intensity, targetDuration?: number) => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    const activeMode      = targetMode      ?? mode;
    const activeIntensity = targetIntensity ?? intensity;
    const activeDuration  = targetDuration  ?? duration;
    const config          = MODE_CONFIGS[activeMode];
    const targetVol       = volume * INTENSITY_GAIN[activeIntensity];

    stopNodes();

    // ─── Master gain (fade in) ───────────────────────────────────────
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + FADE_DURATION);
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // ─── Breathing rhythm ────────────────────────────────────────────
    // Sine LFO at 1/breathPeriod Hz → ±8% volume sway
    // Body naturally syncs breathing to the rhythm
    const breathLfo = ctx.createOscillator();
    breathLfo.type = "sine";
    breathLfo.frequency.value = 1 / config.breathPeriod;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = targetVol * 0.08;
    breathLfo.connect(breathDepth);
    breathDepth.connect(masterGain.gain);
    breathLfo.start();
    breathLfoRef.current = breathLfo;

    // ─── Binaural beats (headphones) ─────────────────────────────────
    const merger = ctx.createChannelMerger(2);
    merger.connect(masterGain);

    const leftOsc = ctx.createOscillator();
    leftOsc.frequency.value = config.carrierFreq;
    leftOsc.type = "sine";
    const leftGain = ctx.createGain();
    leftGain.gain.value = 0.4;
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    leftOsc.start();
    leftOscRef.current = leftOsc;

    const rightOsc = ctx.createOscillator();
    rightOsc.frequency.value = config.carrierFreq + config.beatFreq;
    rightOsc.type = "sine";
    const rightGain = ctx.createGain();
    rightGain.gain.value = 0.4;
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    rightOsc.start();
    rightOscRef.current = rightOsc;

    // ─── Isochronic tones (works without headphones) ─────────────────
    // Carrier at solfeggio freq, amplitude gated by square LFO at beat freq
    // Gate: ConstantSource(0.4) + LFO*0.4 → [0 .. 0.8] (off → on)
    const isoOsc = ctx.createOscillator();
    isoOsc.type = "sine";
    isoOsc.frequency.value = config.carrierFreq;

    const pulseGate = ctx.createGain();
    pulseGate.gain.value = 0; // controlled by LFO + const below

    const isoLfo = ctx.createOscillator();
    isoLfo.type = "square";
    isoLfo.frequency.value = config.beatFreq;

    const isoLfoScale = ctx.createGain();
    isoLfoScale.gain.value = 0.4; // [-1,1] → [-0.4, 0.4]

    const isoConst = new ConstantSourceNode(ctx, { offset: 0.4 }); // shift → [0, 0.8]

    isoLfo.connect(isoLfoScale);
    isoLfoScale.connect(pulseGate.gain);
    isoConst.connect(pulseGate.gain);

    const isoVol = ctx.createGain();
    isoVol.gain.value = 0.28; // quieter than binaural, blends in

    isoOsc.connect(pulseGate);
    pulseGate.connect(isoVol);
    isoVol.connect(masterGain);

    isoLfo.start();
    isoConst.start();
    isoOsc.start();
    isoOscRef.current  = isoOsc;
    isoLfoRef.current  = isoLfo;
    isoConstRef.current = isoConst;

    // ─── Pink noise ──────────────────────────────────────────────────
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
    noiseGainRef.current   = noiseGain;

    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsPlaying(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= activeDuration * 60) stop();
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
    if (isPlaying) stop();
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
