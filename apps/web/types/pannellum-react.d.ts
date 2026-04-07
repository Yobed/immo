declare module 'pannellum-react' {
  import { ComponentType } from 'react'

  interface HotSpot {
    pitch: number
    yaw: number
    type: string
    text?: string
    cssClass?: string
    URL?: string
  }

  interface PannellumProps {
    width?: string
    height?: string
    image?: string
    pitch?: number
    yaw?: number
    hfov?: number
    autoLoad?: boolean
    autoRotate?: number
    compass?: boolean
    showZoomCtrl?: boolean
    showFullscreenCtrl?: boolean
    hotSpots?: HotSpot[]
    onLoad?: () => void
    onError?: (err: string) => void
    [key: string]: unknown
  }

  export const Pannellum: ComponentType<PannellumProps>
}
