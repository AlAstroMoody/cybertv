import { drawBootChrome } from './bootChrome'
import { drawCategories } from './categoriesView'
import { drawChannelList } from './channelListView'
import { drawDecoration, generateDecorationRows } from './decoration'
import { drawGlitchTitle } from './glitchTitle'
import { drawInfoBar } from './infoBar'
import { loadRendererImages } from './resources'
import { drawStatusOverlay } from './statusOverlay'
import { drawTarotCards, pickTarotCards } from './tarotView'
import { drawVideoPreloader } from './videoPreloader'
import { drawWelcomeMenu } from './welcomeView'
import type { DecorationRow, RendererImages, RendererLayout, RendererState } from './types'

export type { RendererState } from './types'

const INTRO_MIN_MS = 1800

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private layout: RendererLayout = { W: 0, H: 0, listX: 40, itemHeight: 60 }
  private images: RendererImages | null = null
  private decorationRows: DecorationRow[] = []
  private ready = false
  private onReadyCallback: (() => void) | null = null
  private lastTarotChannelIndex = -1
  private rafId = 0
  private introStartedAt = 0
  private onFrame: (() => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get canvas context')
    this.ctx = ctx
    this.resize()
    void this.loadResources()
  }

  onReady(callback: () => void) {
    if (this.ready) {
      callback()
      return
    }
    this.onReadyCallback = callback
  }

  /** Колбэк каждый кадр (анимация intro / categories / preloader) */
  setFrameCallback(cb: (() => void) | null) {
    this.onFrame = cb
  }

  private async loadResources() {
    this.images = await loadRendererImages()
    this.images.displayTarotCards = pickTarotCards(this.images.tarotCards)
    this.ready = true
    this.introStartedAt = performance.now()
    this.onReadyCallback?.()
    this.startLoop()
  }

  private startLoop() {
    const tick = () => {
      this.rafId = requestAnimationFrame(tick)
      this.onFrame?.()
    }
    this.rafId = requestAnimationFrame(tick)
  }

  destroy() {
    cancelAnimationFrame(this.rafId)
    this.onFrame = null
  }

  resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    this.layout.W = window.innerWidth
    this.layout.H = window.innerHeight
    // Буфер в физических пикселях — иначе на HiDPI всё (и SVG) мылится
    this.canvas.width = Math.round(this.layout.W * dpr)
    this.canvas.height = Math.round(this.layout.H * dpr)
    this.canvas.style.width = `${this.layout.W}px`
    this.canvas.style.height = `${this.layout.H}px`
    // После смены width/height контекст сбрасывается — возвращаем CSS-координаты
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.layout.listX = 40
    this.layout.itemHeight = Math.min(60, this.layout.H / 15)
    this.decorationRows = generateDecorationRows(this.layout.H)
  }

  getIntroElapsedMs(): number {
    if (!this.introStartedAt) return 0
    return performance.now() - this.introStartedAt
  }

  isIntroMinDone(): boolean {
    return this.getIntroElapsedMs() >= INTRO_MIN_MS
  }

  render(state: RendererState) {
    if (!this.ready || !this.images) return

    if (state.phase === 'player' && state.activeIndex !== this.lastTarotChannelIndex) {
      this.lastTarotChannelIndex = state.activeIndex
      this.images.displayTarotCards = pickTarotCards(this.images.tarotCards)
    }

    const { ctx, layout, images } = this
    ctx.clearRect(0, 0, layout.W, layout.H)

    if (state.phase === 'intro' || state.phase === 'welcome' || state.phase === 'categories') {
      drawDecoration(ctx, this.decorationRows, 1)
      const chromeOpacity = state.phase === 'intro' ? 1 : 0.55
      drawBootChrome(ctx, layout, images, state.bootProgress, chromeOpacity)
    }

    if (state.phase === 'intro') {
      drawGlitchTitle(ctx, layout, state.introElapsedMs)
      return
    }

    if (state.phase === 'welcome') {
      drawWelcomeMenu(ctx, layout, images, state.hasError, state.introElapsedMs)
      return
    }

    if (state.phase === 'categories') {
      const appear = Math.min(1, Math.max(0, (state.introElapsedMs - INTRO_MIN_MS) / 600))
      drawCategories(
        ctx,
        layout,
        images,
        state.categories,
        state.categoryFocusIndex,
        appear || 1,
      )
      return
    }

    // плеер
    const showPreloader = state.isBuffering && !state.hasError
    const showTarot = !state.isPlaying || showPreloader || state.hasError

    if (!state.uiVisible) {
      if (showTarot) {
        drawTarotCards(ctx, layout, images)
      }
      if (showPreloader) {
        drawVideoPreloader(ctx, layout, images)
      }
      if (state.hasError) {
        drawStatusOverlay(ctx, layout, images, 'error', 'Ошибка воспроизведения')
      }
      return
    }

    drawDecoration(ctx, this.decorationRows, 1)

    if (showTarot) {
      drawTarotCards(ctx, layout, images)
    }

    drawChannelList(ctx, layout, images, state.channels, state.activeIndex)

    if (state.showInfoBar && state.currentChannel) {
      drawInfoBar(ctx, layout, state.currentChannel)
    }

    if (showPreloader) {
      drawVideoPreloader(ctx, layout, images)
    }

    if (state.hasError) {
      drawStatusOverlay(ctx, layout, images, 'error', 'Ошибка воспроизведения')
    }
  }
}
