'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function ScrollReveal({ children, delay = 0, className = "" }: { children: ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
