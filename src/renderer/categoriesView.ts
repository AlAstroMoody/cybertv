import { ALL_CATEGORIES } from '../composables/useChannelList'
import { COLORS } from '../constants/colors'
import { truncateText } from './text'
import type { RendererImages, RendererLayout } from './types'

function labelFor(id: string): string {
  return id === ALL_CATEGORIES ? 'Все каналы' : id
}

/**
 * Сетка из 2 колонок. ↑↓ — по строкам, ←→ — между колонками.
 * Навигация идёт по плоскому индексу; раскладка: index → (col, row).
 */
export function drawCategories(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
  categoryIds: string[],
  focusIndex: number,
  appearProgress: number,
): void {
  if (categoryIds.length === 0) return

  const { W, H } = layout
  const frame = images.categoryFrame
  const cols = 2
  const rows = Math.ceil(categoryIds.length / cols)
  // Уже рамка фокуса (ширина), пропорции SVG ~841:146
  const frameW = Math.min(340, W * 0.32)
  const frameH = frameW * (146 / 841)
  const colWidth = frameW
  const gapX = Math.min(100, W * 0.08)
  const rowH = Math.max(frameH + 18, Math.min(72, (H * 0.58) / Math.max(rows, 1)))
  const gridW = colWidth * cols + gapX
  const gridH = rowH * rows
  const originX = (W - gridW) / 2
  const originY = Math.max(H * 0.2, (H - gridH) / 2)

  // Держим строку с фокусом в видимой области
  const focusRow = Math.floor(focusIndex / cols)
  const maxVisibleRows = Math.max(3, Math.floor((H * 0.7) / rowH))
  let rowOffset = 0
  if (rows > maxVisibleRows) {
    rowOffset = Math.max(0, focusRow - Math.floor(maxVisibleRows / 2))
    rowOffset = Math.min(rowOffset, rows - maxVisibleRows)
  }

  ctx.save()
  ctx.globalAlpha = Math.min(1, appearProgress)

  for (let index = 0; index < categoryIds.length; index++) {
    const id = categoryIds[index]
    if (!id) continue

    const col = index % cols
    const row = Math.floor(index / cols)
    if (row < rowOffset || row >= rowOffset + maxVisibleRows) continue

    const isFocused = index === focusIndex
    const cellX = originX + col * (colWidth + gapX)
    const cellY = originY + (row - rowOffset) * rowH
    const stagger = Math.min(1, appearProgress * 1.3 - (row + col) * 0.04)

    ctx.save()
    ctx.globalAlpha = Math.min(1, appearProgress) * Math.max(0.25, stagger)

    const fontSize = isFocused ? 26 : 20
    ctx.font = `600 ${fontSize}px 'OpenSans'`
    ctx.fillStyle = isFocused ? COLORS.activeText : COLORS.primary
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const text = truncateText(ctx, labelFor(id), frameW - 36)

    if (isFocused && frame) {
      const frameX = cellX
      const frameY = cellY + (rowH - frameH) / 2
      ctx.drawImage(frame, frameX, frameY, frameW, frameH)
      ctx.fillText(text, frameX + frameW / 2, frameY + frameH / 2)
    } else {
      ctx.fillText(text, cellX + colWidth / 2, cellY + rowH / 2)
    }

    ctx.restore()
  }

  ctx.globalAlpha = Math.min(1, appearProgress) * 0.45
  ctx.font = `600 12px 'OpenSans'`
  ctx.fillStyle = COLORS.textMuted
  ctx.textAlign = 'center'
  ctx.fillText(`${focusIndex + 1} / ${categoryIds.length}`, W / 2, H * 0.9)

  ctx.restore()
}

/** Стрелки → плоский индекс в сетке 2 колонки */
export function moveCategoryFocus(
  current: number,
  total: number,
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
): number {
  if (total <= 0) return 0
  const cols = 2
  const col = current % cols
  const row = Math.floor(current / cols)
  const rows = Math.ceil(total / cols)

  let next = current

  if (key === 'ArrowLeft') {
    next = col === 0 ? current + 1 : current - 1
    if (next >= total) next = current
  } else if (key === 'ArrowRight') {
    next = col === 1 ? current - 1 : current + 1
    if (next >= total) next = current
  } else if (key === 'ArrowUp') {
    if (row > 0) next = current - cols
    else {
      const lastRow = rows - 1
      next = lastRow * cols + col
      if (next >= total) next = total - 1
    }
  } else if (key === 'ArrowDown') {
    next = current + cols
    if (next >= total) {
      next = col
      if (next >= total) next = 0
    }
  }

  return ((next % total) + total) % total
}
