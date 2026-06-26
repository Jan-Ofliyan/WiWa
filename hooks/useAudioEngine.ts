"use client";

import { useRef, useState, useCallback } from "react";

export type Mode = "focus" | "meditation" | "sleep" | "silence" | "gamma";
export type Intensity = "light" | "medium" | "deep";

interface ModeConfig {
  beatFreq: number;
  carrierFreq: number;
  noiseGain: number;
  noiseCutoff: number;
  breathPeriod: number;
  reverbDecay: number;
  harmonics: number[];
  label: string;
  description: string;
  feeling: string;
  effect: string;
}

// Solfeggio carrier frequencies + ambient harmonic profiles
const MODE_CONFIGS: Record<Mode, ModeConfig> = {
  focus: {
    beatFreq: 16,
    carrierFreq: 396,
    noiseGain: 0.025,
    noiseCutoff: 1200,
    breathPeriod: 4,
    reverbDecay: 2.5,
    harmonics: [1, 1.5, 2],          // root + fifth + octave
    label: "Фокус",
    description: "Бета-волны · 16 Гц",
    feeling: "Ясность и концентрация",
    effect: "Мозг входит в рабочий поток. Мысли чёткие, внимание устойчивое, задачи решаются легче.",
  },
  meditation: {
    beatFreq: 10,
    carrierFreq: 528,
    noiseGain: 0.02,
    noiseCutoff: 600,
    breathPeriod: 6,
    reverbDecay: 4.5,
    harmonics: [1, 1.333, 1.5, 2],   // root + fourth + fifth + octave
    label: "Медитация",
    description: "Альфа-волны · 10 Гц",
    feeling: "Спокойствие без сонливости",
    effect: "Снятие стресса, лёгкость в теле. Мозг расслаблен, но осознан — идеально для медитации.",
  },
  sleep: {
    beatFreq: 2,
    carrierFreq: 174,
    noiseGain: 0.045,
    noiseCutoff: 250,
    breathPeriod: 8,
    reverbDecay: 7.0,
    harmonics: [1, 2, 3],            // root + octave + octave+fifth (deep resonance)
    label: "Сон",
    description: "Дельта-волны · 2 Гц",
    feeling: "Глубокое погружение",
    effect: "Физическое восстановление, укрепление иммунитета, очищение мозга от токсинов через глимфатическую систему.",
  },
  silence: {
    beatFreq: 7.83,
    carrierFreq: 285,
    noiseGain: 0.012,
    noiseCutoff: 400,
    breathPeriod: 6,
    reverbDecay: 5.5,
    harmonics: [1, 1.5, 1.778, 2],   // root + fifth + min7 + octave (mysterious)
    label: "Тишина",
    description: "Тета-волны · 7.83 Гц",
    feeling: "Ворота в подсознание",
    effect: "Творчество, озарения, интуиция. Консолидация памяти. Граница между сном и бодрствованием.",
  },
  gamma: {
    beatFreq: 40,
    carrierFreq: 963,
    noiseGain: 0.012,
    noiseCutoff: 900,
    breathPeriod: 4,
    reverbDecay: 3.0,
    harmonics: [1, 1.5, 2],          // root + fifth + octave (crystalline)
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

const FADE_DURATION = 1.2;

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

// Algorithmic reverb via randomised impulse response
function createReverb(ctx: AudioContext, decaySeconds: number): ConvolverNode {
  const convolver = ctx.createConvolver();
  const length = Math.floor(ctx.sampleRate * decaySeconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.0);
    }
  }
  convolver.buffer = impulse;
  return convolver;
}

export function useAudioEngine() {
  const ctxRef            = useRef<AudioContext | null>(null);
  const masterGainRef     = useRef<GainNode | null>(null);
  const leftOscRef        = useRef<OscillatorNode | null>(null);
  const rightOscRef       = useRef<OscillatorNode | null>(null);
  const noiseSourceRef    = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef      = useRef<GainNode | null>(null);
  const isoOscRef         = useRef<OscillatorNode | null>(null);
  const isoLfoRef         = useRef<OscillatorNode | null>(null);
  const isoConstRef       = useRef<ConstantSourceNode | null>(null);
  const breathLfoRef      = useRef<OscillatorNode | null>(null);
  const padOscillatorsRef = useRef<OscillatorNode[]>([]);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef           = useRef<AnalyserNode | null>(null);
  const stopRef               = useRef<() => void>(() => {});
  const padBusRef             = useRef<GainNode | null>(null);
  const soundscapeActiveRef   = useRef(false);

  const [isPlaying, setIsPlaying]      = useState(false);
  const [isPaused, setIsPaused]        = useState(false);
  const [mode, setModeState]           = useState<Mode>("focus");
  const [intensity, setIntensityState] = useState<Intensity>("medium");
  const [volume, setVolumeState]       = useState(0.8);
  const [elapsed, setElapsed]          = useState(0);
  const [duration, setDurationState]   = useState(15);
  const startTimeRef = useRef<number>(0);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      const analyser = ctxRef.current.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctxRef.current.destination);
      analyserRef.current = analyser;
    }
    return ctxRef.current;
  }, []);

  const stopNodes = useCallback(() => {
    const now = ctxRef.current?.currentTime ?? 0;
    const gain = masterGainRef.current;
    if (gain) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, FADE_DURATION / 3);
    }

    const toStop: AudioScheduledSourceNode[] = ([
      leftOscRef.current,
      rightOscRef.current,
      isoOscRef.current,
      isoLfoRef.current,
      breathLfoRef.current,
      noiseSourceRef.current,
      isoConstRef.current,
      ...padOscillatorsRef.current,
    ].filter(Boolean)) as AudioScheduledSourceNode[];

    leftOscRef.current        = null;
    rightOscRef.current       = null;
    isoOscRef.current         = null;
    isoLfoRef.current         = null;
    breathLfoRef.current      = null;
    noiseSourceRef.current    = null;
    isoConstRef.current       = null;
    padOscillatorsRef.current = [];

    setTimeout(() => {
      toStop.forEach(n => { try { n.stop(); } catch {} });
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

    // ─── Master gain (fade in) ────────────────────────────────────────
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + FADE_DURATION);
    masterGain.connect(analyserRef.current ?? ctx.destination);
    masterGainRef.current = masterGain;

    // ─── Breathing rhythm LFO ─────────────────────────────────────────
    const breathLfo = ctx.createOscillator();
    breathLfo.type = "sine";
    breathLfo.frequency.value = 1 / config.breathPeriod;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = targetVol * 0.06;
    breathLfo.connect(breathDepth);
    breathDepth.connect(masterGain.gain);
    breathLfo.start();
    breathLfoRef.current = breathLfo;

    // ─── Algorithmic reverb ───────────────────────────────────────────
    const reverb = createReverb(ctx, config.reverbDecay);
    const reverbOutGain = ctx.createGain();
    reverbOutGain.gain.value = 0.42;
    reverb.connect(reverbOutGain);
    reverbOutGain.connect(masterGain);

    // Dry bus for pad (no reverb)
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.58;
    dryGain.connect(masterGain);

    // ─── Ambient pad (harmonic oscillator bank) ───────────────────────
    // Each harmonic = 2 detuned oscillators (chorus warmth)
    const padOscillators: OscillatorNode[] = [];
    const padBus = ctx.createGain();
    padBus.gain.value = soundscapeActiveRef.current ? 0.04 : 0.48;
    padBus.connect(dryGain);
    padBus.connect(reverb);
    padBusRef.current = padBus;

    config.harmonics.forEach((mult, harmIdx) => {
      ([-6, 6] as number[]).forEach((detuneCents) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = config.carrierFreq * mult;
        osc.detune.value = detuneCents;
        const oscGain = ctx.createGain();
        // Fundamental loudest, harmonics progressively softer
        oscGain.gain.value = (1 / (harmIdx + 1)) * 0.28;
        osc.connect(oscGain);
        oscGain.connect(padBus);
        osc.start();
        padOscillators.push(osc);
      });
    });
    padOscillatorsRef.current = padOscillators;

    // ─── Binaural beats (headphones layer) ───────────────────────────
    const merger = ctx.createChannelMerger(2);
    const binauralGain = ctx.createGain();
    binauralGain.gain.value = 0.14;
    merger.connect(binauralGain);
    binauralGain.connect(masterGain);

    const leftOsc = ctx.createOscillator();
    leftOsc.frequency.value = config.carrierFreq;
    leftOsc.type = "sine";
    const leftGain = ctx.createGain();
    leftGain.gain.value = 1.0;
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    leftOsc.start();
    leftOscRef.current = leftOsc;

    const rightOsc = ctx.createOscillator();
    rightOsc.frequency.value = config.carrierFreq + config.beatFreq;
    rightOsc.type = "sine";
    const rightGain = ctx.createGain();
    rightGain.gain.value = 1.0;
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    rightOsc.start();
    rightOscRef.current = rightOsc;

    // ─── Isochronic tones (works without headphones) ─────────────────
    const isoOsc = ctx.createOscillator();
    isoOsc.type = "sine";
    isoOsc.frequency.value = config.carrierFreq;

    const pulseGate = ctx.createGain();
    pulseGate.gain.value = 0;

    const isoLfo = ctx.createOscillator();
    isoLfo.type = "sine";
    isoLfo.frequency.value = config.beatFreq;

    const isoLfoScale = ctx.createGain();
    isoLfoScale.gain.value = 0.4;

    const isoConst = new ConstantSourceNode(ctx, { offset: 0.4 });

    isoLfo.connect(isoLfoScale);
    isoLfoScale.connect(pulseGate.gain);
    isoConst.connect(pulseGate.gain);

    const isoVol = ctx.createGain();
    isoVol.gain.value = 0.08;

    isoOsc.connect(pulseGate);
    pulseGate.connect(isoVol);
    isoVol.connect(masterGain);

    isoLfo.start();
    isoConst.start();
    isoOsc.start();
    isoOscRef.current   = isoOsc;
    isoLfoRef.current   = isoLfo;
    isoConstRef.current = isoConst;

    // ─── Filtered pink noise ──────────────────────────────────────────
    const noiseBuffer = createPinkNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = config.noiseCutoff;
    noiseFilter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = soundscapeActiveRef.current
      ? config.noiseGain * 0.1
      : config.noiseGain;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();
    noiseSourceRef.current = noiseSource;
    noiseGainRef.current   = noiseGain;

    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsPlaying(true);
    setIsPaused(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= activeDuration * 60) stopRef.current();
    }, 1000);
  }, [mode, intensity, duration, volume, getCtx, stopNodes]);

  const pause = useCallback(() => {
    ctxRef.current?.suspend();
    setIsPlaying(false);
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resume = useCallback(() => {
    ctxRef.current?.resume();
    setIsPlaying(true);
    setIsPaused(false);
    startTimeRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= duration * 60) stopRef.current();
    }, 1000);
  }, [elapsed, duration]);

  const stop = useCallback(() => {
    stopNodes();
    setIsPlaying(false);
    setIsPaused(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopNodes]);

  stopRef.current = stop;

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

  const setAmbientActive = useCallback((active: boolean) => {
    soundscapeActiveRef.current = active;
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (padBusRef.current) {
      padBusRef.current.gain.setTargetAtTime(
        active ? 0.04 : 0.48, ctx.currentTime, 0.5
      );
    }
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.setTargetAtTime(
        active
          ? MODE_CONFIGS[mode].noiseGain * 0.1
          : MODE_CONFIGS[mode].noiseGain,
        ctx.currentTime, 0.5
      );
    }
  }, [mode]);

  const remaining = duration * 60 - elapsed;

  return {
    isPlaying,
    isPaused,
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
    setAmbientActive,
    analyserNode: analyserRef,
  };
}
