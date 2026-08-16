import type { RendererImages, RendererLayout } from './types'

export const TAROT_CARD_NAMES = [
  'Chariot',
  'Death',
  'Devil',
  'Emperor',
  'Empress',
  'Fool',
  'Hanged Man',
  'Hermit',
  'Hierophant',
  'High Priestess',
  'Justice',
  'Lovers',
  'Magician',
  'Moon',
  'Star',
  'Strenght',
  'Sun',
  'Temperance',
  'Tower',
  'Wheel of Fortune',
] as const

export type TarotName = (typeof TAROT_CARD_NAMES)[number]
export type TarotLayout = 'column' | 'fan' | 'flank'

function dayStamp(now = new Date()): number {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function named(images: RendererImages, name: TarotName): HTMLImageElement | null {
  return images.tarotByName[name] ?? null
}

export function tarotForWelcome(images: RendererImages, realAccess: boolean): HTMLImageElement[] {
  if (!realAccess) return compact([named(images, 'Fool')])
  return pickDailySpread(images)
}

export function tarotForPlayer(images: RendererImages, realAccess: boolean): HTMLImageElement[] {
  return tarotForWelcome(images, realAccess)
}

export function tarotForTrace(images: RendererImages): HTMLImageElement[] {
  return compact([named(images, 'Death'), named(images, 'Tower')])
}

function compact(cards: Array<HTMLImageElement | null>): HTMLImageElement[] {
  return cards.filter((card): card is HTMLImageElement => card != null)
}

export function pickDailySpread(images: RendererImages, now = new Date()): HTMLImageElement[] {
  const pool = TAROT_CARD_NAMES.filter((name) => name !== 'Fool')
    .map((name) => named(images, name))
    .filter((card): card is HTMLImageElement => card != null)

  const rng = mulberry32(dayStamp(now))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = pool[i]
    const b = pool[j]
    if (a && b) {
      pool[i] = b
      pool[j] = a
    }
  }
  return pool.slice(0, 3)
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  card: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  angle = 0,
  alpha = 1,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x + w / 2, y + h / 2)
  ctx.rotate((angle * Math.PI) / 180)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.fillRect(-w / 2 + 6, -h / 2 + 6, w, h)
  ctx.drawImage(card, -w / 2, -h / 2, w, h)
  ctx.restore()
}

export function drawTarotCards(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  cards: HTMLImageElement[],
  kind: TarotLayout,
): void {
  if (cards.length === 0) return

  const { W, H } = layout

  if (kind === 'flank') {
    const cardW = Math.min(280, W * 0.22)
    const cardH = cardW * 1.5
    const y = Math.max(16, H * 0.1)
    const left = cards[0]
    const right = cards[1] ?? cards[0]
    if (left) drawCard(ctx, left, W * 0.035, y, cardW, cardH, -5, 0.92)
    if (right) drawCard(ctx, right, W - cardW - W * 0.035, y, cardW, cardH, 5, 0.92)
    return
  }

  if (kind === 'fan') {
    const single = cards.length === 1
    const cardW = single ? Math.min(300, W * 0.24) : Math.min(148, W * 0.13)
    const cardH = cardW * 1.5
    const originX = single ? W - cardW - W * 0.07 : W * 0.72
    const originY = single ? (H - cardH) / 2 : H * 0.28
    const angles = single ? [0] : [-11, 0, 11]
    cards.forEach((card, i) => {
      const x = originX + (single ? 0 : i * (cardW * 0.22))
      const y = originY + (single ? 0 : Math.abs(i - 1) * 10)
      drawCard(ctx, card, x, y, cardW, cardH, angles[i] ?? 0, 0.95)
    })
    return
  }

  const single = cards.length === 1
  const cardW = single ? Math.min(320, W * 0.26) : 200
  const cardH = cardW * 1.5
  const gap = 24
  const startX = W - cardW - 60
  const stackH = cards.length * cardH + (cards.length - 1) * gap
  const startY = cards.length === 1 ? (H - cardH) / 2 : 20
  const y0 = cards.length === 1 ? startY : Math.max(20, (H - stackH) / 2)

  cards.forEach((card, i) => {
    drawCard(ctx, card, startX, y0 + i * (cardH + gap), cardW, cardH)
  })
}
