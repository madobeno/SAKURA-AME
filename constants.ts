
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
    name: '春の庭 (Spring Garden)',
    bgGradient: 'from-stone-950 via-stone-900 to-stone-950',
    bgImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(255, 241, 242, 0.08)',
    rainColor: 'rgba(254, 202, 202, 0.8)',
    accentColor: '#f9a8d4',
    particleColor: '#fbcfe8'
  },
  {
    id: 'rainy_path',
    name: '雨の小径 (Rainy Path)',
    bgGradient: 'from-stone-950 via-green-900/10 to-stone-950',
    bgImage: 'path.jpg',
    drumColor: 'rgba(20, 40, 30, 0.3)', 
    rainColor: 'rgba(186, 230, 253, 0.75)',
    accentColor: '#4ade80', 
    particleColor: '#bae6fd'
  },
  {
    id: 'lotus_pond',
    name: '蓮池 (Lotus Pond)',
    bgGradient: 'from-teal-950 via-stone-900 to-teal-950',
    bgImage: 'https://raw.githubusercontent.com/madobeno/SAKURA-AME/main/public/%E8%93%AE%E6%B1%A0.jpg',
    drumColor: 'rgba(20, 83, 45, 0.15)',
    rainColor: 'rgba(167, 243, 208, 0.7)',
    accentColor: '#4ade80',
    particleColor: '#86efac'
  },
  {
    id: 'bridge',
    name: '朱橋 (Red Bridge)',
    bgGradient: 'from-stone-950 via-red-950/10 to-stone-950',
    bgImage: 'bridge.jpg',
    drumColor: 'rgba(127, 29, 29, 0.15)', 
    rainColor: 'rgba(254, 202, 202, 0.75)',
    accentColor: '#f87171', 
    particleColor: '#fca5a5'
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
