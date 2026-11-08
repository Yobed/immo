'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function AmbientSpotlight() {
  const mouseX = useMotionValue(-600);
  const mouseY = useMotionValue(-600);

  const springX = useSpring(mouseX, { stiffness: 90, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed z-20 w-[650px] h-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px]"
      style={{
        left: springX,
        top: springY,
        background: 'radial-gradient(circle, rgba(200, 169, 126, 0.16) 0%, rgba(200, 169, 126, 0.04) 40%, transparent 70%)',
      }}
    />
  );
}
