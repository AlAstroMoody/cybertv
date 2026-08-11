import type { RendererImages, RendererLayout } from './types'

export function drawTarotCards(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
): void {
  const cardWidth = 200
  const cardHeight = 300
  const gap = 30
  const startX = layout.W - cardWidth - 60
  const startY = 20

  images.displayTarotCards.forEach((card, i) => {
    const x = startX
    const y = startY + i * (cardHeight + gap)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(x + 8, y + 8, cardWidth, cardHeight)
    ctx.drawImage(card, x, y, cardWidth, cardHeight)
  })
}

export function pickTarotCards(cards: HTMLImageElement[]): HTMLImageElement[] {
  return [...cards].sort(() => Math.random() - 0.5).slice(0, 3)
}
