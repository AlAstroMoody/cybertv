import type { Channel } from '../composables/useChannelList'
import { COLORS } from '../constants/colors'
import { truncateText } from './text'
import type { RendererLayout } from './types'

export function drawInfoBar(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  channel: Channel,
): void {
  const fontSize = Math.min(28, layout.H / 24)
  const y = layout.H - 36
  const maxWidth = layout.W * 0.7

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${fontSize}px 'Cyberpunk'`

  const label = truncateText(ctx, channel.name, maxWidth)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.fillText(label, layout.W / 2 + 1, y + 1)

  ctx.fillStyle = COLORS.activeText
  ctx.fillText(label, layout.W / 2, y)

  const textW = Math.min(ctx.measureText(label).width, maxWidth)
  const lineY = y + fontSize * 0.55
  ctx.strokeStyle = COLORS.primary
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(layout.W / 2 - textW / 2, lineY)
  ctx.lineTo(layout.W / 2 + textW / 2, lineY)
  ctx.stroke()

  ctx.restore()
}
