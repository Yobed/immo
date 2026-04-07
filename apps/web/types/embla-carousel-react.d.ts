declare module 'embla-carousel-react' {
  import { RefCallback } from 'react'

  type EmblaOptionsType = {
    loop?: boolean
    align?: 'start' | 'center' | 'end'
    slidesToScroll?: number
    dragFree?: boolean
    containScroll?: false | 'trimSnaps' | 'keepSnaps'
    [key: string]: unknown
  }

  interface EmblaCarouselType {
    scrollPrev: () => void
    scrollNext: () => void
    scrollTo: (index: number, jump?: boolean) => void
    selectedScrollSnap: () => number
    on: (event: string, callback: () => void) => void
    off: (event: string, callback: () => void) => void
    destroy: () => void
  }

  export default function useEmblaCarousel(
    options?: EmblaOptionsType
  ): [RefCallback<HTMLElement>, EmblaCarouselType | undefined]
}
