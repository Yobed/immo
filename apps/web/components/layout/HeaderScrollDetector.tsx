'use client'

import { useEffect } from 'react'

/**
 * Petit composant client qui ajoute `data-header-scrolled="true"` sur le
 * `<html>` quand l'utilisateur scrolle au-delà du threshold.
 *
 * Avantages :
 *  - Pas besoin de transformer le PublicLayout (server component) en client
 *  - Une seule source de vérité (l'attribut HTML) → CSS pur peut tout styler
 *  - 0 re-render React → ultra léger
 *
 * Le styling du header en mode "scrolled" est défini dans globals.css.
 */
const SCROLL_THRESHOLD = 24

export function HeaderScrollDetector() {
  useEffect(() => {
    const root = document.documentElement

    function update() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        root.setAttribute('data-header-scrolled', 'true')
      } else {
        root.removeAttribute('data-header-scrolled')
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      root.removeAttribute('data-header-scrolled')
    }
  }, [])

  return null
}
