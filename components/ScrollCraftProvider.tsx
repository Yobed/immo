'use client';

import React, { useEffect } from 'react';

export default function ScrollCraftProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let instance: any = null;

    const tryMount = () => {
      if (typeof window !== 'undefined' && (window as any).ScrollCraft) {
        try {
          instance = (window as any).ScrollCraft.mount(document.body);
        } catch (e) {
          console.warn('[ScrollCraft] Mount warning:', e);
        }
      }
    };

    // If script is already loaded
    if (typeof window !== 'undefined' && (window as any).ScrollCraft) {
      tryMount();
    } else {
      // Retry when script finishes loading
      const interval = setInterval(() => {
        if (typeof window !== 'undefined' && (window as any).ScrollCraft) {
          clearInterval(interval);
          tryMount();
        }
      }, 50);
      return () => clearInterval(interval);
    }

    return () => {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
