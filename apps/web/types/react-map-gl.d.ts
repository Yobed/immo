// Stub declaration for react-map-gl — real types are provided by installed package
// This file is only needed in worktree environments without node_modules
declare module 'react-map-gl' {
  import type { ComponentType, ReactNode, CSSProperties } from 'react'

  interface MapProps {
    mapboxAccessToken?: string
    initialViewState?: {
      longitude: number
      latitude: number
      zoom: number
    }
    style?: CSSProperties
    mapStyle?: string
    children?: ReactNode
    [key: string]: unknown
  }

  interface MarkerProps {
    longitude: number
    latitude: number
    anchor?: string
    key?: string
    children?: ReactNode
    [key: string]: unknown
  }

  interface PopupProps {
    longitude: number
    latitude: number
    anchor?: string
    onClose?: () => void
    closeButton?: boolean
    closeOnClick?: boolean
    children?: ReactNode
    [key: string]: unknown
  }

  export const Map: ComponentType<MapProps>
  export const Marker: ComponentType<MarkerProps>
  export const Popup: ComponentType<PopupProps>
}
