
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Wind, 
  Bird, 
  Bug, 
  Settings, 
  Droplets, 
  Hourglass, 
  X,
  Sparkles,
  Music
} from 'lucide-react';
import { 
  Note, 
  RainDrop, 
  Ripple, 
  AmbienceType, 
  AmbienceConfig, 
  Theme, 
  NoteParticle,
  SoundType
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
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const [masterVolume, setMasterVolume] = useState(0.7);
  const [currentSoundType, setCurrentSoundType] = useState<SoundType>('Suikin');
  const currentSoundTypeRef = useRef<SoundType>('Suikin'); 
  
  const [timerTotal, setTimerTotal] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isShishiodoshiTilting, setIsShishiodoshiTilting] = useState(false);

  const [ambience, setAmbience] = useState<Record<AmbienceType, AmbienceConfig>>({
      rain: { active: true, volume: 0.3 }, 
      wind: { active: false, volume: 0.3 },
      birds: { active: false, volume: 0.3 },
      river: { active: false, volume: 0.4 },
      crickets: { active: false, volume: 0.2 },
  });

  const [rainDensity, setRainDensity] = useState<number>(0.15);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);

  const requestRef = useRef<number>(null);

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
                
                if (prev === 11) {
                  audioEngine.fadeOutMaster(10);
                }

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

  const triggerVisualRipple = (x: number, y: number, color: string, size: number = 20) => {
    setRipples(prev => [...prev, {
        id: Math.random().toString(36),
        x, y, size, opacity: 1.0,
        color
    }]);
  };

  const finishTimer = () => {
      setTimerRemaining(0);
      setDrops([]); 
      
      setIsShishiodoshiTilting(true);
      setTimeout(() => {
          setIsShishiodoshiTilting(false); 
          audioEngine.playShishiodoshi(); 
          triggerVisualRipple(dimensions.width / 2, dimensions.height * 0.25, '#fff', 50);
      }, 1500); 
      
      setTimeout(() => {
          setIsTimerFinished(true);
          setTimerTotal(null);
          setTimerRemaining(null);
      }, 6000);
  };

  const startExperience = async () => {
    audioEngine.init();
    await audioEngine.resume();
    (Object.keys(ambience) as AmbienceType[]).forEach((type) => {
        audioEngine.setAmbience(type, ambience[type].active, ambience[type].volume);
    });
    audioEngine.setMasterVolume(masterVolume);
    setHasStarted(true);
  };

  const handleInteraction = useCallback(async () => {
    await audioEngine.resume();
  }, []);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMasterVolume(nextMute ? 0 : masterVolume);
  };

  const updateAmbience = (type: AmbienceType, changes: Partial<AmbienceConfig>) => {
    setAmbience(prev => {
      const newConfig = { ...prev[type], ...changes };
      if (!isMuted) audioEngine.setAmbience(type, newConfig.active, newConfig.volume);
      return { ...prev, [type]: newConfig };
    });
  };

  const handleHit = useCallback((noteId: string, x: number, y: number) => {
    const note = NOTES.find(n => n.id === noteId);
    if (note && !isMuted) {
      audioEngine.playTone(note.frequency, currentSoundTypeRef.current);
      
      const burst: NoteParticle[] = [];
      for (let i = 0; i < 5; i++) {
        burst.push({
          id: Math.random().toString(36),
          x: x,
          y: y,
          rotation: Math.random() * Math.PI * 2,
          opacity: 1,
          velocity: {
              x: (Math.random() - 0.5) * 2,
              y: -1 - Math.random()
          },
          color: currentTheme.particleColor,
          size: 8 + Math.random() * 8
        });
      }
      setParticles(prev => [...prev, ...burst]);
    }

    triggerVisualRipple(x, y, currentTheme.accentColor, 10);
  }, [isMuted, currentTheme]); 

  const spawnDrop = (noteId: string) => {
    if (isTimerFinished) return;
    setActiveNote(noteId);
    setTimeout(() => setActiveNote(null), 150);

    const note = NOTES.find(n => n.id === noteId);
    if (!note) return;

    const startX = (dimensions.width * note.cloudLeft) / 100 + (Math.random() * 40 - 20);
    const targetY = (dimensions.height * PAD_Y_PERCENT) / 100;

    setDrops(prev => [...prev, {
      id: Math.random().toString(36),
      noteId: note.id,
      x: startX,
      y: -50,
      speed: GRAVITY_SPEED + (Math.random() * 4),
      targetY: targetY,
      hasHit: false,
      opacity: 0.6 + Math.random() * 0.4
    }]);
  };

  const animate = (time: number) => {
    if (isTimerFinished) return; 

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
        ...r, size: r.size + (r.size > 30 ? 0.8 : 0.5), opacity: r.opacity - (r.size > 30 ? 0.01 : 0.02)
    })).filter(r => r.opacity > 0));

    setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.velocity.x + Math.sin(time / 500) * 0.5,
        y: p.y + p.velocity.y + 0.5,
        rotation: p.rotation + 0.02,
        opacity: p.opacity - 0.01
    })).filter(p => p.opacity > 0));

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (hasStarted && !isTimerFinished) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }
  }, [hasStarted, isTimerFinished, dimensions, currentTheme]);

  useEffect(() => {
    if (!hasStarted || isTimerFinished || rainDensity === 0) return;
    const intervalTime = Math.max(150, 2000 - (rainDensity * 1800));
    const timer = setInterval(() => {
      if (document.hidden) return;
      const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)];
      spawnDrop(randomNote.id);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [hasStarted, isTimerFinished, rainDensity]);

  const closePopups = () => {
      setShowMixer(false);
      setShowThemes(false);
      setShowTimer(false);
      setShowInstruments(false);
  };

  const resetExperience = () => {
      setIsTimerFinished(false);
      setTimerRemaining(null);
      setTimerTotal(null);
      audioEngine.setMasterVolume(masterVolume);
      setDrops([]);
      setParticles([]);
      setRipples([]);
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-stone-950 text-sakura-100 relative overflow-hidden" onClick={startExperience}>
        <div className="absolute inset-0 z-0 opacity-100 transition-all duration-1000">
          <img 
            src="https://raw.githubusercontent.com/madobeno/SAKURA-AME/main/public/%E5%A4%95%E6%A1%9C.jpg" 
            className="w-full h-full object-cover" 
            alt="Evening Sakura"
          />
        </div>
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="z-10 text-center space-y-8 p-12 max-w-lg bg-stone-950/20 backdrop-blur-xl rounded-3xl border border-white/5 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] mx-4 animate-ripple-in">
          <h1 className="text-8xl font-serif tracking-[0.4em] text-white mb-2 drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)]">桜雨</h1>
          <h2 className="text-xl font-light tracking-[0.3em] text-sakura-100/90 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">Sakura Ame</h2>
          <div className="w-24 h-[1.5px] bg-white/40 mx-auto my-6 shadow-2xl"></div>
          <p className="text-sm font-serif text-white/80 italic drop-shadow-lg tracking-widest">Zen garden with RainDrum.</p>
          <div className="mt-8 p-4 px-14 border border-white/30 bg-white/5 rounded-full text-xs text-white hover:bg-white/10 hover:border-white/50 transition-all cursor-pointer backdrop-blur-md shadow-2xl font-bold tracking-[0.4em] uppercase">
            Start Experience
          </div>
        </div>
      </div>
    );
  }

  const isMobile = dimensions.width < 640;
  const drumSize = isMobile 
    ? Math.min(dimensions.width * 0.35, dimensions.height * 0.25) 
    : Math.min(dimensions.width * 0.4, dimensions.height * 0.35);

  return (
    <div className={`relative h-screen w-full bg-stone-950 overflow-hidden font-serif select-none transition-colors duration-1000`} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
      {/* 安定した背景表示のためのレイヤー構成 */}
      <div key={currentTheme.bgImage} className={`absolute inset-0 opacity-100 pointer-events-none transition-opacity duration-1000 z-0 bg-gradient-to-b ${currentTheme.bgGradient}`}>
         <img 
            src={currentTheme.bgImage} 
            className="w-full h-full object-cover transition-opacity duration-1000" 
            alt={currentTheme.name}
            onError={(e) => {
              // 読み込み失敗時に透明にして背景グラデーションを見せる
              (e.target as HTMLImageElement).style.opacity = '0';
            }}
         />
      </div>
      <div className="absolute inset-0 bg-black/15 pointer-events-none z-10"></div>
      
      <SakuraVisualizer drops={drops} ripples={ripples} particles={particles} width={dimensions.width} height={dimensions.height} theme={currentTheme} />

      {isTimerFinished && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-1000">
              <div className="text-center space-y-6">
                  <div className="text-7xl animate-bounce">🎋</div>
                  <h2 className="text-4xl text-white font-serif tracking-[0.5em] drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">静寂</h2>
                  <p className="text-stone-400 tracking-widest text-xs uppercase">The silence follows the rain.</p>
                  <button onClick={resetExperience} className="mt-8 px-12 py-4 border border-white/20 rounded-full text-white hover:text-white hover:border-white hover:bg-white/5 transition-all text-[10px] uppercase tracking-[0.3em] bg-white/5 backdrop-blur-md shadow-3xl">Return to Garden</button>
              </div>
          </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-8 right-8 z-40 flex flex-col gap-4">
          <div className="bg-black/5 backdrop-blur-3xl p-2 rounded-full border border-white/10 flex flex-col items-center gap-3 transition-all hover:bg-black/15 shadow-2xl">
            <button onClick={toggleMute} className={`p-3 rounded-full transition-all drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${isMuted ? 'text-red-400' : 'text-white hover:scale-110'}`}>
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
            <div className="w-8 h-[1px] bg-white/10"></div>
            <button onClick={() => { closePopups(); setShowTimer(!showTimer); }} className={`p-3 rounded-full transition-all drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${timerRemaining !== null ? 'text-sakura-300 scale-110' : 'text-white hover:scale-110'}`}>
                <Hourglass size={22} />
            </button>
          </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-12 left-8 z-40 flex flex-col gap-5">
          <button onClick={() => { closePopups(); setShowThemes(!showThemes); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] ${showThemes ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}>
             <Settings size={24} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </button>
          <button onClick={() => { closePopups(); setShowMixer(!showMixer); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] ${showMixer ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}>
             <Sliders size={24} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </button>
          <button onClick={() => { closePopups(); setShowInstruments(!showInstruments); }} className={`p-5 rounded-full border transition-all backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6)] ${showInstruments ? 'bg-sakura-900/50 border-sakura-500/50 text-sakura-200' : 'bg-black/5 border-white/10 text-white hover:bg-black/15'}`}>
             <Music size={24} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </button>
      </div>

      {/* Shishiodoshi HUD - Responsive scaling for mobile compatibility */}
      {timerRemaining !== null && !isTimerFinished && (
          <div className="absolute top-2 sm:top-12 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-2 sm:gap-8 scale-[0.4] sm:scale-100 origin-top transition-transform">
              <div className="relative">
                  {/* Water Trickle Flowing into the Shishiodoshi */}
                  <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[2px] h-32 bg-sky-200/40 blur-[1px] opacity-80 animate-pulse transition-opacity duration-1000 overflow-hidden">
                     <div className="w-full h-1/2 bg-sky-300/60 animate-bounce"></div>
                  </div>
                  
                  <div className={`relative w-16 h-56 transition-transform duration-[1500ms] ease-in-out origin-center ${isShishiodoshiTilting ? 'rotate-[115deg]' : 'rotate-0'}`}>
                      <div className="absolute inset-0 rounded-full border-2 border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.7)] overflow-hidden bg-gradient-to-b from-stone-900/30 via-stone-800/30 to-stone-950/30 backdrop-blur-2xl">
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-sakura-300/30 transition-all duration-1000 ease-linear shadow-[0_0_25px_rgba(249,168,212,0.5)]"
                            style={{ height: `${((timerTotal! - timerRemaining) / timerTotal!) * 100}%` }}
                          ></div>
                          {/* Inner water ripples */}
                          {timerRemaining % 2 === 0 && (
                            <div className="absolute left-0 w-full h-2 bg-white/10 blur-[2px] animate-pulse" style={{ bottom: `${((timerTotal! - timerRemaining) / timerTotal!) * 100}%` }}></div>
                          )}
                          <div className="absolute top-[25%] w-full h-[1px] bg-white/5"></div>
                          <div className="absolute top-[50%] w-full h-[1.5px] bg-white/10"></div>
                          <div className="absolute top-[75%] w-full h-[1px] bg-white/5"></div>
                      </div>
                  </div>
                  
                  {/* Pivot shadow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black/60 rounded-full -z-10 shadow-3xl blur-[5px]"></div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-serif text-white tracking-[0.3em] bg-black/30 border border-white/10 px-10 py-3 rounded-full shadow-3xl backdrop-blur-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    {Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}
                </span>
                <span className="text-[10px] mt-4 text-white/90 uppercase tracking-[0.5em] drop-shadow-[0_2px_5px_rgba(0,0,0,1)] font-bold">Shishiodoshi</span>
              </div>
          </div>
      )}

      {/* RainDrums Positioning */}
      <div className="absolute w-full h-full pointer-events-none z-30">
         <div className="absolute" style={{ left: '32%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
             <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl shadow-[0_0_200px_rgba(0,0,0,0.95)]" style={{ backgroundColor: currentTheme.drumColor }}></div>
             {NOTES.filter(n => n.drumIndex === 0).map((note) => (
                 <DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />
             ))}
         </div>
         <div className="absolute" style={{ left: '68%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
             <div className="absolute inset-0 rounded-full border border-white/10 backdrop-blur-2xl shadow-[0_0_200px_rgba(0,0,0,0.95)]" style={{ backgroundColor: currentTheme.drumColor }}></div>
             {NOTES.filter(n => n.drumIndex === 1).map((note) => (
                 <DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />
             ))}
         </div>
      </div>

      {showTimer && (
          <div className="absolute top-24 right-4 sm:right-24 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 shadow-[0_20px_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 ring-1 ring-white/5">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                  <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold drop-shadow-lg">Zen Meditation</h3>
                  <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                  {SHISHIODOSHI_PRESETS.map((preset) => (
                      <button 
                        key={preset.label}
                        onClick={() => {
                            setTimerTotal(preset.minutes * 60);
                            setTimerRemaining(preset.minutes * 60);
                            setIsTimerFinished(false);
                            closePopups();
                        }}
                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-black/40 hover:bg-black/60 border border-transparent hover:border-white/20 transition-all text-left group shadow-xl"
                      >
                          <span className="text-sm font-serif text-stone-100 group-hover:text-sakura-200 transition-colors drop-shadow-md">{preset.label}</span>
                          <span className="text-2xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-xl">{preset.icon}</span>
                      </button>
                  ))}
                  {timerRemaining !== null && (
                      <button onClick={() => { setTimerRemaining(null); setTimerTotal(null); closePopups(); }} className="w-full mt-6 py-3 text-[10px] uppercase font-bold text-red-400 hover:text-red-300 transition-colors drop-shadow-xl tracking-[0.3em]">Cancel Shishiodoshi</button>
                  )}
              </div>
          </div>
      )}

      {showThemes && (
          <div className="absolute bottom-36 left-4 sm:left-8 w-72 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 shadow-[0_20px_80px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 ring-1 ring-white/5">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold drop-shadow-lg">Atmosphere</h3>
                  <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-2">
                  {THEMES.map(t => (
                      <button key={t.id} onClick={() => { setCurrentTheme(t); closePopups(); }} className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-serif transition-all flex items-center justify-between shadow-lg ${currentTheme.id === t.id ? 'bg-sakura-900/50 text-sakura-100 border border-sakura-700/40' : 'text-stone-100 hover:text-white border border-transparent hover:bg-white/10'}`}>
                          <span className="drop-shadow-md">{t.name}</span>
                          {currentTheme.id === t.id && <Sparkles size={14} className="text-sakura-300 animate-pulse" />}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {showMixer && (
          <div className="absolute bottom-36 left-4 sm:left-8 w-80 bg-stone-950/10 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 z-50 shadow-[0_20px_80px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 ring-1 ring-white/5">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-white font-serif text-sm tracking-[0.3em] uppercase font-bold drop-shadow-lg">Garden Audio</h3>
                  <button onClick={closePopups} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-8">
                  <div className="space-y-4">
                      <div className="flex justify-between text-[11px] text-white font-bold uppercase tracking-widest drop-shadow-xl"><span>Volume</span><span>{Math.round(masterVolume * 100)}%</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={(e) => { setMasterVolume(parseFloat(e.target.value)); audioEngine.setMasterVolume(parseFloat(e.target.value)); }} className="w-full h-2 bg-black/60 rounded-full appearance-none accent-sakura-400 cursor-pointer shadow-inner" />
                  </div>
                   <div className="space-y-4">
                      <div className="flex justify-between text-[11px] text-white font-bold uppercase tracking-widest drop-shadow-xl"><span>Rain Density</span><span>{Math.round(rainDensity * 100)}%</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={rainDensity} onChange={(e) => setRainDensity(parseFloat(e.target.value))} className="w-full h-2 bg-black/60 rounded-full appearance-none accent-indigo-400 cursor-pointer shadow-inner" />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DrumButton: React.FC<{ note: Note, activeNote: string | null, spawnDrop: (id: string) => void }> = ({ note, activeNote, spawnDrop }) => {
    const isActive = activeNote === note.id;
    const petalPath = "M25 50 C 5 35, 0 10, 25 0 C 50 10, 45 35, 25 50";
    const dx = note.left - 50;
    const dy = note.top - 50;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;

    return (
        <button
            onMouseDown={(e) => { e.stopPropagation(); spawnDrop(note.id); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); spawnDrop(note.id); }}
            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 focus:outline-none group"
            style={{ left: `${note.left}%`, top: `${note.top}%` }}
        >
            <div 
                className={`w-16 h-16 md:w-20 md:h-20 transition-all duration-300 ease-out ${isActive ? 'scale-90 brightness-150' : 'hover:scale-115 hover:brightness-110'}`}
                style={{ 
                    transform: `rotate(${angle}rad)`,
                    filter: isActive ? 'drop-shadow(0 0 20px rgba(251, 207, 232, 1))' : 'drop-shadow(0 0 15px rgba(0,0,0,0.8))'
                }}
            >
                <svg viewBox="0 0 50 50" className="w-full h-full overflow-visible">
                    <path 
                        d={petalPath} 
                        fill={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.35)'}
                        stroke={isActive ? '#fbcfe8' : 'rgba(255, 255, 255, 0.55)'}
                        strokeWidth="1.2"
                    />
                </svg>
            </div>
        </button>
    );
};

export default App;
