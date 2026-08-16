import { assetUrl } from '../utils/assetUrl'
import { loadFonts, loadImages } from '../utils/assets'
import { TAROT_CARD_NAMES } from './tarotView'
import type { RendererImages } from './types'

const UI_IMAGES = {
  activeFrame: '/images/active.svg',
  listBackground: '/images/Rectangle.svg',
  performance: '/images/performance.svg',
  chaos: '/images/chaos.svg',
  error: '/favicon/android-chrome-192x192.png',
  frameLine: '/images/boot/frame-line.svg',
  xpTrack: '/images/boot/xp-track.svg',
  xpFill: '/images/boot/xp-fill.svg',
  diamond: '/images/boot/diamond.svg',
  structure: '/images/boot/structure.svg',
  signalBars: '/images/boot/signal-bars.svg',
  categoryFrame: '/images/boot/category-frame.svg',
} as const

const PRELOADER_ICONS = [
  '/images/preloader/Cool.Auto.svg',
  '/images/preloader/Body.Auto.svg',
  '/images/preloader/Reflex-auto.svg',
  '/images/preloader/Intelligence.auto.svg',
  '/images/preloader/Techhability.auto.svg',
] as const

export async function loadRendererImages(): Promise<RendererImages> {
  await loadFonts(['OpenSans', 'Cyberpunk'])

  const [
    activeFrame,
    listBackground,
    performance,
    chaos,
    error,
    frameLine,
    xpTrack,
    xpFill,
    diamond,
    structure,
    signalBars,
    categoryFrame,
    ...rest
  ] = await loadImages(
    [
      UI_IMAGES.activeFrame,
      UI_IMAGES.listBackground,
      UI_IMAGES.performance,
      UI_IMAGES.chaos,
      UI_IMAGES.error,
      UI_IMAGES.frameLine,
      UI_IMAGES.xpTrack,
      UI_IMAGES.xpFill,
      UI_IMAGES.diamond,
      UI_IMAGES.structure,
      UI_IMAGES.signalBars,
      UI_IMAGES.categoryFrame,
      ...PRELOADER_ICONS,
      ...TAROT_CARD_NAMES.map((name) => `/images/cards/${name}.png`),
    ].map(assetUrl),
  )

  const preloaderIcons = rest.slice(0, PRELOADER_ICONS.length)
  const tarotCards = rest.slice(PRELOADER_ICONS.length)
  const tarotByName: RendererImages['tarotByName'] = {}
  TAROT_CARD_NAMES.forEach((name, i) => {
    const img = tarotCards[i]
    if (img) tarotByName[name] = img
  })

  return {
    activeFrame: activeFrame ?? null,
    listBackground: listBackground ?? null,
    performance: performance ?? null,
    chaos: chaos ?? null,
    error: error ?? null,
    frameLine: frameLine ?? null,
    xpTrack: xpTrack ?? null,
    xpFill: xpFill ?? null,
    diamond: diamond ?? null,
    structure: structure ?? null,
    signalBars: signalBars ?? null,
    categoryFrame: categoryFrame ?? null,
    preloaderIcons,
    tarotCards,
    tarotByName,
  }
}
