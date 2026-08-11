import { COLORS } from '../constants/colors'
import type { RendererLayout } from './types'

const TITLE = 'Cyberpunk TV'

export function drawGlitchTitle(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  elapsedMs: number,
): void {
  const size = Math.min(72, layout.W / 11)
  const x = layout.W / 2
  const y = layout.H / 2
  const t = elapsedMs / 1000

  const spike = Math.sin(t * 23) > 0.88 || Math.sin(t * 11 + 1.7) > 0.93
  const jitterX = spike ? (Math.random() - 0.5) * 14 : Math.sin(t * 37) * 1.2
  const jitterY = spike ? (Math.random() - 0.5) * 6 : 0
  const slice = spike ? (Math.random() - 0.5) * 10 : 0

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${size}px 'Cyberpunk'`

  // RGB-сдвиг (глитч)
  ctx.globalAlpha = 0.45
  ctx.fillStyle = COLORS.activeText
  ctx.fillText(TITLE, x + jitterX + 3, y + jitterY)

  ctx.fillStyle = COLORS.primary
  ctx.fillText(TITLE, x + jitterX - 3, y + jitterY + slice)

  // Основной слой
  ctx.globalAlpha = 0.95
  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(TITLE, x + jitterX * 0.3, y + jitterY * 0.3)

  // Редкий «срез» по экрану
  if (spike) {
    const cutY = y + (Math.random() - 0.5) * size
    const cutH = 3 + Math.random() * 4
    ctx.globalAlpha = 0.35
    ctx.fillStyle = COLORS.accent
    ctx.fillRect(x - size * 3, cutY, size * 6, cutH)
  }

  ctx.restore()
}
