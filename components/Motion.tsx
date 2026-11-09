'use client';

import React, { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';

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

type TextRevealProps = {
  text: string;
  className?: string;
  delay?: number;
  /** `animate` = au chargement (hero), `inView` = à l'arrivée dans l'écran. */
  trigger?: 'animate' | 'inView';
};

/** Titre révélé mot par mot, chaque mot monte derrière un masque. Les `\n` forcent un retour à la ligne. */
export function TextReveal({ text, className, delay = 0, trigger = 'inView' }: TextRevealProps) {
  const isReduced = useReducedMotion();
  const lines = text.split('\n');
  let wordIndex = 0;
  const target = { y: '0%' };
  const triggerProps = trigger === 'animate'
    ? { animate: target }
    : { whileInView: target, viewport: { once: true, margin: '0px 0px -10% 0px' } };

  return (
    <span className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(' ').map((word, wi) => {
            const i = wordIndex++;
            return (
              <React.Fragment key={i}>
                {wi > 0 && ' '}
                <span className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
                  <motion.span
                    className="inline-block will-change-transform"
                    initial={isReduced ? false : { y: '110%' }}
                    {...triggerProps}
                    transition={{ duration: 1, delay: delay + i * 0.06, ease: EASE_OUT_EXPO }}
                  >
                    {word}
                  </motion.span>
                </span>
              </React.Fragment>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/** Paragraphe dont chaque mot s'allume progressivement pendant le scroll. */
export function ScrollHighlight({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' '}
          <HighlightWord progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
            {word}
          </HighlightWord>
        </React.Fragment>
      ))}
    </p>
  );
}

function HighlightWord({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const isReduced = useReducedMotion();
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity: isReduced ? 1 : opacity }}>
      {children}
    </motion.span>
  );
}

/** Rideau qui se lève sur une image (clip-path), puis léger dézoom. */
export function ImageReveal({ children, className, delay = 0 }: RevealProps) {
  const isReduced = useReducedMotion();
  return (
    <motion.div
      className={`overflow-hidden ${className ?? ''}`}
      initial={isReduced ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1.2, delay, ease: EASE_OUT_EXPO }}
    >
      <motion.div
        className="h-full w-full"
        initial={isReduced ? false : { scale: 1.25 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, delay, ease: EASE_OUT_EXPO }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Nombre qui compte de 0 à sa valeur quand il arrive à l'écran. Le texte non numérique est affiché tel quel. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isReduced = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : 0;
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => `${Math.round(v)}${match?.[2] ?? ''}`);

  const hasNumber = match !== null;

  useEffect(() => {
    if (!hasNumber || !isInView) return;
    if (isReduced) { count.set(target); return; }
    const controls = animate(count, target, { duration: 1.4, ease: EASE_OUT_EXPO });
    return () => controls.stop();
  }, [hasNumber, isInView, isReduced, target, count]);

  if (!match) return <span className={className}>{value}</span>;
  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}

/** Carte qui s'incline en 3D sous la souris, avec un reflet qui suit le pointeur. */
export function Tilt({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const isReduced = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 55%)`;
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
    glareOpacity.set(1);
  };
  const reset = () => { px.set(0.5); py.set(0.5); glareOpacity.set(0); };

  if (isReduced) return <div className={className}>{children}</div>;
  return (
    <div className={`[perspective:1000px] ${className ?? ''}`} onPointerMove={handleMove} onPointerLeave={reset}>
      <motion.div className="relative h-full [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
        {children}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light" style={{ background: glare, opacity: glareOpacity }} />
      </motion.div>
    </div>
  );
}
