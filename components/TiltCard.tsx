'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltStrength?: number;
}

export default function TiltCard({
  children,
  className = '',
  tiltStrength = 10,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth springs for fluid, weighted architectural feel
  const springX = useSpring(mouseX, { stiffness: 220, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 220, damping: 22 });

  const rotateX = useTransform(springY, [0, 1], [tiltStrength, -tiltStrength]);
  const rotateY = useTransform(springX, [0, 1], [-tiltStrength, tiltStrength]);
  
  // Dynamic shadow displacement (Opposite to tilt direction)
  const shadowX = useTransform(springX, [0, 1], ['-18px', '18px']);
  const shadowY = useTransform(springY, [0, 1], ['-18px', '28px']);

  const glareX = useTransform(springX, [0, 1], ['0%', '100%']);
  const glareY = useTransform(springY, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1200px',
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        scale: isHovered ? 1.015 : 1,
      }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative transform-gpu group/tilt transition-shadow duration-500 ${className} ${
        isHovered
          ? 'dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(200,169,126,0.18)] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12),0_0_25px_rgba(148,115,70,0.12)]'
          : 'dark:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.6)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)]'
      }`}
    >
      {children}

      {/* Dynamic Specular Glass Glare Sheen */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-25 mix-blend-overlay transition-opacity duration-300 z-30"
          style={{
            background: `radial-gradient(circle at ${glareX.get() || '50%'} ${glareY.get() || '50%'}, rgba(255,255,255,0.9) 0%, rgba(200,169,126,0.4) 35%, transparent 70%)`,
          }}
        />
      )}

      {/* Subtle Golden Ambient Edge Ring on Hover */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none dark:ring-1 dark:ring-white/10 ring-1 ring-black/5 group-hover/tilt:ring-[#C8A97E]/40 transition-all duration-500 z-20" />
    </motion.div>
  );
}
