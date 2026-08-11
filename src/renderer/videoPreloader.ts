import type { RendererImages, RendererLayout } from './types'

const ICON_SIZE = 56
const ROTATE_MS = 1000
/** Доля секунды на движение; остальное — пауза на вершине */
const MOVE_RATIO = 0.7

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function pentagonPoint(cx: number, cy: number, radius: number, slot: number, count: number) {
  const angle = -Math.PI / 2 + (slot * 2 * Math.PI) / count
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  }
}

export function drawVideoPreloader(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
  nowMs = performance.now(),
): void {
  const icons = images.preloaderIcons
  if (icons.length === 0) return

  const count = icons.length
  const cx = layout.W / 2
  const cy = layout.H / 2
  const radius = Math.min(layout.W, layout.H) * 0.14

  const cycle = nowMs / ROTATE_MS
  const step = Math.floor(cycle)
  const rawT = cycle - step
  // Движение MOVE_RATIO доли секунды, потом пауза
  const t = rawT < MOVE_RATIO ? easeInOutCubic(rawT / MOVE_RATIO) : 1

  ctx.save()

  const pulse = 0.12 + 0.06 * Math.sin(nowMs / 280)
  ctx.fillStyle = `rgba(14, 14, 23, ${pulse})`
  ctx.beginPath()
  ctx.arc(cx, cy, radius + ICON_SIZE, 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < count; i++) {
    const icon = icons[i]
    if (!icon) continue

    const fromSlot = (i + step) % count
    const toSlot = (i + step + 1) % count
    const from = pentagonPoint(cx, cy, radius, fromSlot, count)
    const to = pentagonPoint(cx, cy, radius, toSlot, count)

    const x = from.x + (to.x - from.x) * t
    const y = from.y + (to.y - from.y) * t

    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(nowMs / 400 + i)
    ctx.drawImage(icon, x - ICON_SIZE / 2, y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE)
  }

  ctx.restore()
}
