import { COLORS } from '../constants/colors'
import type { RendererLayout } from './types'

const TITLE = 'TRACE'
const TAG = 'ICE BREACH  //  SOURCE PINNED'
const SUB = 'NCPD  ·  MAX-TAC  ·  EN ROUTE'
export const TRACE_ETA_MS = 30_000
export const TRACE_COLLAPSE_MS = 1400

export function isTraceContact(elapsedMs: number): boolean {
  return elapsedMs >= TRACE_ETA_MS
}

export function isTraceBurned(elapsedMs: number): boolean {
  return elapsedMs >= TRACE_ETA_MS + TRACE_COLLAPSE_MS
}

function noise(seed: number): number {
  const n = Math.sin(seed * 12.9898) * 43758.5453
  return n - Math.floor(n)
}

function formatEta(elapsedMs: number): string {
  const left = Math.max(0, Math.ceil((TRACE_ETA_MS - elapsedMs) / 1000))
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return left === 0 ? 'CONTACT' : `ETA ${mm}:${ss}`
}

export function drawTraced(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  digits: string,
  elapsedMs: number,
): void {
  const { W, H } = layout
  const t = elapsedMs / 1000
  const strobe = Math.sin(t * 11.2) > 0
  const wash = strobe ? 'rgba(247, 80, 73, 0.22)' : 'rgba(37, 112, 212, 0.16)'
  const seed = Math.floor(elapsedMs / 32)
  const jx = (noise(seed) - 0.5) * 14
  const jy = (noise(seed + 3) - 0.5) * 6
  const slice = (noise(seed + 7) - 0.5) * 10
  const spike = noise(seed + 11) > 0.72

  ctx.save()

  ctx.fillStyle = wash
  ctx.fillRect(0, 0, W, H)

  const barW = Math.max(10, W * 0.012)
  ctx.fillStyle = strobe ? COLORS.primary : COLORS.blue
  ctx.globalAlpha = 0.85
  ctx.fillRect(0, 0, barW, H)
  ctx.fillRect(W - barW, 0, barW, H)
  ctx.globalAlpha = 1

  if (spike) {
    const cutY = H * (0.2 + noise(seed + 19) * 0.6)
    ctx.globalAlpha = 0.35
    ctx.fillStyle = strobe ? COLORS.activeText : COLORS.primary
    ctx.fillRect(0, cutY, W, 3 + noise(seed + 23) * 8)
    ctx.globalAlpha = 1
  }

  const titleSize = Math.min(72, W / 10)
  const titleY = H * 0.34
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${titleSize}px 'Cyberpunk'`

  ctx.globalAlpha = 0.5
  ctx.fillStyle = COLORS.activeText
  ctx.fillText(TITLE, W / 2 + jx + 4, titleY + jy)
  ctx.fillStyle = COLORS.primary
  ctx.fillText(TITLE, W / 2 + jx - 4, titleY + jy + slice)

  ctx.globalAlpha = 0.95
  ctx.fillStyle = COLORS.primary
  ctx.shadowColor = COLORS.primary
  ctx.shadowBlur = 28
  ctx.fillText(TITLE, W / 2 + jx * 0.2, titleY + jy * 0.2)
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1

  ctx.font = `600 11px 'OpenSans'`
  ctx.fillStyle = strobe ? COLORS.primary : COLORS.activeText
  ctx.globalAlpha = 0.7
  ctx.fillText(TAG, W / 2, titleY + titleSize * 0.58)

  ctx.font = `600 22px 'OpenSans'`
  ctx.fillStyle = COLORS.textPrimary
  ctx.globalAlpha = 0.9
  ctx.shadowColor = strobe ? COLORS.primary : COLORS.blue
  ctx.shadowBlur = 16
  ctx.fillText(formatEta(elapsedMs), W / 2, titleY + titleSize * 0.95)
  ctx.shadowBlur = 0

  const slotW = Math.min(72, W * 0.1)
  const slotH = slotW * 1.2
  const gap = slotW * 0.24
  const rowW = slotW * 4 + gap * 3
  const rowX = (W - rowW) / 2
  const rowY = H * 0.58

  for (let i = 0; i < 4; i++) {
    const x = rowX + i * (slotW + gap)
    const digit = digits[i] ?? ''
    const ox = spike && i === seed % 4 ? jx * 0.4 : 0

    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.strokeStyle = strobe ? COLORS.primary : COLORS.blue
    ctx.lineWidth = 2
    ctx.shadowColor = ctx.strokeStyle
    ctx.shadowBlur = 12
    ctx.strokeRect(x + 0.5 + ox, rowY + 0.5, slotW - 1, slotH - 1)
    ctx.shadowBlur = 0
    ctx.globalAlpha = 0.08
    ctx.fillStyle = COLORS.primary
    ctx.fillRect(x + ox, rowY, slotW, slotH)
    ctx.restore()

    if (digit) {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `600 ${Math.round(slotH * 0.48)}px 'OpenSans'`
      ctx.fillStyle = COLORS.primary
      ctx.shadowColor = COLORS.primary
      ctx.shadowBlur = 14
      ctx.fillText(digit, x + slotW / 2 + ox, rowY + slotH / 2)
      ctx.restore()
    }
  }

  ctx.font = `600 13px 'OpenSans'`
  ctx.fillStyle = 'rgba(247, 80, 73, 0.65)'
  ctx.textAlign = 'center'
  ctx.fillText(SUB, W / 2, rowY + slotH + 36)

  ctx.font = `600 10px 'OpenSans'`
  ctx.fillStyle = 'rgba(247, 80, 73, 0.4)'
  ctx.fillText(`WATSON / GRID 7-19 / TK-${digits.padEnd(4, '·')}`, W / 2, rowY + slotH + 58)

  const collapse = Math.min(1, Math.max(0, (elapsedMs - TRACE_ETA_MS) / TRACE_COLLAPSE_MS))
  if (collapse > 0) {
    ctx.globalAlpha = collapse * 0.92
    ctx.fillStyle = '#0a0000'
    ctx.fillRect(0, 0, W, H)

    const rows = 18 + Math.floor(collapse * 40)
    for (let i = 0; i < rows; i++) {
      const y = noise(seed + i * 3) * H
      const h = 1 + noise(seed + i * 9) * (8 + collapse * 22)
      ctx.globalAlpha = 0.15 + collapse * 0.5 * noise(seed + i * 5)
      ctx.fillStyle = noise(seed + i) > 0.5 ? COLORS.primary : COLORS.textPrimary
      ctx.fillRect(0, y, W, h)
    }

    ctx.globalAlpha = collapse
    ctx.fillStyle = COLORS.primary
    ctx.font = `bold ${Math.min(64, W / 12)}px 'Cyberpunk'`
    ctx.fillText('CONTACT', W / 2 + (noise(seed) - 0.5) * 40 * collapse, H / 2)
  }

  ctx.restore()
}
