import { COLORS } from '../constants/colors'
import type { RendererImages, RendererLayout } from './types'

const DISCLAIMER =
  'ARASAKA CONSUMER TECHNOLOGY ONLY CC35 CERTIFIED, CORE TEAM MEMBERS AND DHSF 5TH CLASS OFFICERS ARE ALLOWED TO MANIPULATE, ACCESS OR DISABLE THESE DEVICE'

export function drawBootChrome(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
  bootProgress: number,
  opacity = 1,
): void {
  if (opacity <= 0) return

  ctx.save()
  ctx.globalAlpha = opacity

  const { W, H } = layout
  const line = images.frameLine
  const lineH = 16
  const lineYTop = 68
  const lineYBottom = H - 48 - lineH

  if (line) {
    const lineW = W * 0.95
    const lineX = (W - lineW) / 2
    ctx.drawImage(line, lineX, lineYTop, lineW, lineH)

    ctx.save()
    ctx.translate(lineX + lineW / 2, lineYBottom + lineH / 2)
    ctx.rotate(Math.PI)
    ctx.drawImage(line, -lineW / 2, -lineH / 2, lineW, lineH)
    ctx.restore()
  }

  // Маркеры сверху: ромб + структура + сигнальные штрихи
  const topX = 56
  const topY = 8
  if (images.diamond) {
    ctx.drawImage(images.diamond, topX, topY, 39, 39)
  }
  if (images.structure) {
    ctx.drawImage(images.structure, topX + 13.5, topY + 13.5, 12, 12)
  }
  if (images.signalBars) {
    ctx.drawImage(images.signalBars, topX + 48, topY + 10, 82, 23)
  }

  // Полоса опыта (правый верх)
  const xpX = W - 222 - 48
  const xpY = 38
  if (images.xpTrack) {
    ctx.drawImage(images.xpTrack, xpX, xpY, 222, 6)
  }
  if (images.xpFill) {
    const fillW = Math.max(2, 222 * Math.min(1, Math.max(0, bootProgress)))
    ctx.save()
    ctx.beginPath()
    ctx.rect(xpX, xpY + 2, fillW, 2)
    ctx.clip()
    ctx.drawImage(images.xpFill, xpX, xpY + 2, 87, 2)
    // заливка растёт по bootProgress
    ctx.fillStyle = COLORS.primary
    ctx.globalAlpha = opacity * 0.9
    ctx.fillRect(xpX, xpY + 2, fillW, 2)
    ctx.restore()
  }

  // Дисклеймер под нижней линией
  ctx.fillStyle = 'rgba(247, 80, 73, 0.55)'
  ctx.font = `600 8px 'OpenSans'`
  ctx.textAlign = 'center'
  ctx.fillText(DISCLAIMER, W / 2, lineYBottom + lineH)
  ctx.textAlign = 'left'

  ctx.restore()
}
