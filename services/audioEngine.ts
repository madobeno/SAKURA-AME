
import { SoundType, AmbienceType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private shishiodoshiGain: GainNode | null = null; 
  private ambienceState: Record<AmbienceType, { active: boolean, volume: number, timer?: number, nodes?: AudioNode[] }> = {
    rain: { active: false, volume: 0 },
    wind: { active: false, volume: 0 },
    birds: { active: false, volume: 0 },
    river: { active: false, volume: 0 },
    crickets: { active: false, volume: 0 },
  };
  private buffers: Record<string, AudioBuffer> = {};
  private shishiodoshiBuffer: AudioBuffer | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.7;

      this.shishiodoshiGain = this.ctx.createGain();
      this.shishiodoshiGain.connect(this.ctx.destination);
      this.shishiodoshiGain.gain.value = 1.0;

      this.createShishiodoshiSound();
      this.startAmbienceLoop();
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx!.currentTime, 0.05);
    }
  }

  fadeOutMaster(duration: number, onComplete?: () => void) {
    if (!this.masterGain || !this.ctx) return;
    const current = this.masterGain.gain.value;
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(current, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    
    setTimeout(() => {
      onComplete?.();
    }, duration * 1000);
  }

  playTone(freq: number, type: SoundType = 'Suikin') {
    if (!this.ctx || !this.masterGain) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    gain.connect(this.masterGain);

    switch (type) {
      case 'Crystal':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        modulator.frequency.value = freq * 3.5;
        modGain.gain.value = freq * 0.8;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
        break;
      case 'MusicBox':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        const overtone = this.ctx.createOscillator();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2.01, t);
        const oGain = this.ctx.createGain();
        oGain.gain.setValueAtTime(0.15, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
        overtone.connect(oGain);
        oGain.connect(gain);
        overtone.start(t);
        overtone.stop(t + 4);
        break;
      case 'Ether':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        modulator.frequency.value = freq * 0.5;
        modGain.gain.value = freq * 2;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
        break;
      case 'Deep':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.5, t);
        modulator.frequency.value = freq * 1.5;
        modGain.gain.value = freq * 3;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        break;
      case 'Bamboo':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        modulator.frequency.value = freq * 1.414;
        modGain.gain.value = freq * 0.5;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        break;
      case 'Suikin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.4, t);
        modulator.frequency.value = freq * 5;
        modGain.gain.value = freq * 0.3;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.05, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
        break;
    }

    if (type !== 'MusicBox') {
        modulator.connect(modGain);
        modGain.connect(osc.frequency);
    }
    osc.connect(gain);

    osc.start(t);
    if (modulator && type !== 'MusicBox') {
        modulator.start(t);
        modulator.stop(t + 5);
    }
    osc.stop(t + 5);
  }

  createShishiodoshiSound() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration = 8.0; 
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const impactEnv = Math.exp(-t * 120); 
        const impact = (Math.random() * 0.4 + Math.sin(t * 1200 * Math.PI * 2) * 0.6) * impactEnv;
        const bodyEnv = Math.exp(-t * 3.5); 
        const body = (Math.sin(t * 260 * Math.PI * 2) * 0.5 + Math.sin(t * 390 * Math.PI * 2) * 0.3) * bodyEnv;
        let tail = 0;
        if (t > 0.08) {
            const tailT = t - 0.08;
            const tailEnv = Math.exp(-tailT * 0.6); 
            const mod = Math.sin(tailT * 5 * Math.PI * 2) * 0.05; 
            tail = (Math.sin(tailT * 180 * Math.PI * 2) + mod) * 0.25 * tailEnv;
        }
        data[i] = (impact * 0.7 + body * 0.4 + tail * 0.5) * 1.1;
    }
    this.shishiodoshiBuffer = buffer;
  }

  playShishiodoshi() {
    if (!this.ctx || !this.shishiodoshiBuffer || !this.shishiodoshiGain) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.shishiodoshiBuffer;
    source.playbackRate.value = 0.95; 
    source.connect(this.shishiodoshiGain);
    source.start();
  }

  startAmbienceLoop() {
      setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          if (this.ambienceState.birds.active && Math.random() < 0.1) this.playUguisu(this.ambienceState.birds.volume);
          if (this.ambienceState.crickets.active && Math.random() < 0.3) this.playCricket(this.ambienceState.crickets.volume);
      }, 1000);
  }

  setAmbience(type: AmbienceType, active: boolean, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    this.ambienceState[type].active = active;
    this.ambienceState[type].volume = vol;
    if (['rain', 'wind', 'river'].includes(type)) {
        this.handleContinuousNoise(type, active, vol);
    }
  }

  handleContinuousNoise(type: string, active: boolean, vol: number) {
      if (active) {
          if (!this.ambienceState[type as AmbienceType].nodes) {
            const bufferSize = 2 * this.ctx!.sampleRate;
            if (!this.buffers[type]) {
                const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                this.buffers[type] = buffer;
            }
            const source = this.ctx!.createBufferSource();
            source.buffer = this.buffers[type];
            source.loop = true;
            const filter = this.ctx!.createBiquadFilter();
            if (type === 'rain') { filter.type = 'lowpass'; filter.frequency.value = 800; }
            if (type === 'wind') { filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 1; }
            if (type === 'river') { filter.type = 'lowpass'; filter.frequency.value = 300; }
            const gain = this.ctx!.createGain();
            gain.gain.value = 0;
            gain.gain.setTargetAtTime(vol * 0.15, this.ctx!.currentTime, 1);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain!);
            source.start();
            this.ambienceState[type as AmbienceType].nodes = [source, gain, filter];
          } else {
             const gain = this.ambienceState[type as AmbienceType].nodes![1] as GainNode;
             gain.gain.setTargetAtTime(vol * 0.15, this.ctx!.currentTime, 0.5);
          }
      } else if (this.ambienceState[type as AmbienceType].nodes) {
          const gain = this.ambienceState[type as AmbienceType].nodes![1] as GainNode;
          const source = this.ambienceState[type as AmbienceType].nodes![0] as AudioBufferSourceNode;
          gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.5);
          setTimeout(() => { try { source.stop(); } catch(e) {} }, 600);
          this.ambienceState[type as AmbienceType].nodes = undefined;
      }
  }

  playUguisu(vol: number) {
      const t = this.ctx!.currentTime;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.6, t + 0.1);
      gain.gain.linearRampToValueAtTime(0, t + 0.8);
      osc.frequency.setValueAtTime(2500, t); 
      osc.frequency.linearRampToValueAtTime(2400, t + 0.8);
      const t2 = t + 1.2;
      const osc2 = this.ctx!.createOscillator();
      const gain2 = this.ctx!.createGain();
      osc2.connect(gain2);
      gain2.connect(this.masterGain!);
      gain2.gain.setValueAtTime(0, t2);
      gain2.gain.linearRampToValueAtTime(vol * 0.8, t2 + 0.1); 
      gain2.gain.linearRampToValueAtTime(vol * 0.2, t2 + 0.2); 
      gain2.gain.linearRampToValueAtTime(vol * 0.9, t2 + 0.4); 
      gain2.gain.linearRampToValueAtTime(0, t2 + 0.9); 
      osc2.frequency.setValueAtTime(2500, t2);
      osc2.frequency.setValueAtTime(2500, t2 + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1800, t2 + 0.25);
      osc2.frequency.linearRampToValueAtTime(3500, t2 + 0.4);
      osc2.frequency.linearRampToValueAtTime(2000, t2 + 0.9);
      osc.start(t); osc.stop(t + 0.9);
      osc2.start(t2); osc2.stop(t2 + 1.0);
  }

  playCricket(vol: number) {
      const t = this.ctx!.currentTime;
      const osc = this.ctx!.createOscillator();
      const mod = this.ctx!.createOscillator();
      const modGain = this.ctx!.createGain();
      const gain = this.ctx!.createGain();
      mod.frequency.value = 40; 
      modGain.gain.value = 500;
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.frequency.setValueAtTime(4500, t);
      for(let i=0; i<3; i++) {
          const start = t + i * 0.15;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(vol * 0.4, start + 0.05);
          gain.gain.linearRampToValueAtTime(0, start + 0.1);
      }
      osc.start(t); mod.start(t);
      osc.stop(t + 0.5); mod.stop(t + 0.5);
  }
}

export const audioEngine = new AudioEngine();
