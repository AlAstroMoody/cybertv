import type { Channel } from '../composables/useChannelList'
import type { AppPhase } from '../composables/useNavigation'

export interface RendererImages {
  activeFrame: HTMLImageElement | null
  listBackground: HTMLImageElement | null
  performance: HTMLImageElement | null
  chaos: HTMLImageElement | null
  error: HTMLImageElement | null
  frameLine: HTMLImageElement | null
  xpTrack: HTMLImageElement | null
  xpFill: HTMLImageElement | null
  diamond: HTMLImageElement | null
  structure: HTMLImageElement | null
  signalBars: HTMLImageElement | null
  categoryFrame: HTMLImageElement | null
  preloaderIcons: HTMLImageElement[]
  tarotCards: HTMLImageElement[]
  tarotByName: Partial<Record<string, HTMLImageElement>>
}

export interface RendererLayout {
  W: number
  H: number
  listX: number
  itemHeight: number
}

export interface RendererState {
  phase: AppPhase
  channels: Channel[]
  activeIndex: number
  showInfoBar: boolean
  currentChannel: Channel | null
  isPlaying: boolean
  isLoading: boolean
  hasError: boolean
  categories: string[]
  categoryFocusIndex: number
  bootProgress: number
  introElapsedMs: number
  uiVisible: boolean
  isBuffering: boolean
  unlockDigits: string
  tracedElapsedMs: number
  realAccess: boolean
  nodeInput: string
  deadUrls: ReadonlySet<string>
}

export type DecorationRow = { width1: number; width2: number }
