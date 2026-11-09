'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center border shadow-sm group ${
        theme === 'dark'
          ? 'bg-white/10 hover:bg-white/20 border-white/15 text-[#C8A97E] hover:text-white'
          : 'bg-black/5 hover:bg-black/10 border-black/10 text-[#947346] hover:text-black'
      } ${className}`}
      aria-label={theme === 'dark' ? 'Passer en mode Jour' : 'Passer en mode Nuit'}
      title={theme === 'dark' ? 'Mode Jour' : 'Mode Nuit'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-[#C8A97E] group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-4 h-4 text-[#947346] group-hover:-rotate-12 transition-transform" />
        )}
      </motion.div>
    </button>
  );
}
