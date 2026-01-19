import React, { useRef, useEffect } from 'react';
import { RainDrop, Ripple, NoteParticle, Theme, PresetEffect } from '../types';

interface Props {
  drops: RainDrop[];
  ripples: Ripple[];
  particles: NoteParticle[];
  width: number;
  height: number;
  theme: Theme;
  activeEffect: PresetEffect;
}

interface Butterfly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  wingPhase: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
}

const SakuraVisualizer: React.FC<Props> = ({ drops, ripples, particles, width, height, theme, activeEffect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const butterfliesRef = useRef<Butterfly[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (activeEffect === 'shower' && butterfliesRef.current.length === 0) {
      const colors = ['#f472b6', '#fb7185', '#ffffff', '#fdf2f8'];
      butterfliesRef.current = Array.from({ length: 8 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        angle: Math.random() * Math.PI * 2,
        wingPhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
    } else if (activeEffect !== 'shower') {
      butterfliesRef.current = [];
    }

    if (activeEffect === 'fox' && cloudsRef.current.length === 0) {
      cloudsRef.current = Array.from({ length: 5 }, () => ({
        x: Math.random() * width,
        y: Math.random() * (height * 0.4),
        scale: 0.8 + Math.random() * 1.5,
        speed: 0.2 + Math.random() * 0.5,
        opacity: 0.1 + Math.random() * 0.2
      }));
    } else if (activeEffect !== 'fox') {
      cloudsRef.current = [];
    }
  }, [activeEffect, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
      lastUpdateRef.current = time;

      ctx.clearRect(0, 0, width, height);

      if (activeEffect === 'fox') {
        ctx.fillStyle = '#ffffff';
        cloudsRef.current.forEach(cloud => {
          ctx.globalAlpha = cloud.opacity;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, 40 * cloud.scale, 0, Math.PI * 2);
          ctx.arc(cloud.x + 30 * cloud.scale, cloud.y - 10 * cloud.scale, 30 * cloud.scale, 0, Math.PI * 2);
          ctx.arc(cloud.x - 30 * cloud.scale, cloud.y - 10 * cloud.scale, 30 * cloud.scale, 0, Math.PI * 2);
          ctx.arc(cloud.x + 50 * cloud.scale, cloud.y + 10 * cloud.scale, 25 * cloud.scale, 0, Math.PI * 2);
          ctx.fill();
          
          cloud.x += cloud.speed;
          if (cloud.x > width + 150) cloud.x = -150;
        });
        ctx.globalAlpha = 1.0;
      }

      if (activeEffect === 'shower') {
        butterfliesRef.current.forEach(b => {
          b.x += b.vx;
          b.y += b.vy;
          b.wingPhase += 0.2;
          b.angle += (Math.random() - 0.5) * 0.1;
          
          if (b.x < -20) b.x = width + 20;
          if (b.x > width + 20) b.x = -20;
          if (b.y < -20) b.y = height + 20;
          if (b.y > height + 20) b.y = -20;

          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.angle);
          ctx.fillStyle = b.color;
          const wingW = 6 * Math.abs(Math.sin(b.wingPhase));
          ctx.beginPath();
          ctx.ellipse(-wingW, 0, wingW, 8, 0, 0, Math.PI * 2);
          ctx.ellipse(wingW, 0, wingW, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      ctx.fillStyle = theme.rainColor;
      drops.forEach(drop => {
        ctx.beginPath();
        ctx.rect(drop.x, drop.y, 1.2, Math.min(drop.speed * 1.8, 25)); 
        ctx.fill();
      });

      ctx.lineWidth = 1.0;
      ripples.forEach(ripple => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(ripple.x, ripple.y, ripple.size, ripple.size * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      particles.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          
          const scale = p.size;

          if (theme.id === 'sakura_night') {
              ctx.beginPath();
              const sides = 6;
              for(let i=0; i<sides; i++) {
                  const angle = (i * Math.PI * 2) / sides;
                  const r = i % 2 === 0 ? scale : scale / 2;
                  ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
              }
              ctx.closePath();
              ctx.shadowBlur = 15;
              ctx.shadowColor = '#fff';
              ctx.fill();
          } else if (theme.id === 'night_garden') {
              ctx.beginPath();
              ctx.arc(0, 0, scale / 2, 0, Math.PI * 2);
              ctx.shadowBlur = 12;
              ctx.shadowColor = theme.particleColor;
              ctx.fill();
          } else if (theme.id === 'old_capital') {
              ctx.beginPath();
              ctx.moveTo(0, -scale);
              ctx.lineTo(scale * 0.6, 0);
              ctx.lineTo(0, scale);
              ctx.lineTo(-scale * 0.6, 0);
              ctx.closePath();
              ctx.fill();
          } else if (theme.id === 'tsumugi') {
              ctx.beginPath();
              ctx.rect(-scale/2, -scale/2, scale, scale/4);
              ctx.fill();
          } else {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.bezierCurveTo(scale/2, -scale/2, scale, -scale/2, 0, -scale);
              ctx.bezierCurveTo(-scale, -scale/2, -scale/2, -scale/2, 0, 0);
              ctx.fill();
          }
          
          ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [drops, ripples, particles, width, height, theme, activeEffect]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-20" />;
};

export default SakuraVisualizer;
