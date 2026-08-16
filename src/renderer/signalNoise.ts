import { COLORS } from '../constants/colors'
import type { RendererLayout } from './types'

/** Тёмный цифровой глитч на коннекте — без аналогового снега. */
export function drawSignalNoise(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  elapsedMs: number,
): void {
  const { W, H } = layout
  const t = elapsedMs / 1000

  ctx.save()
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, W, H)

  ctx.globalAlpha = 0.07
  ctx.fillStyle = '#000000'
  for (let y = (elapsedMs * 0.012) % 4; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1)
  }

  const bandH = Math.min(120, H * 0.16)
  const bandY = ((t * 28) % (H + bandH)) - bandH
  const sweep = ctx.createLinearGradient(0, bandY, 0, bandY + bandH)
  sweep.addColorStop(0, 'rgba(94, 246, 255, 0)')
  sweep.addColorStop(0.5, 'rgba(94, 246, 255, 0.05)')
  sweep.addColorStop(1, 'rgba(94, 246, 255, 0)')
  ctx.globalAlpha = 1
  ctx.fillStyle = sweep
  ctx.fillRect(0, bandY, W, bandH)

  const beat = Math.sin(t * 2.4)
  if (beat > 0.88) {
    const sliceY = H * (0.38 + Math.sin(t * 1.3) * 0.22)
    ctx.globalAlpha = 0.1
    ctx.fillStyle = COLORS.activeText
    ctx.fillRect(0, sliceY, W, 2)
    ctx.fillStyle = COLORS.primary
    ctx.globalAlpha = 0.07
    ctx.fillRect(10, sliceY + 3, W, 1)
  }

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.78)
  vignette.addColorStop(0, 'rgba(14, 14, 23, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
  ctx.globalAlpha = 1
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)

  ctx.restore()
}
