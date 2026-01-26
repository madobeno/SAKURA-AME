import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Layers,
  Hourglass,
  X,
  Music,
  Bird,
  Wind,
  Waves,
  Bug,
  Bell,
  Lock,
  Flower,
  Play,
  Pause,
  CloudRain,
  CloudSun,
  Wind as WindIcon,
  CloudLightning,
  Droplets
} from 'lucide-react';
import {
  Note,
  RainDrop,
  Ripple,
  AmbienceType,
  AmbienceConfig,
  Theme,
  NoteParticle,
  SoundType,
  PresetEffect
} from './types';
import {
  NOTES,
  THEMES,
  GRAVITY_SPEED,
  PAD_Y_PERCENT,
  SHISHIODOSHI_PRESETS
} from './constants';
import { audioEngine } from './services/audioEngine';
import SakuraVisualizer from './components/SakuraVisualizer';
import './index.css'; // これが Tailwind の設定を含んでるはずや！

interface SongStep {
  noteId: string;
  delay: number;
}

const SONGS: Record<string, { name: string, steps: SongStep[], isPremium?: boolean }> = {
  sakura: {
    name: 'さくらさくら',
    steps: [
      { noteId: 'n_a3', delay: 800 }, { noteId: 'n_a3', delay: 800 }, { noteId: 'n_b3', delay: 1600 },
      { noteId: 'n_a3', delay: 800 }, { noteId: 'n_a3', delay: 800 }, { noteId: 'n_b3', delay: 1600 },
      { noteId: 'n_a3', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_d4', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_a3', delay: 400 }, { noteId: 'n_b3', delay: 400 }, { noteId: 'n_a3', delay: 800 },
      { noteId: 'n_g3', delay: 800 }, { noteId: 'n_e3', delay: 800 }, { noteId: 'n_d3', delay: 1600 },
    ]
  },
  haru: {
    name: '春の調べ',
    isPremium: true,
    steps: [
      { noteId: 'n_d3', delay: 300 }, { noteId: 'n_e3', delay: 300 }, { noteId: 'n_g3', delay: 300 }, { noteId: 'n_a3', delay: 300 }, { noteId: 'n_b3', delay: 600 },
      { noteId: 'n_d4', delay: 300 }, { noteId: 'n_b3', delay: 300 }, { noteId: 'n_a3', delay: 300 }, { noteId: 'n_g3', delay: 300 }, { noteId: 'n_e3', delay: 600 },
      { noteId: 'n_g4', delay: 400 }, { noteId: 'n_a4', delay: 400 }, { noteId: 'n_b4', delay: 800 },
      { noteId: 'n_a4', delay: 400 }, { noteId: 'n_g4', delay: 400 }, { noteId: 'n_e4', delay: 800 },
    ]
  },
  tsuki: {
    name: '月夜の川',
    isPremium: true,
    steps: [
      { noteId: 'n_d3', delay: 1200 }, { noteId: 'n_a3', delay: 1200 }, { noteId: 'n_d4', delay: 2400 },
      { noteId: 'n_e3', delay: 1200 }, { noteId: 'n_b3', delay: 1200 }, { noteId: 'n_e4', delay: 2400 },
      { noteId: 'n_g3', delay: 1200 }, { noteId: 'n_d4', delay: 1200 }, { noteId: 'n_g4', delay: 2400 },
    ]
  },
  fubuki: {
    name: '花吹雪',
    isPremium: true,
    steps: [
      { noteId: 'n_a4', delay: 200 }, { noteId: 'n_b4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
      { noteId: 'n_a4', delay: 200 }, { noteId: 'n_b4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
      { noteId: 'n_g4', delay: 200 }, { noteId: 'n_e4', delay: 200 }, { noteId: 'n_d4', delay: 400 },
      { noteId: 'n_g3', delay: 200 }, { noteId: 'n_a3', delay: 200 }, { noteId: 'n_d3', delay: 800 },
    ]
  }
};

interface SoundPreset {
  name: string;
  density: number;
  icon: React.ReactNode;
  ambience: Partial<Record<AmbienceType, boolean>>;
  distant: number;
  eaves: number;
  landscape: number;
  effect: PresetEffect;
  isPremium?: boolean;
}

const SOUND_PRESETS: Record<string, SoundPreset> = {
  fox: {
    name: '狐の嫁入り',
    density: 0.15,
    icon: <CloudSun size={14} />,
    ambience: { rain: true, birds: true, windChime: true, thunder: true, wind: false, smallBirds: false, river: false, crickets: false, honeybee: false, suikinkutsu: false },
    distant: 0.9, eaves: 0.1, landscape: 0.3, effect: 'fox'
  },
  shower: {
    name: '花時雨',
    density: 0.4,
    icon: <CloudRain size={14} />,
    ambience: { rain: true, smallBirds: true, river: true, suikinkutsu: true, birds: false, wind: false, crickets: false, windChime: false, thunder: false, honeybee: false },
    distant: 0.7, eaves: 0.3, landscape: 0.5, effect: 'shower',
    isPremium: true
  },
  scatter: {
    name: '花散らし',
    density: 0.6,
    icon: <WindIcon size={14} />,
    ambience: { rain: true, wind: true, windChime: true, thunder: true, river: false, honeybee: false, birds: false, smallBirds: false, crickets: false, suikinkutsu: false },
    distant: 0.5, eaves: 0.5, landscape: 0.6, effect: 'blizzard',
    isPremium: true
  },
  storm: {
    name: '春の嵐',
    density: 0.9,
    icon: <CloudLightning size={14} />,
    ambience: { rain: true, wind: true, river: true, crickets: true, suikinkutsu: true, birds: false, smallBirds: false, honeybee: false, windChime: false, thunder: false },
    distant: 0.6, eaves: 0.7, landscape: 0.4, effect: 'storm',
    isPremium: false
  }
};

const SOUND_LABELS: Record<SoundType, string> = {
  Suikin: '水琴',
  Bamboo: '竹',
  Crystal: '水晶',
  MusicBox: 'オルゴール',
  Ether: '空',
  Deep: '深響'
};

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hasStarted, setHasStarted] = useState(false);
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<NoteParticle[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const [showMixer, setShowMixer] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showEisho, setShowEisho] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<'success' | 'canceled' | 'failed' | null>(null);

  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('sakura_ame_premium') === 'true';
  });

  const [activeNote, setActiveNote] = useState<string | null>(null);

  const [masterVolume, setMasterVolume] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_masterVolume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [distantRainVol, setDistantRainVol] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_distantRainVol');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [eavesRainVol, setEavesRainVol] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_eavesRainVol');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [landscapeVol, setLandscapeVol] = useState(() => {
    const saved = localStorage.getItem('sakura_ame_landscapeVol');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [rainDensity, setRainDensity] = useState<number>(() => {
    const saved = localStorage.getItem('sakura_ame_rainDensity');
    return saved !== null ? parseFloat(saved) : 0.15;
  });

  const [currentSoundType, setCurrentSoundType] = useState<SoundType>(() => {
    const saved = localStorage.getItem('sakura_ame_soundType');
    return (saved as SoundType) || 'Suikin';
  });

  const currentSoundTypeRef = useRef<SoundType>(currentSoundType);
  const [activeEffect, setActiveEffect] = useState<PresetEffect>('none');
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedId = localStorage.getItem('sakura_ame_themeId');
    return THEMES.find(t => t.id === savedId) || THEMES[0];
  });

  const [timerTotal, setTimerTotal] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isShishiodoshiTilting, setIsShishiodoshiTilting] = useState(false);

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentSongKey, setCurrentSongKey] = useState<string>('sakura');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const autoPlayTimeoutRef = useRef<number | null>(null);

  const [ambience, setAmbience] = useState<Record<AmbienceType, AmbienceConfig>>(() => {
    const saved = localStorage.getItem('sakura_ame_ambience');
    const defaultAmbience = {
      rain: { active: true, volume: 0.3 },
      wind: { active: false, volume: 0.3 },
      birds: { active: false, volume: 0.3 },
      smallBirds: { active: false, volume: 0.3 },
      river: { active: false, volume: 0.4 },
      crickets: { active: false, volume: 0.2 },
      windChime: { active: false, volume: 0.2, isPremium: true },
      honeybee: { active: false, volume: 0.4, isPremium: true },
      thunder: { active: false, volume: 0.3, isPremium: true },
      suikinkutsu: { active: false, volume: 0.4, isPremium: true },
    };
    return saved ? JSON.parse(saved) : defaultAmbience;
  });

  const requestRef = useRef<number>(null);

  useEffect(() => {
    localStorage.setItem('sakura_ame_masterVolume', masterVolume.toString());
    localStorage.setItem('sakura_ame_distantRainVol', distantRainVol.toString());
    localStorage.setItem('sakura_ame_eavesRainVol', eavesRainVol.toString());
    localStorage.setItem('sakura_ame_landscapeVol', landscapeVol.toString());
    localStorage.setItem('sakura_ame_rainDensity', rainDensity.toString());
    localStorage.setItem('sakura_ame_soundType', currentSoundType);
    localStorage.setItem('sakura_ame_themeId', currentTheme.id);
    localStorage.setItem('sakura_ame_ambience', JSON.stringify(ambience));
  }, [masterVolume, distantRainVol, eavesRainVol, landscapeVol, rainDensity, currentSoundType, currentTheme, ambience]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        setDrops([]);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    currentSoundTypeRef.current = currentSoundType;
  }, [currentSoundType]);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let interval: number;
    if (timerRemaining !== null && timerRemaining > 0) {
      interval = window.setInterval(() => {
        setTimerRemaining(prev => {
          if (prev === null) return null;
          if (prev === 16) audioEngine.fadeOutMaster(15);
          if (prev <= 1) {
            finishTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRemaining]);

  // プレロード（事前読み込み）の処理
  useEffect(() => {
    const imagesToPreload = [
      'bg-start.webp',
      // t => t.bgImage と記述して、リスト内の各要素を正しく参照します
      ...THEMES.map(t => t.bgImage),
      ...THEMES.map(t => t.bgImage2x)
    ].filter(src => typeof src === 'string'); // 念のため、空の要素を除外するガードを入れるとより安全です

    imagesToPreload.forEach((src) => {
      const img = new Image();
    // ここで src が undefined にならないよう徹底
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  const finishTimer = () => {
    setTimerRemaining(0);
    setDrops([]);
    setIsAutoPlaying(false);
    setIsShishiodoshiTilting(true);
    setTimeout(() => {
      setIsShishiodoshiTilting(false);
      audioEngine.playShishiodoshi();
      audioEngine.playTempleBell();
      triggerVisualRipple(dimensions.width / 2, dimensions.height / 2, '#fff', 300);
    }, 1500);

    setTimeout(() => {
      setIsTimerFinished(true);
      setTimerTotal(null);
      setTimerRemaining(null);
    }, 15000);
  };

  const startExperience = async () => {
    audioEngine.init();
    await audioEngine.resume();
    (Object.keys(ambience) as AmbienceType[]).forEach((type) => {
      audioEngine.setAmbience(type, ambience[type].active, ambience[type].volume);
    });
    audioEngine.setLayerVolume('distantRain', distantRainVol);
    audioEngine.setLayerVolume('eavesRain', eavesRainVol);
    audioEngine.setLayerVolume('landscape', landscapeVol);
    audioEngine.setMasterVolume(masterVolume);
    setHasStarted(true);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMasterVolume(nextMute ? 0 : masterVolume);
  };

  const toggleAmbience = (type: AmbienceType) => {
    if (ambience[type].isPremium && !isPremium) {
      setShowPremiumModal(true);
      closePopups();
      return;
    }
    const nextActive = !ambience[type].active;
    const nextAmbience = {
      ...ambience,
      [type]: { ...ambience[type], active: nextActive }
    };
    setAmbience(nextAmbience);
    audioEngine.setAmbience(type, nextActive, ambience[type].volume);
  };

  const applySoundPreset = (key: string) => {
    const preset = SOUND_PRESETS[key];
    if (!preset) return;

    if (preset.isPremium && !isPremium) {
      setShowPremiumModal(true);
      closePopups();
      return;
    }

    const newAmbience = { ...ambience };
    (Object.keys(newAmbience) as AmbienceType[]).forEach(type => {
      const isActive = preset.ambience[type] ?? false;
      if (newAmbience[type].isPremium && !isPremium && isActive) {
        newAmbience[type].active = false;
      } else {
        newAmbience[type].active = isActive;
      }
      audioEngine.setAmbience(type, newAmbience[type].active, newAmbience[type].volume);
    });

    setAmbience(newAmbience);
    setRainDensity(preset.density);

    setDistantRainVol(preset.distant);
    setEavesRainVol(preset.eaves);
    setLandscapeVol(preset.landscape);
    setActiveEffect(preset.effect);

    audioEngine.setLayerVolume('distantRain', preset.distant);
    audioEngine.setLayerVolume('eavesRain', preset.eaves);
    audioEngine.setLayerVolume('landscape', preset.landscape);

    triggerVisualRipple(dimensions.width / 2, dimensions.height - 100, currentTheme.accentColor, 100);
  };

  const selectSong = (key: string) => {
    const song = SONGS[key];
    if (song.isPremium && !isPremium) {
      setShowPremiumModal(true);
      closePopups();
      return;
    }
    setCurrentSongKey(key);
    setCurrentStepIndex(0);
    setIsAutoPlaying(true);
    closePopups();
  };

  const selectTheme = (theme: Theme) => {
    if (theme.isPremium && !isPremium) {
      setShowPremiumModal(true);
      closePopups();
      return;
    }
    setCurrentTheme(theme);
    closePopups();
  };

  const selectInstrument = (type: SoundType) => {
    setCurrentSoundType(type);
    closePopups();
  };

  const handlePurchase = () => {
    setIsPremium(true);
    localStorage.setItem('sakura_ame_premium', 'true');
    setShowPremiumModal(false);

    setTimeout(() => {
      setPurchaseStatus('success');
      triggerVisualRipple(dimensions.width / 2, dimensions.height / 2, '#FFD700', 300);
      setTimeout(() => setPurchaseStatus(null), 3000);
    }, 800);
  };

  const handleCancelPurchase = () => {
    setShowPremiumModal(false);
    setPurchaseStatus('canceled');
    setTimeout(() => setPurchaseStatus(null), 3000);
  };

  // 波紋を生成する関数
  const triggerVisualRipple = (x: number, y: number, color: string, startSize: number = 10) => {
    const newRipple: Ripple = {
      id: Math.random().toString(36),
      x,
      y,
      size: startSize,
      opacity: 0.8,
      color: color
    };
    setRipples(prev => [...prev, newRipple]);
  };

  const handleHit = useCallback((noteId: string, x: number, y: number) => {
    const note = NOTES.find(n => n.id === noteId);
    if (note && !isMuted) {
      audioEngine.playTone(note.frequency, currentSoundTypeRef.current);

      const burst: NoteParticle[] = [];
      const pCount = activeEffect === 'blizzard' ? 12 : 6;
      for (let i = 0; i < pCount; i++) {
        burst.push({
          id: Math.random().toString(36),
          x: x,
          y: y,
          rotation: Math.random() * Math.PI * 2,
          opacity: 1,
          velocity: {
            x: (Math.random() - 0.5) * (activeEffect === 'blizzard' ? 8 : 4),
            y: -1.5 - Math.random() * (activeEffect === 'blizzard' ? 4 : 2)
          },
          color: currentTheme.particleColor,
          size: 6 + Math.random() * 8
        });
      }
      setParticles(prev => [...prev, ...burst]);
    } // 👈 if文の終わり
    
      triggerVisualRipple(x, y, currentTheme.accentColor, 10); // 👈 ここを安全にコメントアウト
  }, [isMuted, currentTheme, activeEffect]); // 👈 464行目：ここが正しく閉じていればビルドが通ります

  const spawnDrop = (noteId: string) => {
    if (isTimerFinished || document.hidden) return;
    setActiveNote(noteId);
    setTimeout(() => setActiveNote(null), 300);
    const note = NOTES.find(n => n.id === noteId);
    if (!note) return;
    const startX = (dimensions.width * note.cloudLeft) / 100 + (Math.random() * 40 - 20);
    const targetY = (dimensions.height * PAD_Y_PERCENT) / 100;

    const baseSpeed = activeEffect === 'storm' ? GRAVITY_SPEED + 6 : GRAVITY_SPEED;

    setDrops(prev => [...prev, {
      id: Math.random().toString(36),
      noteId: note.id,
      x: startX,
      y: -50,
      speed: baseSpeed + (Math.random() * 4),
      targetY: targetY,
      hasHit: false,
      opacity: 0.6 + Math.random() * 0.4
    }]);
  };

  useEffect(() => {
    if (!isAutoPlaying || isTimerFinished) {
      if (autoPlayTimeoutRef.current) {
        window.clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = null;
      }
      return;
    }
    const song = SONGS[currentSongKey];
    if (!song) return;
    const step = song.steps[currentStepIndex];
    if (!document.hidden) {
      spawnDrop(step.noteId);
    }
    autoPlayTimeoutRef.current = window.setTimeout(() => {
      if (isAutoPlaying) {
        setCurrentStepIndex(prev => (prev + 1) % song.steps.length);
      }
    }, step.delay);
    return () => {
      if (autoPlayTimeoutRef.current) {
        window.clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [isAutoPlaying, currentSongKey, currentStepIndex, isTimerFinished, activeEffect]);

  const animate = (time: number) => {
    if (isTimerFinished || document.hidden) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    setDrops(prevDrops => {
      const nextDrops: RainDrop[] = [];
      prevDrops.forEach(drop => {
        const newY = drop.y + drop.speed;
        if (!drop.hasHit && newY >= drop.targetY) {
          handleHit(drop.noteId, drop.x, drop.targetY);
        } else if (!drop.hasHit && newY < dimensions.height) {
          nextDrops.push({ ...drop, y: newY });
        }
      });
      return nextDrops;
    });
    setRipples(prevRipples => prevRipples.map(r => ({
      ...r, size: r.size + (r.size > 50 ? 1.5 : 1.2),
      opacity: r.opacity - 0.006
    })).filter(r => r.opacity > 0));
    setParticles(prev => {
      // 1. パーティクル数が多い場合、計算をスキップするか間引く（上限の厳格化）
      const MAX_PARTICLES = activeEffect === 'blizzard' ? 60 : 40; // 100個から削減
  
      const next = prev
        .slice(-MAX_PARTICLES) // 古いものを先に捨てて計算対象を絞る
        .map(p => ({
          ...p,
          x: p.x + p.velocity.x,
          y: p.y + p.velocity.y + (activeEffect === 'blizzard' ? 0.05 : 0.15),
          rotation: p.rotation + 0.02,
          opacity: p.opacity - (activeEffect === 'blizzard' ? 0.006 : 0.012) // 消える速度を少し速める
        }))
        .filter(p => p.opacity > 0 && p.x < dimensions.width + 50); // 画面外（右）に出た判定も追加 

      if (activeEffect === 'blizzard' && Math.random() > 0.96 && next.length < MAX_PARTICLES) {
        next.push({
          id: Math.random().toString(36),
          x: -20,
          y: Math.random() * dimensions.height,
          rotation: Math.random() * Math.PI,
          opacity: 1,
          velocity: { x: 2 + Math.random() * 2, y: -0.3 + Math.random() * 0.6 },
          color: currentTheme.particleColor,
          size: 6 + Math.random() * 6 // 少しサイズを小さくして描画負荷を軽減
        });
      }
      return next;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (hasStarted) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }
  }, [hasStarted, dimensions, activeEffect]);

  useEffect(() => {
    if (!hasStarted || isTimerFinished || rainDensity === 0 || isAutoPlaying) return;
    const intervalTime = Math.max(250, 2200 - (rainDensity * 1800));
    const timer = setInterval(() => {
      if (document.hidden) return;
      const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)];
      spawnDrop(randomNote.id);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [hasStarted, isTimerFinished, rainDensity, isAutoPlaying, activeEffect]);

  const closePopups = () => {
    setShowMixer(false);
    setShowThemes(false);
    setShowTimer(false);
    setShowInstruments(false);
    setShowEisho(false);
    setShowPremiumModal(false);
  };

  const resetExperience = () => {
    setIsTimerFinished(false);
    setTimerRemaining(null);
    setTimerTotal(null);
    setIsAutoPlaying(false);
    setActiveEffect('none');
    audioEngine.setMasterVolume(masterVolume);
    setDrops([]);
    setParticles([]);
    setRipples([]);
  };

  if (!hasStarted) {
  return (
    <div
      className="fixed inset-0 h-[100svh] w-full overflow-hidden cursor-pointerbg-[#1c1917] flex flex-col items-center justify-center"
      onClick={startExperience}
    >
      {/* 背景レイヤー */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
  src="bg-start.webp"
  srcSet="bg-start.webp 1x, bg-start@2x.webp 2x"
  sizes="100vw"
  alt="Spring garden background"
  fetchpriority="high"
  decoding="sync"
  loading="eager"
  className="
    absolute inset-0
    w-full h-[100svh]
    object-cover
    sm:blur-[2px]
  "
/>

        <div className="absolute inset-0 z-10 bg-black/20" />
      </div>

      {/* UIレイヤー */}
      <div className="relative z-10 h-full w-full flex items-center justify-center text-sakura-100">
        <div className="text-center space-y-8 p-12 max-w-lg bg-stone-950/50 sm:backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] animate-ripple-in">
          <h1 className="text-8xl sm:text-7xl font-serif tracking-[0.4em] text-white mb-2">
            桜雨
          </h1>
          <h2 className="text-xl tracking-[0.3em] text-sakura-100/90 uppercase">
            Sakura Ame
          </h2>
          <div className="w-24 h-[1.5px] bg-white/40 mx-auto my-6" />
          <p className="text-sm italic tracking-widest">
            Gentle Rain Instrument
          </p>
          <div className="mt-8 px-14 py-4 border border-white/30 bg-white/5 rounded-full text-xs font-bold tracking-[0.4em] uppercase">
            Start Experience
          </div>
        </div>
      </div>
    </div>
  );
}



  const isMobile = dimensions.width < 640;
  const drumSize = isMobile ? Math.min(dimensions.width * 0.35, dimensions.height * 0.25) : Math.min(dimensions.width * 0.4, dimensions.height * 0.35);

  return (
    <div className={`relative h-[100svh] w-full bg-stone-950 overflow-hidden font-serif select-none transition-colors duration-1000 grain ${activeEffect === 'storm' ? 'animate-pulse-slow' : ''}`} onMouseDown={() => audioEngine.resume()} onTouchStart={() => audioEngine.resume()}>
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {THEMES.map((theme) => (
          <div key={theme.id} className={`absolute inset-0 transition-opacity duration-[1500ms] pointer-events-none ${currentTheme.id === theme.id ? 'opacity-100' : 'opacity-0'}`}>
            <img
  src={theme.bgImage}
  srcSet={`${theme.bgImage} 1200w, ${theme.bgImage2x} 2400w`}
  sizes="100vw"
  // 明示的なサイズ指定（CLS対策）
  width="1200"
  height="800"
  // CSSでアスペクト比を維持
  style={{ aspectRatio: '3 / 2' }} // 1200:800 = 3:2
  className="w-full h-full object-cover scale-[1.02]"
  alt=""
  decoding="async"
  loading={currentTheme.id === theme.id ? "eager" : "lazy"} 
  fetchpriority={currentTheme.id === theme.id ? "high" : "low"}
/>

            <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} opacity-20`}></div>
            <div className="absolute inset-0" style={{ backgroundColor: theme.overlayColor }}></div>
          </div>
        ))}
      </div>
      <SakuraVisualizer
        drops={drops}
        ripples={ripples}
        particles={particles}
        width={dimensions.width}
        height={dimensions.height}
        theme={currentTheme}
        activeEffect={activeEffect}
      />

      {isTimerFinished && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-1000">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out"></div>
            <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out delay-700"></div>
            <div className="w-96 h-96 rounded-full border border-white/10 animate-ripple-out delay-1000"></div>
          </div>
          <div className="text-center space-y-6 relative z-10">
            <h2 className="text-6xl text-white font-serif tracking-[0.6em] drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-pulse">静寂</h2>
            <p className="text-stone-400 tracking-widest text-xs uppercase">Silence dwells within the ripple.</p>
            <button onClick={resetExperience} className="mt-12 px-12 py-4 border border-white/20 rounded-full text-white hover:text-white hover:border-white hover:bg-white/5 transition-all text-[10px] uppercase tracking-[0.3em] bg-white/5 backdrop-blur-md shadow-3xl">Return to Garden</button>
          </div>
        </div>
      )}

      {!isPremium && (
        <div className="absolute top-8 left-8 z-40">
          <button onClick={() => setShowPremiumModal(true)} className="flex items-center gap-2 px-6 py-2 bg-sakura-500/20 hover:bg-sakura-500/40 text-sakura-100 border border-sakura-400/30 rounded-full transition-all duration-700 ease-wa-ease  /* 👈 ここで統一感のある動きを適用 */backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.1)] animate-pulse-slow">
            <Flower size={14} className="text-sakura-200" /><span>Unlock Full Garden</span>
          </button>
        </div>
      )}

      <div className="absolute top-8 right-8 z-40 flex flex-col gap-4">
        <div className="bg-black/5 backdrop-blur-3xl p-2 rounded-full border border-white/10 flex flex-col items-center gap-3 transition-all hover:bg-black/15 shadow-2xl">
          <button onClick={toggleMute} className={`p-3 rounded-full transition-all ${isMuted ? 'text-red-400' : 'text-white hover:scale-110'}`}>{isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
          <div className="w-8 h-[1px] bg-white/10"></div>
          <button onClick={() => { closePopups(); setShowTimer(!showTimer); }} className={`p-3 rounded-full transition-all ${timerRemaining !== null ? 'text-sakura-300 scale-110' : 'text-white hover:scale-110'}`}><Hourglass size={22} /></button>
        </div>
      </div>

      <div className="absolute bottom-12 left-8 z-40 flex flex-col gap-5">
        <button onClick={() => { closePopups(); setShowThemes(!showThemes); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${showThemes ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}><Layers size={24} /></button>
        <button onClick={() => { closePopups(); setShowMixer(!showMixer); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${showMixer ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}><Sliders size={24} /></button>
        <button onClick={() => { closePopups(); setShowInstruments(!showInstruments); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${showInstruments ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}><Music size={24} /></button>
      </div>

      <div className="absolute bottom-12 right-8 z-40 flex flex-col items-end gap-5">
        {showEisho && (
          <div className="mb-2 bg-stone-950/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 w-56 animate-in slide-in-from-right-4 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h3 className="text-white font-serif text-[10px] tracking-[0.3em] uppercase font-bold">詠唱選択</h3>
              <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-1">
              {Object.entries(SONGS).map(([key, song]) => (
                <button key={key} onClick={() => { selectSong(key); setShowEisho(false); }} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-[10px] tracking-widest uppercase transition-all ${currentSongKey === key && isAutoPlaying ? 'bg-sakura-500/40 text-sakura-100 border border-sakura-300/30' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                  <span className="flex items-center gap-2">{song.name}{song.isPremium && !isPremium && <Lock size={12} className="text-amber-400" />}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => { if (isAutoPlaying) setIsAutoPlaying(false); else { closePopups(); setShowEisho(!showEisho); } }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-2xl ${isAutoPlaying ? 'bg-sakura-500/30 border-sakura-400 text-sakura-100 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-pulse' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}>{isAutoPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
      </div>

      {showMixer && (
        <div className="absolute bottom-36 left-4 sm:left-8 w-80 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in slide-in-from-bottom-4 overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">庭園の調べ</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">基本調整</h4>
              <LayerSlider label="雨の密度" icon={<CloudRain size={12} />} value={rainDensity} accent="accent-sakura-400" onChange={(v) => setRainDensity(v)} />
              <LayerSlider label="全体の響き" icon={<Volume2 size={12} />} value={masterVolume} accent="accent-white" onChange={(v) => { setMasterVolume(v); audioEngine.setMasterVolume(v); }} />
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">音響レイヤー</h4>
              <LayerSlider label="背景の雨" icon={<CloudRain size={12} />} value={distantRainVol} accent="accent-sakura-300" onChange={(v) => { setDistantRainVol(v); audioEngine.setLayerVolume('distantRain', v); }} />
              <LayerSlider label="軒先の雨" icon={<Droplets size={12} />} value={eavesRainVol} accent="accent-indigo-300" onChange={(v) => { setEavesRainVol(v); audioEngine.setLayerVolume('eavesRain', v); }} />
              <LayerSlider label="自然の気配" icon={<Bird size={12} />} value={landscapeVol} accent="accent-emerald-300" onChange={(v) => { setLandscapeVol(v); audioEngine.setLayerVolume('landscape', v); }} />
            </div>

            <div className="w-full h-[1px] bg-white/10 my-2"></div>
            <div className="space-y-3">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">情景プリセット</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SOUND_PRESETS).map(([key, preset]) => (
                  <button key={key} onClick={() => applySoundPreset(key)} className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-[10px] transition-all uppercase tracking-widest font-bold ${activeEffect === preset.effect && preset.effect !== 'none' ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/30 border-white/5 text-stone-200 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2 truncate">
                      {preset.icon} <span className="truncate">{preset.name}</span>
                    </div>
                    {preset.isPremium && !isPremium && <Lock size={12} className="text-amber-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-[1px] bg-white/10 my-2"></div>
            <div className="space-y-4">
              <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">自然の気配 構成</h4>
              <div className="grid grid-cols-2 gap-2">
                <AmbienceToggle label="鶯" type="birds" icon={<Bird size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="小鳥" type="smallBirds" icon={<Bird size={14} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="春風" type="wind" icon={<Wind size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="せせらぎ" type="river" icon={<Waves size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="鈴虫" type="crickets" icon={<Bug size={16} />} ambience={ambience} toggle={toggleAmbience} />
                <AmbienceToggle label="風鈴" type="windChime" icon={<Bell size={16} />} ambience={ambience} toggle={toggleAmbience} isLocked={!isPremium} />
                <AmbienceToggle label="寺鐘" type="thunder" icon={<Bell size={16} />} ambience={ambience} toggle={toggleAmbience} isLocked={!isPremium} />
                <AmbienceToggle label="水琴窟" type="suikinkutsu" icon={<Droplets size={16} />} ambience={ambience} toggle={toggleAmbience} isLocked={!isPremium} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Drum UI */}
      <div className="absolute w-full h-full pointer-events-none z-30 animate-wa-float">
        <div className="absolute" style={{ left: '32%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
          <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl" style={{ backgroundColor: currentTheme.drumColor }}></div>
          {NOTES.filter(n => n.drumIndex === 0).map((note) => (<DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />))}
        </div>
        <div className="absolute" style={{ left: '68%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
          <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl" style={{ backgroundColor: currentTheme.drumColor }}></div>
          {NOTES.filter(n => n.drumIndex === 1).map((note) => (<DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />))}
        </div>
      </div>

      {showTimer && (
        <div className="absolute top-24 right-4 sm:right-24 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">Zen Meditation</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-3">
            {SHISHIODOSHI_PRESETS.map((preset) => (
              <button key={preset.label}
                onClick={() => {
                  if (preset.minutes > 15 && !isPremium) {
                    setShowPremiumModal(true);
                    closePopups();
                    return;
                  }
                  setTimerTotal(preset.minutes * 60);
                  setTimerRemaining(preset.minutes * 60);
                  setIsTimerFinished(false);
                  closePopups();
                }}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-black/40 hover:bg-black/60 transition-all shadow-xl">
                <span className="text-sm font-serif text-stone-100 flex items-center gap-2">
                  {preset.label}
                  {preset.isPremium && !isPremium && <Lock size={12} className="text-amber-400" />}
                </span>
                <span className="text-2xl opacity-60">{preset.icon}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showThemes && (
        <div className="absolute bottom-36 left-4 sm:left-8 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">背景切替</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-2 mt-4">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => selectTheme(t)} className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-serif transition-all flex items-center justify-between ${currentTheme.id === t.id ? 'bg-sakura-900/50 text-sakura-100' : 'text-stone-100 hover:bg-white/10'}`}>
                <span>{t.name}</span>{t.isPremium && !isPremium && <Lock size={12} className="text-yellow-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInstruments && (
        <div className="absolute bottom-36 left-4 sm:left-8 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 animate-in slide-in-from-bottom-4 shadow-3xl">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold">音色選択</h3>
            <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(['Suikin', 'Bamboo', 'Crystal', 'MusicBox', 'Ether', 'Deep'] as SoundType[]).map(type => {
              const premiumInstruments: string[] = ['Crystal', 'Ether', 'Deep'];
              const isLocked = premiumInstruments.includes(type) && !isPremium;
              return (
                <button key={type} onClick={() => { if (!isLocked) { selectInstrument(type); } else { setShowPremiumModal(true); closePopups(); } }} className={`flex justify-between items-center px-4 py-3 rounded-xl text-[10px] tracking-widest uppercase transition-all border ${currentSoundType === type ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/20 border-white/5 text-stone-400 hover:text-white'}`}>
                  <span className="flex items-center gap-2">
                    {SOUND_LABELS[type]}
                    {isLocked && <Lock size={12} className="text-amber-400" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showPremiumModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-stone-900 border border-sakura-500/30 rounded-3xl p-10 max-w-sm w-full shadow-2xl relative overflow-hidden text-center space-y-6">
            <Flower size={32} className="text-sakura-400 mx-auto animate-pulse" />
            <h3 className="text-2xl font-serif text-white tracking-widest">静寂を深める</h3>
            <div className="space-y-1">
              <p className="text-stone-400 text-sm leading-relaxed">
                Unlock additional scenes, sounds, and melodies.<br />
                Deepen your time in the garden.<br />
                One gentle expansion, forever.
              </p>
              <p className="text-stone-300 text-xs font-serif italic tracking-[0.2em] mt-2">静けさを、もう少し。</p>
            </div>
            <button onClick={handlePurchase} className="w-full py-4 bg-gradient-to-r from-sakura-600 to-sakura-500 rounded-xl text-sakura-50 font-bold uppercase tracking-widest text-xs shadow-xl transition-transform hover:scale-105 active:scale-95">UNLOCK FULL GARDEN</button>
            <button onClick={handleCancelPurchase} className="text-stone-500 text-xs uppercase tracking-widest mt-2 block mx-auto hover:text-stone-300 transition-colors">STAY HERE FOR NOW</button>
          </div>
        </div>
      )}

      {purchaseStatus && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-1000">
          <div className="text-center space-y-4">
            {purchaseStatus === 'success' && (
              <>
                <p className="text-white text-xl font-light tracking-[0.3em]">The garden quietly deepens.</p>
                <p className="text-stone-400 text-sm font-serif tracking-[0.4em]">庭は、静かに深まりました。</p>
              </>
            )}
            {purchaseStatus === 'canceled' && (
              <>
                <p className="text-white text-xl font-light tracking-[0.3em]">The garden remains as it is.</p>
                <p className="text-stone-400 text-sm font-serif tracking-[0.4em]">庭は、そのままの姿で在ります。</p>
              </>
            )}
            {purchaseStatus === 'failed' && (
              <>
                <p className="text-white text-xl font-light tracking-[0.3em]">The wind disrupted the moment.</p>
                <p className="text-stone-400 text-sm font-serif tracking-[0.4em]">風が、ひとときを乱しました。</p>
              </>
            )}
          </div>
        </div>
      )}

      {timerRemaining !== null && !isTimerFinished && (
        <div className="absolute top-2 sm:top-12 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-2 sm:gap-8 scale-[0.4] sm:scale-100 origin-top transition-transform">
          <div className="relative">
            <div className={`relative w-14 h-64 transition-transform duration-[1500ms] ease-in-out origin-center ${isShishiodoshiTilting ? 'rotate-[110deg]' : 'rotate-0'}`}>
              <div className="absolute inset-0 rounded-full border-r border-white/10 border-b border-black/30 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden bg-gradient-to-r from-emerald-900/40 via-emerald-700/40 to-emerald-950/40 backdrop-blur-2xl">
                <div className="absolute bottom-0 left-0 w-full bg-sky-400/20 transition-all duration-1000 ease-linear" style={{ height: `${((timerTotal! - timerRemaining) / timerTotal!) * 100}%` }}></div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-2 bg-stone-800 rounded-full -z-10"></div>
            </div>
          </div>
          <div className="flex flex-col items-center mt-4">
            <span className="text-xl font-serif text-white tracking-[0.3em] bg-emerald-950/30 border border-white/10 px-10 py-3 rounded-full shadow-3xl backdrop-blur-3xl">{Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const AmbienceToggle: React.FC<{ label: string, type: AmbienceType, icon: React.ReactNode, ambience: any, toggle: (t: AmbienceType) => void, isLocked?: boolean }> = ({ label, type, icon, ambience, toggle, isLocked }) => (
  <button onClick={() => toggle(type)} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${ambience[type].active ? 'bg-sakura-900/40 border-sakura-500 text-sakura-100' : 'bg-black/20 border-white/5 text-stone-500'}`}>
    <div className="flex items-center gap-3">{icon}<span className="text-[10px] uppercase tracking-widest font-bold">{label}</span></div>
    {isLocked && ambience[type].isPremium && <Lock size={10} className="text-amber-400" />}
  </button>
);

const LayerSlider: React.FC<{ label: string, icon: React.ReactNode, value: number, accent: string, onChange: (v: number) => void }> = ({ label, icon, value, accent, onChange }) => (
  <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
    <div className="flex justify-between text-[10px] text-stone-300 font-bold uppercase tracking-widest">
      <span className="flex items-center gap-2">{icon} {label}</span>
      <span className={`px-2 rounded ${accent.replace('accent', 'bg')}/20 ${accent.replace('accent', 'text')}`}>{Math.round(value * 100)}%</span>
    </div>
    <input type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className={`w-full h-1.5 bg-black/60 rounded-full appearance-none ${accent}`} />
  </div>
);

const DrumButton: React.FC<{ note: Note, activeNote: string | null, spawnDrop: (id: string) => void }> = ({ note, activeNote, spawnDrop }) => {
  const isActive = activeNote === note.id;
  const petalPath = "M25 50 C 5 35, 0 10, 25 0 C 50 10, 45 35, 25 50";
  const angle = Math.atan2(note.top - 50, note.left - 50) + Math.PI / 2;
  return (
    <button onMouseDown={(e) => { e.stopPropagation(); spawnDrop(note.id); }} onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); spawnDrop(note.id); }} className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${note.left}%`, top: `${note.top}%` }}>
      <div className="w-16 h-16 md:w-20 md:h-20 transition-all duration-1000" style={{ transform: `rotate(${angle}rad)` }}>
        <div className={`w-full h-full ${isActive ? 'animate-bloom' : 'hover:scale-105 transition-transform duration-300'}`}>
          <svg viewBox="0 0 50 50" className="w-full h-full overflow-visible"><path d={petalPath} fill={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'} stroke={isActive ? '#fbcfe8' : 'rgba(255, 255, 255, 0.45)'} strokeWidth="1.0" /></svg>
        </div>
      </div>
    </button>
  );
};

export default App;
