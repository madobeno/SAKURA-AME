
import { Note, Theme, TimerPreset } from './types';

const getPentagonPos = (index: number, isInverted: boolean, radius: number = 38) => {
  const startAngle = isInverted ? 90 : -90;
  const angle = startAngle + (index * (360 / 5));
  const rad = angle * (Math.PI / 180);
  return {
    left: 50 + radius * Math.cos(rad),
    top: 50 + radius * Math.sin(rad)
  };
};

const leftDrumNotes = [
  { id: 'n_b3', name: 'B3', frequency: 246.94, label: 'B3', index: 0 },
  { id: 'n_g3', name: 'G3', frequency: 196.00, label: 'G3', index: 1 },
  { id: 'n_d3', name: 'D3', frequency: 146.83, label: 'D3', index: 2 },
  { id: 'n_e3', name: 'E3', frequency: 164.81, label: 'E3', index: 3 },
  { id: 'n_a3', name: 'A3', frequency: 220.00, label: 'A3', index: 4 },
];

const rightDrumNotes = [
  { id: 'n_d4', name: 'D4', frequency: 293.66, label: 'D4', index: 0 },
  { id: 'n_e4', name: 'E4', frequency: 329.63, label: 'E4', index: 1 },
  { id: 'n_a4', name: 'A4', frequency: 440.00, label: 'A4', index: 2 },
  { id: 'n_b4', name: 'B4', frequency: 493.88, label: 'B4', index: 3 },
  { id: 'n_g4', name: 'G4', frequency: 392.00, label: 'G4', index: 4 },
];

export const NOTES: Note[] = [
  ...leftDrumNotes.map(n => ({
    ...n,
    drumIndex: 0 as const,
    ...getPentagonPos(n.index, false),
    cloudLeft: 15 + (n.index * 5)
  })),
  ...rightDrumNotes.map(n => ({
    ...n,
    drumIndex: 1 as const,
    ...getPentagonPos(n.index, true),
    cloudLeft: 65 + (n.index * 5)
  }))
];

export const THEMES: Theme[] = [
  {
    id: 'sakura_day',
    name: '蓮池 (Lotus Pond)',
    bgGradient: 'from-stone-900 via-teal-950 to-stone-900',
    bgImage: 'https://images.unsplash.com/photo-1552556557-67995393690d?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(20, 50, 45, 0.4)',
    rainColor: 'rgba(200, 255, 230, 0.7)',
    accentColor: '#5eead4',
    particleColor: '#ccfbf1'
  },
  {
    id: 'temple_night',
    name: '鳥居 (Torii Gate)',
    bgGradient: 'from-stone-950 via-red-950 to-stone-950',
    bgImage: 'https://images.unsplash.com/photo-1490806843928-846c19794931?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(60, 20, 20, 0.5)',
    rainColor: 'rgba(254, 202, 202, 0.7)',
    accentColor: '#f87171',
    particleColor: '#fecaca'
  },
  {
    id: 'karesansui',
    name: '水鏡 (Water Reflection)',
    bgGradient: 'from-slate-900 via-slate-800 to-slate-900',
    bgImage: 'https://images.unsplash.com/photo-1485601284679-a2f86e6f7669?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(30, 41, 59, 0.5)',
    rainColor: 'rgba(186, 230, 253, 0.7)',
    accentColor: '#7dd3fc',
    particleColor: '#e0f2fe'
  },
  {
    id: 'bridge',
    name: '朱橋 (Red Bridge)',
    bgGradient: 'from-stone-950 via-orange-950 to-stone-950',
    bgImage: 'https://images.unsplash.com/photo-1528360983277-13d9b152c6d4?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(80, 30, 20, 0.4)',
    rainColor: 'rgba(253, 186, 116, 0.7)',
    accentColor: '#fb923c',
    particleColor: '#ffedd5'
  }
];

export const SHISHIODOSHI_PRESETS: TimerPreset[] = [
  { label: '煎茶 (Sencha)', minutes: 1, icon: '🍵' },
  { label: '紅茶 (Black Tea)', minutes: 3, icon: '🫖' },
  { label: '瞑想 (Meditation)', minutes: 15, icon: '🧘' },
  { label: '読書 (Reading)', minutes: 30, icon: '📖' },
  { label: 'うたた寝 (Nap)', minutes: 60, icon: '💤' },
];

export const GRAVITY_SPEED = 12; 
export const PAD_Y_PERCENT = 52; 
