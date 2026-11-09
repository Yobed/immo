'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

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
