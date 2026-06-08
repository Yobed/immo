'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ComponentProps, type MouseEvent } from 'react'

interface ViewTransitionLinkProps {
  href: string
  /** Nom de la transition partagée — doit matcher l'élément de destination */
  transitionName?: string
  /** Sélecteur CSS de l'élément à animer dans le link (par défaut : premier img) */
  imageSelector?: string
  className?: string
  children: React.ReactNode
  onClick?: () => void
  prefetch?: ComponentProps<typeof Link>['prefetch']
}

/**
 * Link avec View Transition API native.
 *
 * Comportement :
 *  - Click standard → animation morphique entre la carte (image source) et
 *    la fiche détail (image hero) via l'API View Transitions du navigateur
 *  - Le `transitionName` est appliqué temporairement à l'image source juste
 *    avant la navigation, puis retiré
 *  - Si l'API n'est pas supportée (Firefox actuellement), fallback à un
 *    Link Next.js normal
 *  - Click avec modificateurs (Ctrl/Cmd/Shift/Alt) ou middle-click → fallback
 *    (l'utilisateur veut ouvrir dans un nouvel onglet)
 *
 * Coté destination, l'élément correspondant doit avoir :
 *   style={{ viewTransitionName: 'bien-hero' }}
 */
export function ViewTransitionLink({
  href,
  transitionName = 'bien-hero',
  imageSelector = 'img, [data-vt-source]',
  className,
  children,
  onClick,
  prefetch,
}: ViewTransitionLinkProps) {
  const router = useRouter()

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.()

    // Skip si modificateurs, middle-click, ou API non supportée
    if (
      typeof document === 'undefined' ||
      typeof (document as Document & { startViewTransition?: unknown }).startViewTransition !== 'function' ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      return
    }

    e.preventDefault()

    // Trouve l'image source dans le link
    const link = e.currentTarget
    const img = link.querySelector(imageSelector) as HTMLElement | null
    if (img) {
      img.style.setProperty('view-transition-name', transitionName)
    }

    // Démarre la transition
    const doc = document as Document & {
      startViewTransition: (cb: () => void) => { finished: Promise<void> }
    }
    const transition = doc.startViewTransition(() => {
      router.push(href)
    })

    // Cleanup : retire le nom pour ne pas casser un retour en arrière
    if (img) {
      transition.finished.finally(() => {
        img.style.removeProperty('view-transition-name')
      })
    }
  }

  return (
    <Link href={href} className={className} onClick={handleClick} prefetch={prefetch}>
      {children}
    </Link>
  )
}
