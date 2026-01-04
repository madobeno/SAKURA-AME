
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Wind, 
  Bird, 
  Bug, 
  Settings, 
  RotateCcw, 
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
          // Trigger a massive ripple for the Shishiodoshi clack
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
      <div className="flex flex-col items-center justify-center h-screen w-full bg-stone-900 text-sakura-100 relative overflow-hidden" onClick={startExperience}>
        <div className="absolute inset-0 z-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center grayscale"></div>
        <div className="z-10 text-center space-y-8 p-12 max-w-lg bg-stone-900/80 backdrop-blur-md rounded-3xl border border-stone-700 shadow-2xl mx-4 animate-ripple-in">
          <h1 className="text-4xl font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sakura-300 to-sakura-100 mb-2">桜雨</h1>
          <h2 className="text-xl font-light tracking-wider text-sakura-300/80 uppercase">Sakura Ame</h2>
          <div className="w-16 h-[1px] bg-stone-600 mx-auto my-6"></div>
          <p className="text-md font-serif text-stone-400 italic">Zen garden with RainDrum.</p>
          <div className="mt-8 p-3 px-8 border border-sakura-900/50 rounded-full text-xs text-sakura-500 hover:text-sakura-300 hover:border-sakura-500/50 transition-all cursor-pointer">
            Tap to enter garden
          </div>
        </div>
      </div>
    );
  }

  const isMobile = dimensions.width < 640;
  const drumSize = isMobile 
    ? Math.min(dimensions.width * 0.35, dimensions.height * 0.3) 
    : Math.min(dimensions.width * 0.4, dimensions.height * 0.35);

  return (
    <div className={`relative h-screen w-full bg-gradient-to-b ${currentTheme.bgGradient} overflow-hidden font-serif select-none transition-colors duration-1000`} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
      <div className={`absolute inset-0 opacity-40 pointer-events-none transition-opacity duration-1000 animate-pulse-slow`} style={{ backgroundImage: `url(${currentTheme.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <SakuraVisualizer drops={drops} ripples={ripples} particles={particles} width={dimensions.width} height={dimensions.height} theme={currentTheme} />

      {isTimerFinished && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-1000">
              <div className="text-center space-y-6">
                  <div className="text-6xl animate-bounce">🎋</div>
                  <h2 className="text-3xl text-stone-200 font-serif tracking-widest">静寂 (Silence)</h2>
                  <button onClick={resetExperience} className="px-10 py-3 border border-stone-600 rounded-full text-stone-400 hover:text-white hover:border-white transition-all text-xs uppercase tracking-widest">Return to Garden</button>
              </div>
          </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-40 flex flex-col gap-3">
          <div className="bg-stone-900/40 backdrop-blur-md p-1.5 rounded-full border border-white/5 flex flex-col items-center gap-2">
            <button onClick={toggleMute} className={`p-3 rounded-full transition-all ${isMuted ? 'text-red-400' : 'text-stone-400 hover:text-sakura-100'}`}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button onClick={() => { closePopups(); setShowTimer(!showTimer); }} className={`p-3 rounded-full transition-all ${timerRemaining !== null ? 'text-sakura-300' : 'text-stone-400 hover:text-sakura-100'}`}>
                <Hourglass size={20} />
            </button>
          </div>
          <button onClick={resetExperience} className="p-3 bg-stone-900/40 backdrop-blur-md rounded-full border border-white/5 text-stone-400 hover:text-white"><RotateCcw size={20} /></button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-16 sm:bottom-10 left-6 z-40 flex flex-col gap-4">
          <button onClick={() => { closePopups(); setShowThemes(!showThemes); }} className={`p-4 rounded-full border transition-all backdrop-blur-md ${showThemes ? 'bg-sakura-900/40 border-sakura-500/50 text-sakura-200' : 'bg-stone-900/40 border-white/5 text-stone-400'}`}>
             <Settings size={22} />
          </button>
          <button onClick={() => { closePopups(); setShowMixer(!showMixer); }} className={`p-4 rounded-full border transition-all backdrop-blur-md ${showMixer ? 'bg-sakura-900/40 border-sakura-500/50 text-sakura-200' : 'bg-stone-900/40 border-white/5 text-stone-400'}`}>
             <Sliders size={22} />
          </button>
          <button onClick={() => { closePopups(); setShowInstruments(!showInstruments); }} className={`p-4 rounded-full border transition-all backdrop-blur-md ${showInstruments ? 'bg-sakura-900/40 border-sakura-500/50 text-sakura-200' : 'bg-stone-900/40 border-white/5 text-stone-400'}`}>
             <Music size={22} />
          </button>
      </div>

      {/* Shishiodoshi HUD */}
      {timerRemaining !== null && !isTimerFinished && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-6">
              <div className="relative">
                  <div className={`relative w-14 h-48 transition-transform duration-[1500ms] ease-in-out origin-center ${isShishiodoshiTilting ? 'rotate-[115deg]' : 'rotate-0'}`}>
                      <div className="absolute inset-0 rounded-full border-2 border-stone-600/50 shadow-2xl overflow-hidden bg-gradient-to-b from-stone-800 via-stone-700 to-stone-900">
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-indigo-500/30 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            style={{ height: `${((timerTotal! - timerRemaining) / timerTotal!) * 100}%` }}
                          ></div>
                          <div className="absolute top-[25%] w-full h-[1.5px] bg-stone-950/40"></div>
                          <div className="absolute top-[50%] w-full h-[2px] bg-stone-950/60"></div>
                          <div className="absolute top-[75%] w-full h-[1.5px] bg-stone-950/40"></div>
                      </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-24 h-3 bg-stone-600/40 rounded-full -z-10 shadow-lg blur-[1px]"></div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-serif text-sakura-100/80 tracking-widest bg-stone-900/80 border border-white/10 px-5 py-2 rounded-full shadow-2xl">
                    {Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}
                </span>
                <span className="text-[10px] mt-2 text-stone-500 uppercase tracking-[0.4em]">Shishiodoshi</span>
              </div>
          </div>
      )}

      {/* RainDrums Positioning */}
      <div className="absolute w-full h-full pointer-events-none">
         <div className="absolute" style={{ left: '32%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
             <div className="absolute inset-0 rounded-full border border-white/5 backdrop-blur-md shadow-[0_0_100px_rgba(0,0,0,0.7)]" style={{ backgroundColor: currentTheme.drumColor }}></div>
             {NOTES.filter(n => n.drumIndex === 0).map((note) => (
                 <DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />
             ))}
         </div>
         <div className="absolute" style={{ left: '68%', top: `${PAD_Y_PERCENT}%`, width: drumSize, height: drumSize, transform: 'translate(-50%, -50%)' }}>
             <div className="absolute inset-0 rounded-full border border-white/5 backdrop-blur-md shadow-[0_0_100px_rgba(0,0,0,0.7)]" style={{ backgroundColor: currentTheme.drumColor }}></div>
             {NOTES.filter(n => n.drumIndex === 1).map((note) => (
                 <DrumButton key={note.id} note={note} activeNote={activeNote} spawnDrop={spawnDrop} />
             ))}
         </div>
      </div>

      {showTimer && (
          <div className="absolute top-20 right-20 w-64 bg-stone-900/95 backdrop-blur-2xl border border-stone-800 rounded-2xl p-6 z-50 shadow-2xl animate-in zoom-in-95 ring-1 ring-white/5">
              <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-3">
                  <h3 className="text-stone-400 font-serif text-sm tracking-widest uppercase">Zen Meditation</h3>
                  <button onClick={closePopups} className="text-stone-600 hover:text-stone-300 transition-colors"><X size={16} /></button>
              </div>
              <div className="space-y-2">
                  {SHISHIODOSHI_PRESETS.map((preset) => (
                      <button 
                        key={preset.label}
                        onClick={() => {
                            setTimerTotal(preset.minutes * 60);
                            setTimerRemaining(preset.minutes * 60);
                            setIsTimerFinished(false);
                            closePopups();
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-stone-800/30 hover:bg-stone-700/50 border border-transparent hover:border-stone-600/50 transition-all text-left group"
                      >
                          <span className="text-sm font-serif text-stone-300 group-hover:text-sakura-100">{preset.label}</span>
                          <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{preset.icon}</span>
                      </button>
                  ))}
                  {timerRemaining !== null && (
                      <button onClick={() => { setTimerRemaining(null); setTimerTotal(null); closePopups(); }} className="w-full mt-4 py-2 text-[10px] uppercase font-bold text-red-400/60 hover:text-red-400 transition-colors">Stop Timer</button>
                  )}
              </div>
          </div>
      )}

      {showThemes && (
          <div className="absolute bottom-32 left-6 w-64 bg-stone-900/95 backdrop-blur-2xl border border-stone-800 rounded-2xl p-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4 ring-1 ring-white/5">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-stone-400 font-serif text-sm tracking-widest uppercase">Atmosphere</h3>
                  <button onClick={closePopups} className="text-stone-600 hover:text-stone-300 transition-colors"><X size={16} /></button>
              </div>
              <div className="space-y-1.5">
                  {THEMES.map(t => (
                      <button key={t.id} onClick={() => { setCurrentTheme(t); closePopups(); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-serif transition-all flex items-center justify-between ${currentTheme.id === t.id ? 'bg-sakura-900/20 text-sakura-100 border border-sakura-800/30 shadow-inner' : 'text-stone-500 hover:text-stone-300 border border-transparent'}`}>
                          {t.name}
                          {currentTheme.id === t.id && <Sparkles size={12} className="text-sakura-400 animate-pulse" />}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {showInstruments && (
          <div className="absolute bottom-32 left-6 w-64 bg-stone-900/95 backdrop-blur-2xl border border-stone-800 rounded-2xl p-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4 ring-1 ring-white/5">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-stone-400 font-serif text-sm tracking-widest uppercase">Sound Timbre</h3>
                  <button onClick={closePopups} className="text-stone-600 hover:text-stone-300 transition-colors"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  {['Crystal', 'MusicBox', 'Ether', 'Deep', 'Bamboo', 'Suikin'].map((type) => (
                      <button 
                        key={type} 
                        onClick={() => { setCurrentSoundType(type as SoundType); closePopups(); }}
                        className={`py-4 rounded-xl text-[10px] uppercase font-bold tracking-[0.2em] transition-all border ${currentSoundType === type ? 'bg-sakura-900/30 text-sakura-100 border-sakura-800/40 shadow-lg' : 'bg-stone-800/40 text-stone-600 border-transparent hover:text-stone-400 hover:bg-stone-800/60'}`}
                      >
                          {type === 'Suikin' ? '水琴窟' : type === 'MusicBox' ? 'オルゴール' : type}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {showMixer && (
          <div className="absolute bottom-32 left-6 w-72 bg-stone-900/95 backdrop-blur-2xl border border-stone-800 rounded-2xl p-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4 ring-1 ring-white/5">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-stone-400 font-serif text-sm tracking-widest uppercase">Garden Audio</h3>
                  <button onClick={closePopups} className="text-stone-600 hover:text-stone-300 transition-colors"><X size={16} /></button>
              </div>
              <div className="space-y-6">
                  <div className="space-y-3">
                      <div className="flex justify-between text-[10px] text-stone-500 font-bold uppercase tracking-wider"><span>Main Master</span><span>{Math.round(masterVolume * 100)}%</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={(e) => { setMasterVolume(parseFloat(e.target.value)); audioEngine.setMasterVolume(parseFloat(e.target.value)); }} className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none accent-sakura-500 cursor-pointer" />
                  </div>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] text-stone-500 font-bold uppercase tracking-wider"><span>Natural Rain</span><span>{Math.round(rainDensity * 100)}%</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={rainDensity} onChange={(e) => setRainDensity(parseFloat(e.target.value))} className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none accent-indigo-400 cursor-pointer" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-800">
                      {[
                        { id: 'wind', icon: <Wind size={14} />, label: 'Breeze' },
                        { id: 'birds', icon: <Bird size={14} />, label: 'Uguisu' },
                        { id: 'river', icon: <Droplets size={14} />, label: 'River' },
                        { id: 'crickets', icon: <Bug size={14} />, label: 'Mushi' },
                      ].map((item) => (
                          <button 
                            key={item.id}
                            onClick={() => updateAmbience(item.id as AmbienceType, { active: !ambience[item.id as AmbienceType].active })}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${ambience[item.id as AmbienceType].active ? 'bg-stone-800 border-stone-600 text-stone-100' : 'bg-transparent border-transparent text-stone-700 hover:text-stone-500'}`}
                          >
                              {item.icon}
                              <span className="text-[9px] mt-2 uppercase tracking-widest">{item.label}</span>
                          </button>
                      ))}
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
                className={`w-14 h-14 md:w-16 md:h-16 transition-all duration-300 ease-out ${isActive ? 'scale-90 brightness-150' : 'hover:scale-115 hover:brightness-125'}`}
                style={{ 
                    transform: `rotate(${angle}rad)`,
                    filter: isActive ? 'drop-shadow(0 0 15px rgba(251, 207, 232, 1))' : 'drop-shadow(0 0 6px rgba(0,0,0,0.6))'
                }}
            >
                <svg viewBox="0 0 50 50" className="w-full h-full overflow-visible">
                    <path 
                        d={petalPath} 
                        fill={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'}
                        stroke={isActive ? '#fbcfe8' : 'rgba(255, 255, 255, 0.4)'}
                        strokeWidth="1.2"
                    />
                </svg>
            </div>
        </button>
    );
};

export default App;
