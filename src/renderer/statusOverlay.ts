import { COLORS } from '../constants/colors'
import type { RendererImages, RendererLayout } from './types'

export function drawStatusOverlay(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
  kind: 'loading' | 'error',
  message: string,
): void {
  const boxWidth = 420
  const boxHeight = 120
  const x = (layout.W - boxWidth) / 2
  const y = (layout.H - boxHeight) / 2

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.fillRect(x, y, boxWidth, boxHeight)

  const icon = kind === 'error' ? images.error : images.performance
  if (icon) {
    const iconX = x + 24
    const iconY = y + 28
    const iconSize = 64
    ctx.drawImage(icon, iconX, iconY, iconSize, iconSize)

    if (kind === 'error' && images.chaos) {
      const chaosW = 59
      const chaosH = 6
      ctx.drawImage(
        images.chaos,
        iconX + (iconSize - chaosW) / 2,
        iconY + iconSize -10,
        chaosW,
        chaosH,
      )
    }
  }

  ctx.fillStyle = kind === 'error' ? COLORS.primary : COLORS.activeText
  ctx.font = `600 22px 'OpenSans'`
  ctx.fillText(message, x + 110, y + 70)
}
