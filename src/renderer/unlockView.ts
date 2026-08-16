import { COLORS } from '../constants/colors'
import type { RendererLayout } from './types'

const TITLE = 'ARASAKA'
const TAG = 'NETSEC  //  CC35  //  ICE-03'
const SUB = 'CORE TEAM  ·  DHSF 5TH CLASS'

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  weight = '600',
  family = 'OpenSans',
): number {
  let size = maxSize
  while (size > 11) {
    ctx.font = `${weight} ${size}px '${family}'`
    if (ctx.measureText(text).width <= maxWidth) return size
    size -= 1
  }
  ctx.font = `${weight} ${size}px '${family}'`
  return size
}

function drawHandheldGate(
  ctx: CanvasRenderingContext2D,
  W: number,
  rowY: number,
  slotH: number,
  g: { spike: boolean; jx: number; jy: number; slice: number },
): void {
  const maxW = W * 0.86
  const y = rowY + slotH * 0.36

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const titleSize = fitFont(ctx, 'HANDHELD RIG', maxW, Math.min(34, W / 14), 'bold', 'Cyberpunk')
  if (g.spike) {
    ctx.globalAlpha = 0.4
    ctx.fillStyle = COLORS.primary
    ctx.fillText('HANDHELD RIG', W / 2 + g.jx, y - titleSize * 1.15 + g.slice)
  }
  ctx.globalAlpha = 0.95
  ctx.fillStyle = COLORS.primary
  ctx.shadowColor = COLORS.primary
  ctx.shadowBlur = 14
  ctx.fillText('HANDHELD RIG', W / 2, y - titleSize * 1.15)

  ctx.shadowBlur = 0
  ctx.globalAlpha = 0.88
  ctx.fillStyle = COLORS.activeText
  const bodySize = fitFont(ctx, 'СО СТАЦИОНАРНЫХ ТЕРМИНАЛОВ', maxW, Math.min(22, W / 18))
  ctx.fillText('ВХОД ТОЛЬКО', W / 2, y + 6)
  ctx.fillText('СО СТАЦИОНАРНЫХ ТЕРМИНАЛОВ', W / 2, y + 6 + bodySize * 1.35)

  const sub = 'PC  ·  HARDLINE  ·  NO KEYPAD'
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(247, 80, 73, 0.5)'
  fitFont(ctx, sub, maxW, 13)
  ctx.fillText(sub, W / 2, y + 6 + bodySize * 2.7)
  ctx.restore()
}

function unlockGlitch(elapsedMs: number): { spike: boolean; jx: number; jy: number; slice: number } {
  const t = elapsedMs / 1000
  const spike = Math.sin(t * 3.1) > 0.93 || Math.sin(t * 1.9 + 0.4) > 0.96
  if (!spike) {
    return { spike: false, jx: 0, jy: 0, slice: 0 }
  }
  const seed = Math.floor(elapsedMs / 40)
  const n1 = Math.sin(seed * 12.9898) * 43758.5453
  const n2 = Math.sin(seed * 78.233) * 43758.5453
  const r1 = n1 - Math.floor(n1)
  const r2 = n2 - Math.floor(n2)
  return {
    spike: true,
    jx: (r1 - 0.5) * 10,
    jy: (r2 - 0.5) * 4,
    slice: (r1 - 0.5) * 7,
  }
}

export function drawUnlock(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  digits: string,
  elapsedMs: number,
  handheld = false,
): void {
  const { W, H } = layout
  const g = unlockGlitch(elapsedMs)
  const t = elapsedMs / 1000
  const locked = digits.length >= 4
  const activeIndex = locked ? -1 : digits.length

  const slotW = Math.min(92, W * 0.13)
  const slotH = slotW * 1.28
  const gap = slotW * 0.28
  const rowW = slotW * 4 + gap * 3
  const rowX = (W - rowW) / 2
  const rowY = H * 0.44

  ctx.save()

  const titleSize = Math.min(56, W / 14)
  const titleY = rowY - slotH * 0.85
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${titleSize}px 'Cyberpunk'`

  if (g.spike) {
    ctx.globalAlpha = 0.45
    ctx.fillStyle = COLORS.activeText
    ctx.fillText(TITLE, W / 2 + g.jx + 3, titleY + g.jy)
    ctx.fillStyle = COLORS.primary
    ctx.fillText(TITLE, W / 2 + g.jx - 3, titleY + g.jy + g.slice)
  }

  ctx.globalAlpha = 0.95
  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(TITLE, W / 2 + g.jx * 0.25, titleY + g.jy * 0.25)
  ctx.globalAlpha = 1

  ctx.font = `600 10px 'OpenSans'`
  ctx.fillStyle = 'rgba(247, 80, 73, 0.55)'
  ctx.fillText(TAG, W / 2, titleY + titleSize * 0.62)

  if (handheld) {
    drawHandheldGate(ctx, W, rowY, slotH, g)
    ctx.restore()
    return
  }

  for (let i = 0; i < 4; i++) {
    const x = rowX + i * (slotW + gap)
    const y = rowY
    const filled = i < digits.length
    const active = i === activeIndex
    const digit = digits[i] ?? ''

    const stroke = locked
      ? COLORS.accent
      : active
        ? COLORS.activeText
        : filled
          ? COLORS.activeText
          : COLORS.primary

    ctx.save()
    if (active || locked) {
      ctx.shadowColor = stroke
      ctx.shadowBlur = active ? 18 : 12
    }

    ctx.globalAlpha = locked ? 0.95 : active ? 0.95 : filled ? 0.8 : 0.4
    ctx.strokeStyle = stroke
    ctx.lineWidth = active || locked ? 2.5 : 1.5
    ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1)

    ctx.shadowBlur = 0
    ctx.globalAlpha = locked ? 0.12 : active ? 0.1 : 0.05
    ctx.fillStyle = stroke
    ctx.fillRect(x, y, slotW, slotH)
    ctx.restore()

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cx = x + slotW / 2
    const cy = y + slotH / 2

    if (filled) {
      const size = Math.round(slotH * 0.48)
      ctx.font = `600 ${size}px 'OpenSans'`
      if (g.spike && i === digits.length - 1) {
        ctx.globalAlpha = 0.45
        ctx.fillStyle = COLORS.primary
        ctx.fillText(digit, cx + g.jx, cy + g.slice)
        ctx.fillStyle = COLORS.accent
        ctx.fillText(digit, cx - g.jx, cy)
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = locked ? COLORS.accent : COLORS.activeText
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 16
      ctx.fillText(digit, cx, cy)
    } else if (active) {
      const pulse = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 5.2))
      ctx.globalAlpha = pulse
      ctx.fillStyle = COLORS.activeText
      ctx.fillRect(cx - 2, cy - slotH * 0.18, 4, slotH * 0.36)
    }
    ctx.restore()
  }

  const scanX = rowX + ((elapsedMs / 18) % (rowW + 40)) - 20
  ctx.save()
  ctx.beginPath()
  ctx.rect(rowX, rowY, rowW, slotH)
  ctx.clip()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = COLORS.activeText
  ctx.fillRect(scanX, rowY, 18, slotH)
  ctx.restore()

  ctx.font = `600 13px 'OpenSans'`
  ctx.fillStyle = 'rgba(247, 80, 73, 0.5)'
  ctx.fillText(SUB, W / 2, rowY + slotH + 38)

  if (g.spike) {
    ctx.globalAlpha = 0.28
    ctx.fillStyle = COLORS.activeText
    ctx.fillRect(W / 2 - rowW * 0.45, titleY + g.jy + (g.slice > 0 ? 6 : -6), rowW * 0.9, 2)
  }

  ctx.restore()
}
