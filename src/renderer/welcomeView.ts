import { COLORS } from '../constants/colors'
import type { RendererImages, RendererLayout } from './types'

/** Тексты экрана-приветствия (вайб CP2077) */
export const WELCOME_OK = {
  title: 'ЧУМБА,',
  line1: 'мы в эфире -',
  line2: 'жми на кнопку',
} as const

export const WELCOME_ERROR = {
  title: 'ЧУМБА,',
  line1: 'линк оборван -',
  line2: 'не сегодня',
} as const

/** Всплеск примерно раз в 1.5–2.5 с, короткая вспышка */
function welcomeGlitch(elapsedMs: number): { spike: boolean; jx: number; jy: number; slice: number } {
  const t = elapsedMs / 1000
  const spike = Math.sin(t * 2.8) > 0.92 || Math.sin(t * 1.7 + 0.9) > 0.95
  if (!spike) {
    return { spike: false, jx: 0, jy: 0, slice: 0 }
  }
  // Детерминированный «шум» на кадр, без Math.random каждый раз по-разному мигая
  const seed = Math.floor(elapsedMs / 40)
  const n1 = Math.sin(seed * 12.9898) * 43758.5453
  const n2 = Math.sin(seed * 78.233) * 43758.5453
  const r1 = n1 - Math.floor(n1)
  const r2 = n2 - Math.floor(n2)
  return {
    spike: true,
    jx: (r1 - 0.5) * 12,
    jy: (r2 - 0.5) * 5,
    slice: (r1 - 0.5) * 8,
  }
}

function drawGlitchText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  ghostA: string,
  ghostB: string,
  g: { spike: boolean; jx: number; jy: number; slice: number },
  withNeon = false,
): void {
  if (g.spike) {
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.shadowBlur = 0
    ctx.fillStyle = ghostA
    ctx.fillText(text, x + g.jx + 3, y + g.jy)
    ctx.fillStyle = ghostB
    ctx.fillText(text, x + g.jx - 3, y + g.jy + g.slice)
    ctx.restore()
  }

  if (withNeon) {
    ctx.save()
    ctx.shadowColor = fill
    ctx.shadowBlur = 28
    ctx.fillStyle = fill
    ctx.fillText(text, x + g.jx * 0.25, y + g.jy * 0.25)
    ctx.shadowBlur = 48
    ctx.globalAlpha = 0.55
    ctx.fillText(text, x + g.jx * 0.25, y + g.jy * 0.25)
    ctx.restore()
  }

  ctx.fillStyle = fill
  ctx.fillText(text, x + g.jx * 0.25, y + g.jy * 0.25)
}

/** RGB-сдвиг картинки на той же вспышке, что и текст */
function drawGlitchImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  g: { spike: boolean; jx: number; jy: number; slice: number },
): void {
  const ox = g.jx * 0.25
  const oy = g.jy * 0.25

  if (g.spike) {
    ctx.save()
    ctx.globalAlpha = 0.45
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(img, x + g.jx + 2, y + g.jy, w, h)
    ctx.drawImage(img, x + g.jx - 2, y + g.jy + g.slice, w, h)
    ctx.restore()
  }

  ctx.drawImage(img, x + ox, y + oy, w, h)
}

export function drawWelcomeMenu(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
  hasError: boolean,
  elapsedMs = 0,
): void {
  const copy = hasError ? WELCOME_ERROR : WELCOME_OK
  const { W, H } = layout
  const g = welcomeGlitch(elapsedMs)

  const blockX = Math.round(W * 0.18)
  const blockY = Math.round(H * 0.32)
  const iconSize = 72

  ctx.save()

  // Слева: performance + chaos — глитчат вместе с текстом
  if (images.performance) {
    drawGlitchImage(ctx, images.performance, blockX, blockY, iconSize, iconSize, g)
  }
  if (images.chaos) {
    const chaosW = 59
    const chaosH = 6
    drawGlitchImage(
      ctx,
      images.chaos,
      Math.round(blockX + (iconSize - chaosW) / 2),
      blockY + iconSize - 10,
      chaosW,
      chaosH,
      g,
    )
  }

  // Справа: крупный красный неон-заголовок
  const titleX = blockX + iconSize + 28
  const titleY = blockY + iconSize * 0.55
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `500 84px 'OpenSans'`

  drawGlitchText(
    ctx,
    copy.title,
    titleX,
    titleY,
    COLORS.primary,
    COLORS.activeText,
    COLORS.accent,
    g,
    true,
  )

  // Рамка категории крупнее + две строки cyan
  const frame = images.categoryFrame
  const frameW = Math.round(Math.min(560, W * 0.48))
  const frameH = Math.round(frameW * (146 / 841))
  const frameX = blockX
  const frameY = blockY + iconSize + 36

  if (frame) {
    const gFrame = {
      spike: g.spike,
      jx: g.jx * 0.7,
      jy: g.jy * 0.7,
      slice: g.slice * 0.6,
    }
    drawGlitchImage(ctx, frame, frameX, frameY, frameW, frameH, gFrame)
  }

  ctx.font = `600 28px 'OpenSans'`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const textX = frameX + frameW * 0.08
  const midY = frameY + frameH / 2

  const gLines = {
    spike: g.spike,
    jx: g.jx * 0.6,
    jy: g.jy * 0.6,
    slice: g.slice * 0.5,
  }
  drawGlitchText(
    ctx,
    copy.line1,
    textX,
    midY - 18,
    COLORS.activeText,
    COLORS.primary,
    COLORS.accent,
    gLines,
  )
  drawGlitchText(
    ctx,
    copy.line2,
    textX,
    midY + 18,
    COLORS.activeText,
    COLORS.primary,
    COLORS.accent,
    gLines,
  )

  // Тонкий срез на вспышке
  if (g.spike) {
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = COLORS.activeText
    const cutY = titleY + g.jy + (g.slice > 0 ? 8 : -8)
    ctx.fillRect(titleX - 8, cutY, Math.min(420, W * 0.4), 2 + Math.abs(g.slice) * 0.3)
    ctx.restore()
  }

  ctx.restore()
}
