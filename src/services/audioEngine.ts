import { SoundType, AmbienceType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private mainFilter: BiquadFilterNode | null = null;
  private shishiodoshiGain: GainNode | null = null; 

  private ambienceState: Record<AmbienceType, { active: boolean, volume: number, nodes?: AudioNode[] }> = {
    rain: { active: false, volume: 0 },
    wind: { active: false, volume: 0 },
    birds: { active: false, volume: 0 },
    smallBirds: { active: false, volume: 0 },
    river: { active: false, volume: 0 },
    crickets: { active: false, volume: 0 },
    windChime: { active: false, volume: 0 },
    honeybee: { active: false, volume: 0 },
    thunder: { active: false, volume: 0 },
    suikinkutsu: { active: false, volume: 0 },
  };

  private layerVolumes = {
    distantRain: 0.5,
    eavesRain: 0.5,
    landscape: 0.5
  };

  private buffers: Record<string, AudioBuffer> = {};
  private kapponBuffer: AudioBuffer | null = null;
  private landscapeTimer: number | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      
      this.masterGain = this.ctx.createGain();
      this.mainFilter = this.ctx.createBiquadFilter();
      this.compressor = this.ctx.createDynamicsCompressor();

      this.mainFilter.type = 'lowpass';
      this.mainFilter.frequency.value = 9000; 

      this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain.connect(this.mainFilter);
      this.mainFilter.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.masterGain.gain.value = 0.7;

      this.shishiodoshiGain = this.ctx.createGain();
      this.shishiodoshiGain.connect(this.ctx.destination);
      this.shishiodoshiGain.gain.value = 2.0;

      this.createKapponSound();
      this.scheduleNextLandscapeVoice();
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  fadeOutMaster(duration: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, duration / 3);
    }
  }

  setLayerVolume(layer: 'distantRain' | 'eavesRain' | 'landscape', val: number) {
    this.layerVolumes[layer] = val;
    this.updateContinuous('rain');
    this.updateContinuous('river');
    this.updateContinuous('wind');
    this.updateContinuous('honeybee');
  }

  private updateContinuous(type: AmbienceType) {
    if (this.ambienceState[type].active) {
      this.handleContinuousNoise(type, true, this.ambienceState[type].volume);
    }
  }

  private scheduleNextLandscapeVoice() {
    if (this.landscapeTimer) window.clearTimeout(this.landscapeTimer);
    const delay = (8 + Math.random() * 22) * 1000;
    this.landscapeTimer = window.setTimeout(() => {
      this.triggerRandomLandscapeVoice();
      this.scheduleNextLandscapeVoice();
    }, delay);
  }

  private triggerRandomLandscapeVoice() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const candidates: AmbienceType[] = [];
    if (this.ambienceState.birds.active) candidates.push('birds');
    if (this.ambienceState.smallBirds.active) candidates.push('smallBirds');
    if (this.ambienceState.windChime.active) candidates.push('windChime');
    if (this.ambienceState.thunder.active) candidates.push('thunder');
    if (this.ambienceState.suikinkutsu.active) candidates.push('suikinkutsu');
    if (this.ambienceState.crickets.active) candidates.push('crickets');

    if (candidates.length === 0) return;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const vol = this.ambienceState[chosen].volume * this.layerVolumes.landscape;

    switch (chosen) {
      case 'birds': this.playUguisu(vol); break;
      case 'smallBirds': this.playSmallBirds(vol); break;
      case 'windChime': this.playWindChime(vol); break;
      case 'thunder': this.playDistantThunder(vol); break; 
      case 'suikinkutsu': this.playSuikinkutsu(vol); break;
      case 'crickets': this.playCricket(vol); break;
    }
  }

  playTone(freq: number, type: SoundType = 'Suikin') {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);

    let stopTime = t + 6;

    switch (type) {
      case 'Crystal': {
        osc.type = 'sine';
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 2.01, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);
        osc.connect(gain);
        osc2.connect(gain);
        osc2.start(t);
        osc2.stop(t + 2.5);
        stopTime = t + 3.0;
        break;
      }
      case 'MusicBox':
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        break;
      case 'Ether':
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        break;
      case 'Deep':
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 6.0);
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        break;
      case 'Bamboo':
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        stopTime = t + 1.0;
        break;
      case 'Suikin': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        osc.connect(gain);
        stopTime = t + 5.0;
        break;
      }
    }
    osc.start(t);
    osc.stop(stopTime);
  }

  createKapponSound() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration = 2.0; 
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        data[i] = (Math.sin(t * 1200 * Math.PI * 2) * Math.exp(-t * 200) * 0.5 + (Math.sin(t * 220 * Math.PI * 2) * 0.6) * Math.exp(-t * 12)) * 0.8;
    }
    this.kapponBuffer = buffer;
  }

  playShishiodoshi() {
    if (!this.ctx || !this.kapponBuffer || !this.shishiodoshiGain) return;
    const playOnce = () => {
      const source = this.ctx!.createBufferSource();
      source.buffer = this.kapponBuffer;
      source.connect(this.shishiodoshiGain!);
      source.start();
    };
    playOnce();
    setTimeout(playOnce, 1200);
  }

  playTempleBell() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const bellGain = this.ctx.createGain();
    bellGain.connect(this.masterGain);
    bellGain.gain.setValueAtTime(0, t);
    bellGain.gain.linearRampToValueAtTime(0.8, t + 0.01);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 15);
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(82.41, t);
    osc.connect(bellGain);
    osc.start(t);
    osc.stop(t + 15);
  }

  setAmbience(type: AmbienceType, active: boolean, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    this.ambienceState[type].active = active;
    this.ambienceState[type].volume = vol;
    if (['rain', 'wind', 'river', 'honeybee'].includes(type)) {
        this.handleContinuousNoise(type, active, vol);
    }
  }

  private handleContinuousNoise(type: string, active: boolean, vol: number) {
      if (active) {
          if (!this.ambienceState[type as AmbienceType].nodes) {
            const bufferSize = 2 * this.ctx!.sampleRate;
            if (!this.buffers[type]) {
                const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                this.buffers[type] = buffer;
            }

            if (type === 'rain') {
                const sourceDistant = this.ctx!.createBufferSource();
                sourceDistant.buffer = this.buffers['rain'];
                sourceDistant.loop = true;
                const filterDistant = this.ctx!.createBiquadFilter();
                filterDistant.type = 'lowpass';
                filterDistant.frequency.value = 400; 
                const gainDistant = this.ctx!.createGain();
                gainDistant.gain.setValueAtTime(0, this.ctx!.currentTime);
                gainDistant.gain.setTargetAtTime(vol * 0.091 * this.layerVolumes.distantRain, this.ctx!.currentTime, 2.0);

                const sourceEaves = this.ctx!.createBufferSource();
                sourceEaves.buffer = this.buffers['rain'];
                sourceEaves.loop = true;
                const filterEaves = this.ctx!.createBiquadFilter();
                filterEaves.type = 'bandpass';
                filterEaves.frequency.value = 2200;
                filterEaves.Q.value = 0.5;
                const gainEaves = this.ctx!.createGain();
                gainEaves.gain.setValueAtTime(0, this.ctx!.currentTime);
                gainEaves.gain.setTargetAtTime(vol * 0.025 * this.layerVolumes.eavesRain, this.ctx!.currentTime, 2.5);

                sourceDistant.connect(filterDistant);
                filterDistant.connect(gainDistant);
                gainDistant.connect(this.masterGain!);

                sourceEaves.connect(filterEaves);
                filterEaves.connect(gainEaves);
                gainEaves.connect(this.masterGain!);

                sourceDistant.start();
                sourceEaves.start();

                this.ambienceState['rain'].nodes = [sourceDistant, gainDistant, filterDistant, sourceEaves, gainEaves, filterEaves];
            } else {
                const source = this.ctx!.createBufferSource();
                source.buffer = this.buffers[type];
                source.loop = true;
                const filter = this.ctx!.createBiquadFilter();
                const gain = this.ctx!.createGain();
                const panner = this.ctx!.createPanner();
                panner.panningModel = 'equalpower';

                if (type === 'wind') {
                  panner.positionX.setValueAtTime(-1, this.ctx!.currentTime);
                  filter.type = 'lowpass';
                  filter.frequency.value = 500; 
                } else if (type === 'river') {
                  panner.positionX.setValueAtTime(0, this.ctx!.currentTime);
                  filter.type = 'lowpass';
                  filter.frequency.value = 1000;
                }

                source.connect(filter);
                filter.connect(panner);
                panner.connect(gain);
                gain.connect(this.masterGain!);
                
                let currentBase = vol * 0.035; 
                if (type === 'river') currentBase = vol * 0.025;

                gain.gain.setValueAtTime(0, this.ctx!.currentTime);
                gain.gain.setTargetAtTime(currentBase, this.ctx!.currentTime, 2.0);
                source.start();
                this.ambienceState[type as AmbienceType].nodes = [source, gain, filter, panner];
            }
          } else {
             if (type === 'rain') {
                const gainDistant = this.ambienceState['rain'].nodes![1] as GainNode;
                const gainEaves = this.ambienceState['rain'].nodes![4] as GainNode;
                gainDistant.gain.setTargetAtTime(vol * 0.091 * this.layerVolumes.distantRain, this.ctx!.currentTime, 1.0);
                gainEaves.gain.setTargetAtTime(vol * 0.025 * this.layerVolumes.eavesRain, this.ctx!.currentTime, 1.0);
             } else {
                const gain = this.ambienceState[type as AmbienceType].nodes![1] as GainNode;
                let finalVol = vol * 0.035;
                if (type === 'river') finalVol = vol * 0.025;
                gain.gain.setTargetAtTime(finalVol, this.ctx!.currentTime, 1.0);
             }
          }
      } else if (this.ambienceState[type as AmbienceType].nodes) {
          if (type === 'rain') {
            const gD = this.ambienceState['rain'].nodes![1] as GainNode;
            const gE = this.ambienceState['rain'].nodes![4] as GainNode;
            const sD = this.ambienceState['rain'].nodes![0] as AudioBufferSourceNode;
            const sE = this.ambienceState['rain'].nodes![3] as AudioBufferSourceNode;
            gD.gain.setTargetAtTime(0, this.ctx!.currentTime, 1.2);
            gE.gain.setTargetAtTime(0, this.ctx!.currentTime, 1.2);
            setTimeout(() => { try { sD.stop(); sE.stop(); } catch(e) {} }, 2000);
          } else {
            const gain = this.ambienceState[type as AmbienceType].nodes![1] as GainNode;
            const source = this.ambienceState[type as AmbienceType].nodes![0] as AudioBufferSourceNode;
            gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 1.2);
            setTimeout(() => { try { source.stop(); } catch(e) {} }, 2000);
          }
          this.ambienceState[type as AmbienceType].nodes = undefined;
      }
  }

  private playUguisu(vol: number) {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const panner = this.ctx.createPanner();
      panner.positionX.setValueAtTime(1.0, t);
      const gain = this.ctx.createGain();
      gain.connect(panner);
      panner.connect(this.masterGain);
      const osc1 = this.ctx.createOscillator();
      osc1.frequency.setValueAtTime(1400, t);
      osc1.frequency.linearRampToValueAtTime(1450, t + 0.6);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.1);
      gain.gain.setTargetAtTime(0, t + 0.5, 0.1);
      osc1.connect(gain);
      osc1.start(t);
      osc1.stop(t + 0.7);
      const osc2 = this.ctx.createOscillator();
      const t2 = t + 0.8;
      osc2.frequency.setValueAtTime(1800, t2);
      osc2.frequency.exponentialRampToValueAtTime(2600, t2 + 0.1);
      gain.gain.setTargetAtTime(vol * 0.7, t2, 0.02);
      gain.gain.setTargetAtTime(0, t2 + 0.15, 0.05);
      osc2.connect(gain);
      osc2.start(t2);
      osc2.stop(t2 + 0.2);
      const osc3 = this.ctx.createOscillator();
      const t3 = t + 1.05;
      osc3.frequency.setValueAtTime(3200, t3);
      osc3.frequency.linearRampToValueAtTime(3600, t3 + 0.1);
      osc3.frequency.exponentialRampToValueAtTime(3000, t3 + 0.5);
      gain.gain.setTargetAtTime(vol * 0.9, t3, 0.05);
      gain.gain.setTargetAtTime(0, t3 + 0.4, 0.2);
      osc3.connect(gain);
      osc3.start(t3);
      osc3.stop(t3 + 0.8);
  }

  private playSmallBirds(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const panner = this.ctx.createPanner();
    panner.positionX.setValueAtTime(0.8, t); 
    const gain = this.ctx.createGain();
    gain.connect(panner);
    panner.connect(this.masterGain);
    for(let i=0; i<3; i++) {
        const offset = i * 0.3;
        gain.gain.setTargetAtTime(vol * 0.4, t + offset, 0.01);
        gain.gain.setTargetAtTime(0, t + offset + 0.08, 0.01);
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(4000 + Math.random() * 500, t + offset);
        osc.frequency.exponentialRampToValueAtTime(4800, t + offset + 0.05);
        osc.connect(gain);
        osc.start(t + offset);
        osc.stop(t + offset + 0.1);
    }
  }

  private playWindChime(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const panner = this.ctx.createPanner();
    panner.positionX.setValueAtTime(0.5, t);
    const gain = this.ctx.createGain();
    gain.connect(panner);
    panner.connect(this.masterGain);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(2200 + Math.random() * 500, t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 2);
  }

  private playDistantThunder(vol: number) {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const panner = this.ctx.createPanner();
      panner.positionX.setValueAtTime(-1.0, t);
      panner.positionZ.setValueAtTime(-3.0, t); 
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t); 
      filter.Q.setValueAtTime(0.7, t);
      gain.connect(filter);
      filter.connect(panner);
      panner.connect(this.masterGain);
      const bellVol = vol * 0.85; 
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(bellVol, t + 0.05); 
      gain.gain.exponentialRampToValueAtTime(bellVol * 0.1, t + 9.0);
      gain.gain.linearRampToValueAtTime(0, t + 20.0);
      const frequencies = [38.5, 77.2, 115.8, 154.5, 231.6];
      frequencies.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t);
          const oscGain = this.ctx!.createGain();
          oscGain.gain.setValueAtTime(1.0 / (i + 1), t);
          osc.connect(oscGain);
          oscGain.connect(gain);
          osc.start(t);
          osc.stop(t + 20);
      });
  }

  private playSuikinkutsu(vol: number) {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const panner = this.ctx.createPanner();
      panner.positionX.setValueAtTime(0, t);
      const gain = this.ctx.createGain();
      gain.connect(panner);
      panner.connect(this.masterGain);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.7, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 5);
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 5);
  }

  private playCricket(vol: number) {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const panner = this.ctx.createPanner();
      panner.positionX.setValueAtTime(-0.5, t);
      const gain = this.ctx.createGain();
      const modGain = this.ctx.createGain(); 
      gain.connect(panner);
      panner.connect(this.masterGain);
      const baseFreq = 4800 + Math.random() * 200;
      const lfo = this.ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(12, t);
      lfo.connect(modGain.gain);
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.connect(modGain);
      modGain.connect(gain);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.25, t + 0.1);
      gain.gain.setTargetAtTime(0, t + 1.2, 0.4);
      lfo.start(t);
      osc.start(t);
      lfo.stop(t + 1.8);
      osc.stop(t + 1.8);
  }
}

export const audioEngine = new AudioEngine();
