import type { Channel } from '../composables/useChannelList'
import { COLORS } from '../constants/colors'

export interface RendererState {
  channels: Channel[]
  activeIndex: number
  showInfoBar: boolean
  currentChannel: Channel | null
  isPlaying: boolean
  isLoading: boolean
  hasError: boolean
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private W = 0
  private H = 0
  private listX = 40
  private itemHeight = 60
  private fontSize = 22
  private activeFrameImage: HTMLImageElement | null = null
  private listBackgroundImage: HTMLImageElement | null = null
  private tarotCards: HTMLImageElement[] = []
  private performanceIcon: HTMLImageElement | null = null
  private chaosIcon: HTMLImageElement | null = null
  private errorIcon: HTMLImageElement | null = null
  private imagesLoaded = false
  private onImagesLoadedCallback: (() => void) | null = null
  private decorationRows: Array<{ width1: number; width2: number }> = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get canvas context')
    this.ctx = ctx
    this.resize()
    this.generateDecoration()
    this.loadResources()
  }

  private generateDecoration() {
    this.decorationRows = []
    const rowCount = Math.ceil(this.H / 5) // 3px высота + 2px отступ между строками

    for (let i = 0; i < rowCount; i++) {
      const width1 = Math.floor(Math.random() * 6) + 1 // 1-6px
      const width2 = 8 - width1 - 1 // чтобы общая ширина была 8px (width1 + 1px отступ + width2)
      this.decorationRows.push({ width1, width2 })
    }
  }

  onImagesLoaded(callback: () => void) {
    this.onImagesLoadedCallback = callback
  }

  private async loadResources() {
    // Ждём загрузки конкретных шрифтов с проверкой
    await document.fonts.load("16px 'OpenSans'")
    await document.fonts.load("16px 'Cyberpunk'")

    // Проверяем, что шрифты действительно загружены
    while (!document.fonts.check("16px 'OpenSans'") || !document.fonts.check("16px 'Cyberpunk'")) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // Загружаем изображения
    this.activeFrameImage = new Image()
    this.activeFrameImage.src = '/images/active.svg'
    await this.activeFrameImage.decode()

    this.listBackgroundImage = new Image()
    this.listBackgroundImage.src = '/images/Rectangle.svg'
    await this.listBackgroundImage.decode()

    this.performanceIcon = new Image()
    this.performanceIcon.src = '/images/performance.svg'
    await this.performanceIcon.decode()

    this.chaosIcon = new Image()
    this.chaosIcon.src = '/images/chaos.svg'
    await this.chaosIcon.decode()

    this.errorIcon = new Image()
    this.errorIcon.src = '/favicon/android-chrome-192x192.png'
    await this.errorIcon.decode()

    // Загружаем карты таро
    const cardNames = [
      'Chariot',
      'Death',
      'Devil',
      'Emperor',
      'Empress',
      'Fool',
      'Hanged Man',
      'Hermit',
      'Hierophant',
      'High Priestess',
      'Justice',
      'Lovers',
      'Magician',
      'Moon',
      'Star',
      'Strenght',
      'Sun',
      'Temperance',
      'Tower',
      'Wheel of Fortune',
    ]

    for (const name of cardNames) {
      const img = new Image()
      img.src = `/images/cards/${name}.png`
      await img.decode()
      this.tarotCards.push(img)
    }

    this.imagesLoaded = true
    this.onImagesLoadedCallback?.()
  }

  resize() {
    this.W = window.innerWidth
    this.H = window.innerHeight
    this.canvas.width = this.W
    this.canvas.height = this.H

    this.listX = 40
    this.itemHeight = Math.min(60, this.H / 15)
    this.fontSize = Math.min(22, this.itemHeight * 0.45)
    this.generateDecoration()
  }

  render(state: RendererState) {
    if (!this.imagesLoaded) return

    this.ctx.clearRect(0, 0, this.W, this.H)

    this.renderDecoration()

    if (!state.isPlaying) {
      this.renderTarotCards()
    }

    this.renderChannelList(state)

    if (state.showInfoBar && state.currentChannel) {
      this.renderInfoBar(state.currentChannel)
    }
  }

  private renderDecoration() {
    const startX = 20
    const startY = 0
    const rectHeight = 3
    const rowGap = 2
    const rectGap = 1

    this.ctx.fillStyle = COLORS.primary

    this.decorationRows.forEach((row, i) => {
      const y = startY + i * (rectHeight + rowGap)

      // Первый прямоугольник
      this.ctx.fillRect(startX, y, row.width1, rectHeight)

      // Второй прямоугольник
      const secondX = startX + row.width1 + rectGap
      this.ctx.fillRect(secondX, y, row.width2, rectHeight)
    })
  }

  private renderTarotCards() {
    const cardWidth = 200
    const cardHeight = 300
    const gap = 30
    const startX = this.W - cardWidth - 60
    const startY = 60

    // Отображаем 3 случайные карты
    const shuffled = [...this.tarotCards].sort(() => Math.random() - 0.5)
    const cardsToShow = shuffled.slice(0, 3)

    cardsToShow.forEach((card, i) => {
      const x = startX
      const y = startY + i * (cardHeight + gap)

      // Тень
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      this.ctx.fillRect(x + 8, y + 8, cardWidth, cardHeight)

      // Карта
      this.ctx.drawImage(card, x, y, cardWidth, cardHeight)
    })
  }

  private renderChannelList(state: RendererState) {
    const listWidth = 350
    const listTop = 60
    const listBottom = this.H
    const visibleHeight = listBottom - listTop
    const itemTotalHeight = this.itemHeight + 8
    const visibleItems = Math.floor(visibleHeight / itemTotalHeight)

    // Фон списка - Rectangle.svg на всю высоту
    this.ctx.drawImage(this.listBackgroundImage!, 150, 0, listWidth, this.H)

    // Вычисляем диапазон видимых элементов
    const startIndex = Math.max(0, state.activeIndex - Math.floor(visibleItems / 2))
    const endIndex = Math.min(state.channels.length, startIndex + visibleItems + 1)

    state.channels.forEach((channel, i) => {
      if (i < startIndex || i >= endIndex) return

      const visibleIndex = i - startIndex
      const y = listTop + visibleIndex * itemTotalHeight
      const isActive = i === state.activeIndex

      this.renderChannelItem(channel, i, y, listWidth, isActive)
    })
  }

  private renderChannelItem(
    channel: Channel,
    index: number,
    y: number,
    listWidth: number,
    isActive: boolean,
  ) {
    const fontSize = 28
    const centerY = y + this.itemHeight / 2 + fontSize / 3
    const numberWidth = 50
    const frameX = this.listX + numberWidth
    const frameWidth = Math.floor((listWidth - 80 - numberWidth) * 1.5)

    if (isActive) {
      // Рисуем SVG рамку для активного элемента (сдвигаем правее номера)
      this.ctx.drawImage(this.activeFrameImage!, frameX, y, frameWidth, this.itemHeight)
      this.ctx.fillStyle = COLORS.activeText
      this.ctx.font = `600 ${fontSize}px 'OpenSans'`
    } else {
      // Неактивные - без фона и рамки
      this.ctx.fillStyle = COLORS.primary
      this.ctx.font = `600 ${fontSize}px 'OpenSans'`
    }

    // Номер (левее SVG рамки)
    this.ctx.fillStyle = isActive ? COLORS.activeText : COLORS.textMuted
    this.ctx.font = `600 ${fontSize * 0.7}px 'OpenSans'`
    this.ctx.fillText(String(index + 1).padStart(2, '0'), this.listX + 15, centerY)

    // Название (внутри SVG рамки)
    this.ctx.fillStyle = isActive ? COLORS.activeText : COLORS.primary
    this.ctx.font = isActive ? `600 ${fontSize}px 'OpenSans'` : `600 ${fontSize}px 'OpenSans'`

    // Обрезаем длинные названия
    const maxWidth = frameWidth - 10
    const text = this.truncateText(channel.name, maxWidth)
    this.ctx.fillText(text, frameX + 10, centerY)
  }

  private truncateText(text: string, maxWidth: number): string {
    const metrics = this.ctx.measureText(text)
    if (metrics.width <= maxWidth) return text

    let truncated = text
    while (this.ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '...'
  }

  private renderInfoBar(channel: Channel) {
    const barHeight = 110
    const barWidth = 1200
    const y = this.H - barHeight

    // Градиентный фон
    const grad = this.ctx.createLinearGradient(0, y, 0, this.H)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(0.1, 'rgba(0,0,0,0.85)')
    grad.addColorStop(1, 'rgba(0,0,0,0.95)')
    this.ctx.fillStyle = grad
    this.ctx.fillRect(500, y, barWidth, barHeight)

    // Название канала
    this.ctx.fillStyle = COLORS.textPrimary
    this.ctx.font = `bold ${Math.min(32, this.H / 20)}px 'Cyberpunk'`
    this.ctx.fillText(channel.name, 600, y + 45)

    // Программа
    this.ctx.fillStyle = COLORS.textSecondary
    this.ctx.font = `${Math.min(20, this.H / 30)}px 'OpenSans'`
    this.ctx.fillText(channel.program || 'Идёт прямой эфир', 600, y + 82)

    // Подсказка
    this.ctx.fillStyle = COLORS.textMuted
    this.ctx.font = '14px OpenSans'
    this.ctx.fillText('ⓘ  нажмите ENTER ещё раз, чтобы скрыть', barWidth - 260, y + 40)
  }
}
