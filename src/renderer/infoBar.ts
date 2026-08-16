import type { Channel } from '../composables/useChannelList'
import { COLORS } from '../constants/colors'
import { truncateText } from './text'
import type { RendererLayout } from './types'

function hashStr(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (h * 33 + value.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function telemetryLine(
  channel: Channel,
  realAccess: boolean,
  isBuffering: boolean,
  hasError: boolean,
): string {
  if (!realAccess) return 'GUEST  ·  OPEN CONTOUR  ·  CLEAR'

  const n = hashStr(channel.url || channel.name)
  const relay = (n % 6) + 1
  const ice = 8 + (n % 37)
  const link = hasError ? 'LINK DEAD' : isBuffering ? 'PACKET LOSS' : n % 5 === 0 ? 'JITTER' : 'CLEAR PATH'
  return `RELAY ${relay}  ·  ICE ${ice}%  ·  ${link}`
}

export function drawInfoBar(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  channel: Channel,
  realAccess: boolean,
  isBuffering: boolean,
  hasError: boolean,
): void {
  const fontSize = Math.min(28, layout.H / 24)
  const y = layout.H - 48
  const maxWidth = layout.W * 0.78
  const telemetry = telemetryLine(channel, realAccess, isBuffering, hasError)

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
  const lineY = y + fontSize * 0.5
  ctx.strokeStyle = COLORS.primary
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(layout.W / 2 - textW / 2, lineY)
  ctx.lineTo(layout.W / 2 + textW / 2, lineY)
  ctx.stroke()

  ctx.globalAlpha = 0.75
  ctx.font = `600 ${Math.max(10, Math.round(fontSize * 0.42))}px 'OpenSans'`
  ctx.fillStyle = realAccess ? COLORS.primary : COLORS.activeText
  ctx.fillText(telemetry, layout.W / 2, lineY + 14)

  ctx.restore()
}

export function drawNodeTune(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  digits: string,
  realAccess: boolean,
): void {
  if (!digits) return

  const label = realAccess ? `NODE ${digits}` : `CH ${digits}`
  const size = Math.min(52, layout.W / 14)
  const x = layout.W / 2
  const y = layout.H * 0.18

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${size}px 'Cyberpunk'`
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillText(label, x + 2, y + 2)
  ctx.fillStyle = realAccess ? COLORS.activeText : COLORS.primary
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = 18
  ctx.fillText(label, x, y)
  ctx.restore()
}
