'use client';

import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

/** Apparition éditoriale au scroll : légère montée + fondu, une seule fois. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const isReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={isReduced ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

type ParallaxProps = {
  children: React.ReactNode;
  /** Amplitude du déplacement, en % de la hauteur du cadre. */
  strength?: number;
};

/**
 * Parallaxe d'image : le contenu est sur-dimensionné et glisse plus lentement
 * que la page. Se place dans un parent `relative overflow-hidden`.
 */
export function Parallax({ children, strength = 10 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-x-0"
        style={{ top: `-${strength}%`, bottom: `-${strength}%`, ...(isReduced ? {} : { y }) }}
      >
        {children}
      </motion.div>
    </div>
  );
}
