import { COLORS } from '../constants/colors'
import type { DecorationRow } from './types'

export function generateDecorationRows(height: number): DecorationRow[] {
  const rows: DecorationRow[] = []
  const rowCount = Math.ceil(height / 5)

  for (let i = 0; i < rowCount; i++) {
    const width1 = Math.floor(Math.random() * 6) + 1
    const width2 = 8 - width1 - 1
    rows.push({ width1, width2 })
  }

  return rows
}

export function drawDecoration(
  ctx: CanvasRenderingContext2D,
  rows: DecorationRow[],
  progress = 1,
): void {
  const startX = 20
  const rectHeight = 3
  const rowGap = 2
  const visible = Math.floor(rows.length * Math.min(1, Math.max(0, progress)))

  ctx.fillStyle = COLORS.primary

  for (let i = 0; i < visible; i++) {
    const row = rows[i]
    if (!row) continue
    const y = i * (rectHeight + rowGap)
    ctx.fillRect(startX, y, row.width1, rectHeight)
    ctx.fillRect(startX + row.width1 + 1, y, row.width2, rectHeight)
  }
}
