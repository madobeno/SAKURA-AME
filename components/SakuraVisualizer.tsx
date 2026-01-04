
import React, { useRef, useEffect } from 'react';
import { RainDrop, Ripple, NoteParticle, Theme } from '../types';

interface Props {
  drops: RainDrop[];
  ripples: Ripple[];
  particles: NoteParticle[];
  width: number;
  height: number;
  theme: Theme;
}

const SakuraVisualizer: React.FC<Props> = ({ drops, ripples, particles, width, height, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Drops
    ctx.fillStyle = theme.rainColor;
    drops.forEach(drop => {
      ctx.beginPath();
      // Rain is a thin line
      ctx.rect(drop.x, drop.y, 1, Math.min(drop.speed * 1.5, 20)); 
      ctx.fill();
    });

    // Draw Ripples (Impact rings)
    ctx.lineWidth = 1.5;
    ripples.forEach(ripple => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`;
      ctx.beginPath();
      ctx.ellipse(ripple.x, ripple.y, ripple.size, ripple.size * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Particles (Sakura Petals, Stone Fragments, or Stars)
    particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = theme.particleColor;
        
        const scale = p.size;

        if (theme.id === 'tsumugi') {
            // Draw angular stone/pebble shape
            ctx.beginPath();
            ctx.moveTo(-scale / 2, -scale / 2);
            ctx.lineTo(scale / 2, -scale / 3);
            ctx.lineTo(scale / 3, scale / 2);
            ctx.lineTo(-scale / 3, scale / 2.5);
            ctx.closePath();
            ctx.fill();
        } else if (theme.id === 'night_garden') {
            // Draw a small sparkling star (diamond/glowing circle)
            ctx.beginPath();
            ctx.arc(0, 0, scale / 4, 0, Math.PI * 2);
            ctx.shadowBlur = 10;
            ctx.shadowColor = theme.particleColor;
            ctx.fill();
        } else {
            // Draw a heart-like petal shape
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(scale/2, -scale/2, scale, -scale/2, 0, -scale);
            ctx.bezierCurveTo(-scale, -scale/2, -scale/2, -scale/2, 0, 0);
            ctx.fill();
        }
        
        ctx.restore();
    });

  }, [drops, ripples, particles, width, height, theme]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-20" />;
};

export default SakuraVisualizer;
