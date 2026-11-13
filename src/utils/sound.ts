import { Howl, Howler } from 'howler';

// All audio is synthesised at runtime into tiny WAV data-URIs, so the game
// ships with zero binary assets and works fully offline. Howler.js plays them.

export type SfxName =
  | 'click'
  | 'dice'
  | 'coin'
  | 'buy'
  | 'rent'
  | 'event'
  | 'build'
  | 'jail'
  | 'win'
  | 'lose'
  | 'step'
  | 'whoosh';

const RATE = 22050;

type Note = { f: number; d: number; v?: number; type?: 'sine' | 'square' | 'tri' | 'noise'; slide?: number };

function wave(type: Note['type'], phase: number): number {
  switch (type) {
    case 'square':
      return Math.sin(phase) >= 0 ? 0.6 : -0.6;
    case 'tri':
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case 'noise':
      return Math.random() * 2 - 1;
    default:
      return Math.sin(phase);
  }
}

function render(notes: Note[], gap = 0): string {
  const chunks: Float32Array[] = [];
  for (const n of notes) {
    const len = Math.floor(RATE * n.d);
    const buf = new Float32Array(len + Math.floor(RATE * gap));
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const f = n.f + (n.slide ?? 0) * t;
      phase += (2 * Math.PI * f) / RATE;
      const env = Math.min(1, i / 120) * Math.pow(1 - t, 1.6);
      buf[i] = wave(n.type, phase) * env * (n.v ?? 0.5);
    }
    chunks.push(buf);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const pcm = new Int16Array(total);
  let o = 0;
  for (const c of chunks) {
    for (let i = 0; i < c.length; i++) pcm[o++] = Math.max(-1, Math.min(1, c[i])) * 32767;
  }
  return toWavDataUri(pcm);
}

function toWavDataUri(pcm: Int16Array): string {
  const bytes = new Uint8Array(44 + pcm.length * 2);
  const view = new DataView(bytes.buffer);
  const w = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true);
  view.setUint32(28, RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  w(36, 'data');
  view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, pcm[i], true);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return 'data:audio/wav;base64,' + btoa(bin);
}

const DEFS: Record<SfxName, () => string> = {
  click: () => render([{ f: 660, d: 0.05, v: 0.35, type: 'tri' }]),
  step: () => render([{ f: 330, d: 0.04, v: 0.25, type: 'tri', slide: 120 }]),
  whoosh: () => render([{ f: 200, d: 0.25, v: 0.18, type: 'noise' }]),
  dice: () =>
    render(
      Array.from({ length: 9 }, (_, i) => ({ f: 180 + (i % 3) * 40, d: 0.045, v: 0.4, type: 'noise' as const })),
      0.03,
    ),
  coin: () =>
    render([
      { f: 988, d: 0.07, v: 0.4, type: 'square' },
      { f: 1319, d: 0.22, v: 0.4, type: 'square' },
    ]),
  buy: () =>
    render([
      { f: 523, d: 0.09, v: 0.4, type: 'tri' },
      { f: 659, d: 0.09, v: 0.4, type: 'tri' },
      { f: 784, d: 0.09, v: 0.4, type: 'tri' },
      { f: 1047, d: 0.25, v: 0.45, type: 'tri' },
    ]),
  rent: () =>
    render([
      { f: 440, d: 0.12, v: 0.4, type: 'square', slide: -160 },
      { f: 260, d: 0.2, v: 0.4, type: 'square', slide: -80 },
    ]),
  event: () =>
    render([
      { f: 392, d: 0.1, v: 0.4, type: 'tri' },
      { f: 523, d: 0.1, v: 0.4, type: 'tri' },
      { f: 392, d: 0.1, v: 0.4, type: 'tri' },
      { f: 659, d: 0.22, v: 0.45, type: 'tri' },
    ]),
  build: () =>
    render([
      { f: 200, d: 0.06, v: 0.5, type: 'square' },
      { f: 200, d: 0.06, v: 0.5, type: 'square' },
      { f: 392, d: 0.18, v: 0.4, type: 'tri' },
    ], 0.04),
  jail: () => render([{ f: 300, d: 0.5, v: 0.4, type: 'square', slide: -220 }]),
  lose: () =>
    render([
      { f: 392, d: 0.18, v: 0.4, type: 'tri' },
      { f: 330, d: 0.18, v: 0.4, type: 'tri' },
      { f: 262, d: 0.4, v: 0.4, type: 'tri' },
    ]),
  win: () =>
    render([
      { f: 523, d: 0.14, v: 0.45, type: 'tri' },
      { f: 659, d: 0.14, v: 0.45, type: 'tri' },
      { f: 784, d: 0.14, v: 0.45, type: 'tri' },
      { f: 1047, d: 0.14, v: 0.45, type: 'tri' },
      { f: 784, d: 0.14, v: 0.45, type: 'tri' },
      { f: 1047, d: 0.5, v: 0.5, type: 'tri' },
    ]),
};

// A looping cheerful melody for background music (~12s).
function renderMusic(): string {
  const melody = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];
  const bass = [131, 131, 175, 175, 196, 196, 131, 131];
  const beat = 0.375;
  const total = Math.floor(RATE * beat * melody.length);
  const pcm = new Int16Array(total);
  for (let i = 0; i < total; i++) {
    const t = i / RATE;
    const bi = Math.floor(t / beat);
    const local = (t % beat) / beat;
    const f = melody[bi % melody.length];
    const env = Math.pow(1 - local, 1.3);
    const lead = Math.sin(2 * Math.PI * f * t) * 0.5 + Math.sin(4 * Math.PI * f * t) * 0.1;
    const bf = bass[Math.floor(bi / 2) % bass.length];
    const bassWave = Math.sin(2 * Math.PI * bf * t) * 0.35;
    const tick = local < 0.05 && bi % 2 === 0 ? (Math.random() * 2 - 1) * 0.12 : 0;
    pcm[i] = Math.max(-1, Math.min(1, lead * env * 0.5 + bassWave * 0.5 + tick)) * 32767;
  }
  return toWavDataUri(pcm);
}

class SoundManager {
  private howls = new Map<SfxName, Howl>();
  private music: Howl | null = null;
  sfxOn = true;
  musicOn = true;
  volume = 0.7;
  private wantMusic = false;

  configure(opts: { sfx: boolean; music: boolean; volume: number }): void {
    this.sfxOn = opts.sfx;
    this.musicOn = opts.music;
    this.volume = opts.volume;
    Howler.volume(opts.volume);
    if (this.music) {
      if (!this.musicOn) this.music.pause();
      else if (this.wantMusic && !this.music.playing()) this.music.play();
    }
  }

  private get(name: SfxName): Howl | null {
    try {
      let h = this.howls.get(name);
      if (!h) {
        h = new Howl({ src: [DEFS[name]()], format: ['wav'], volume: 0.8 });
        this.howls.set(name, h);
      }
      return h;
    } catch {
      return null;
    }
  }

  play(name: SfxName): void {
    if (!this.sfxOn) return;
    try {
      this.get(name)?.play();
    } catch {
      /* audio is best-effort */
    }
  }

  startMusic(): void {
    this.wantMusic = true;
    if (!this.musicOn) return;
    try {
      if (!this.music) {
        this.music = new Howl({ src: [renderMusic()], format: ['wav'], loop: true, volume: 0.18 });
      }
      if (!this.music.playing()) this.music.play();
    } catch {
      /* ignore */
    }
  }

  stopMusic(): void {
    this.wantMusic = false;
    try {
      this.music?.pause();
    } catch {
      /* ignore */
    }
  }
}

export const sound = new SoundManager();
