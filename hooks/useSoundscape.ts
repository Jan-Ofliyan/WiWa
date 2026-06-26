"use client";

import { useRef, useState, useCallback } from "react";

export type Soundscape = "none" | "rain" | "ocean" | "fire" | "cosmos";

export const SOUNDSCAPES: Array<{ id: Exclude<Soundscape, "none">; label: string; icon: string }> = [
  { id: "rain",   label: "Дождь",  icon: "🌧️" },
  { id: "ocean",  label: "Океан",  icon: "🌊" },
  { id: "fire",   label: "Камин",  icon: "🔥" },
  { id: "cosmos", label: "Космос", icon: "🌌" },
];

const FADE = 1.5;

function buildWhiteNoise(ctx: AudioContext, seconds = 3): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function buildBrownNoise(ctx: AudioContext, seconds = 3): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

function buildPinkNoise(ctx: AudioContext, seconds = 4): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

type Builder = (ctx: AudioContext, out: GainNode) => AudioScheduledSourceNode[];

const BUILDERS: Record<Exclude<Soundscape, "none">, Builder> = {
  rain(ctx, out) {
    const src = ctx.createBufferSource();
    src.buffer = buildWhiteNoise(ctx, 3);
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2800;
    bp.Q.value = 0.7;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 600;

    const g = ctx.createGain();
    g.gain.value = 0.65;

    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(out);
    src.start();
    return [src];
  },

  ocean(ctx, out) {
    const src = ctx.createBufferSource();
    src.buffer = buildPinkNoise(ctx, 4);
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 450;

    const ampGain = ctx.createGain();
    ampGain.gain.value = 0.5;

    // Wave LFO — ~14 sec per wave
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.35;
    const lfoOffset = new ConstantSourceNode(ctx, { offset: 0.5 });

    lfo.connect(lfoDepth);
    lfoDepth.connect(ampGain.gain);
    lfoOffset.connect(ampGain.gain);

    src.connect(lp); lp.connect(ampGain); ampGain.connect(out);
    lfo.start(); lfoOffset.start(); src.start();
    return [src, lfo, lfoOffset];
  },

  fire(ctx, out) {
    // Low rumble
    const baseSrc = ctx.createBufferSource();
    baseSrc.buffer = buildBrownNoise(ctx, 3);
    baseSrc.loop = true;

    const baseLp = ctx.createBiquadFilter();
    baseLp.type = "lowpass";
    baseLp.frequency.value = 280;

    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.55;

    baseSrc.connect(baseLp); baseLp.connect(baseGain); baseGain.connect(out);
    baseSrc.start();

    // Crackle
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = buildWhiteNoise(ctx, 2);
    crackSrc.loop = true;

    const crackBp = ctx.createBiquadFilter();
    crackBp.type = "bandpass";
    crackBp.frequency.value = 1200;
    crackBp.Q.value = 3;

    const crackGain = ctx.createGain();
    crackGain.gain.value = 0.12;

    crackSrc.connect(crackBp); crackBp.connect(crackGain); crackGain.connect(out);
    crackSrc.start();

    return [baseSrc, crackSrc];
  },

  cosmos(ctx, out) {
    const nodes: AudioScheduledSourceNode[] = [];

    // Long reverb
    const revLen = Math.floor(ctx.sampleRate * 5);
    const revBuf = ctx.createBuffer(2, revLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = revBuf.getChannelData(ch);
      for (let i = 0; i < revLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 1.5);
      }
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = revBuf;
    const revGain = ctx.createGain();
    revGain.gain.value = 0.55;
    reverb.connect(revGain); revGain.connect(out);

    // Drone oscillators
    ([55, 110, 165] as number[]).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.1 / (i + 1);
      osc.connect(g);
      g.connect(reverb);
      g.connect(out);
      osc.start();
      nodes.push(osc);
    });

    // Sub-bass noise
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = buildPinkNoise(ctx, 4);
    nSrc.loop = true;
    const nLp = ctx.createBiquadFilter();
    nLp.type = "lowpass";
    nLp.frequency.value = 90;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.25;
    nSrc.connect(nLp); nLp.connect(nGain); nGain.connect(reverb);
    nSrc.start();
    nodes.push(nSrc);

    return nodes;
  },
};

export function useSoundscape() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef  = useRef<AudioScheduledSourceNode[]>([]);

  const [active, setActiveState] = useState<Soundscape>("none");
  const [volume, setVolumeState] = useState(0.5);
  const volumeRef = useRef(0.5);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      const master = ctxRef.current.createGain();
      master.gain.value = 0;
      master.connect(ctxRef.current.destination);
      masterRef.current = master;
    }
    return ctxRef.current;
  }, []);

  const stopCurrent = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, FADE / 3);

    const toStop = nodesRef.current;
    nodesRef.current = [];
    setTimeout(() => {
      toStop.forEach(n => { try { n.stop(); } catch { /* already stopped */ } });
    }, FADE * 1000 + 100);
  }, []);

  const setActive = useCallback((s: Soundscape) => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    setActiveState(s);
    stopCurrent();

    if (s === "none") return;

    const master = masterRef.current!;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(volumeRef.current, now + FADE);

    nodesRef.current = BUILDERS[s](ctx, master);
  }, [getCtx, stopCurrent]);

  const setVolume = useCallback((v: number) => {
    volumeRef.current = v;
    setVolumeState(v);
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.1);
    }
  }, []);

  return { active, volume, setActive, setVolume };
}
