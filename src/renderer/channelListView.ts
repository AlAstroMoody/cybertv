import type { Channel } from '../composables/useChannelList'
import { COLORS } from '../constants/colors'
import { truncateText } from './text'
import type { RendererImages, RendererLayout } from './types'

const emptyDead: ReadonlySet<string> = new Set()

/** Затемнение под список, чтобы текст читался на видео. */
export function drawChannelScrim(ctx: CanvasRenderingContext2D, layout: RendererLayout): void {
  const fadeW = Math.min(560, layout.W * 0.46)
  const gradient = ctx.createLinearGradient(0, 0, fadeW, 0)
  gradient.addColorStop(0, 'rgba(8, 8, 14, 0.96)')
  gradient.addColorStop(0.4, 'rgba(10, 10, 18, 0.88)')
  gradient.addColorStop(0.72, 'rgba(14, 14, 23, 0.45)')
  gradient.addColorStop(1, 'rgba(14, 14, 23, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, fadeW, layout.H)
}

export function drawChannelList(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
  channels: Channel[],
  activeIndex: number,
  deadUrls: ReadonlySet<string> = emptyDead,
): void {
  const { W, H, itemHeight } = layout
  const listWidth = 350
  const listTop = 20
  const itemTotalHeight = itemHeight + 8
  const visibleItems = Math.floor((H - listTop) / itemTotalHeight)

  if (images.listBackground) {
    ctx.drawImage(images.listBackground, 150, 0, listWidth, H)
  }

  const startIndex = Math.max(0, activeIndex - Math.floor(visibleItems / 2))
  const endIndex = Math.min(channels.length, startIndex + visibleItems + 1)

  for (let i = startIndex; i < endIndex; i++) {
    const channel = channels[i]
    if (!channel) continue

    const visibleIndex = i - startIndex
    const y = listTop + visibleIndex * itemTotalHeight
    drawChannelItem(
      ctx,
      layout,
      images,
      channel,
      i,
      y,
      listWidth,
      i === activeIndex,
      deadUrls.has(channel.url),
    )
  }

  void W
}

function drawChannelItem(
  ctx: CanvasRenderingContext2D,
  layout: RendererLayout,
  images: RendererImages,
  channel: Channel,
  index: number,
  y: number,
  listWidth: number,
  isActive: boolean,
  isDead: boolean,
): void {
  const fontSize = 28
  const centerY = y + layout.itemHeight / 2 + fontSize / 3
  const numberWidth = 50
  const frameX = layout.listX + numberWidth
  const frameWidth = Math.floor((listWidth - 80 - numberWidth) * 1.5)

  if (isActive && images.activeFrame) {
    ctx.drawImage(images.activeFrame, frameX, y, frameWidth, layout.itemHeight)
  }

  ctx.save()
  if (isDead) ctx.globalAlpha = isActive ? 0.55 : 0.32

  ctx.fillStyle = isActive ? COLORS.activeText : COLORS.textMuted
  ctx.font = `600 ${fontSize * 0.7}px 'OpenSans'`
  ctx.fillText(String(index + 1).padStart(2, '0'), layout.listX + 15, centerY)

  ctx.fillStyle = isDead ? COLORS.textMuted : isActive ? COLORS.activeText : COLORS.primary
  ctx.font = `600 ${fontSize}px 'OpenSans'`
  const text = truncateText(ctx, channel.name, frameWidth - 10)
  ctx.fillText(text, frameX + 10, centerY)
  ctx.restore()
}
