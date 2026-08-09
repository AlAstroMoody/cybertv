import { ref, computed } from 'vue'

export interface Channel {
  name: string
  url: string
  program?: string
  group?: string
}

export function useChannelList() {
  const channels = ref<Channel[]>([])
  const activeIndex = ref(0)
  const categories = ref<string[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  const activeChannel = computed(() => channels.value[activeIndex.value] || null)

  const visibleChannels = computed(() => {
    // Логика вычисления видимых каналов
    // Будет использоваться в canvas renderer
    return channels.value
  })

  function parseM3U(content: string): Channel[] {
    const lines = content.split('\n')
    const parsedChannels: Channel[] = []
    let currentChannel: Channel | null = null

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('#EXTINF:')) {
        const info = trimmed.substring(8)
        const parts = info.split(',')
        const name = parts[parts.length - 1]?.trim() || 'Без названия'

        // Парсинг group-title
        const groupMatch = info.match(/group-title="([^"]*)"/)
        const group = groupMatch?.[1]

        currentChannel = {
          name,
          url: '',
          program: 'Прямой эфир',
          group,
        }
      } else if (!trimmed.startsWith('#') && currentChannel) {
        currentChannel.url = trimmed

        // Фильтрация рекламных и не-потоковых ссылок
        if (isValidStreamUrl(trimmed)) {
          parsedChannels.push(currentChannel)
        }
        currentChannel = null
      }
    }

    return parsedChannels
  }

  function isValidStreamUrl(url: string): boolean {
    // Исключаем Telegram ссылки
    if (url.includes('t.me') || url.includes('telegram')) {
      return false
    }

    // Исключаем ссылки без протокола
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false
    }

    // Оставляем только потоковые форматы
    const streamExtensions = ['.m3u8', '.mp4', '.ts', '.flv', '.mkv']
    const hasStreamExtension = streamExtensions.some(ext => url.includes(ext))

    // Если есть потоковое расширение или это потоковый URL
    return hasStreamExtension || url.includes('.m3u8') || url.includes('/stream')
  }

  async function loadM3U(url: string) {
    isLoading.value = true
    hasError.value = false

    try {
      const response = await fetch(url)
      const text = await response.text()
      channels.value = parseM3U(text)

      // Извлекаем уникальные категории
      const groups = new Set<string>()
      channels.value.forEach((ch) => {
        if (ch.group) groups.add(ch.group)
      })
      categories.value = Array.from(groups)

      return channels.value
    } catch (error) {
      console.error('Ошибка загрузки плейлиста:', error)
      hasError.value = true
      return []
    } finally {
      isLoading.value = false
    }
  }

  function setActiveIndex(index: number) {
    activeIndex.value = Math.max(0, Math.min(index, channels.value.length - 1))
  }

  function nextChannel() {
    setActiveIndex(activeIndex.value + 1)
  }

  function prevChannel() {
    setActiveIndex(activeIndex.value - 1)
  }

  return {
    channels,
    activeIndex,
    activeChannel,
    visibleChannels,
    categories,
    isLoading,
    hasError,
    loadM3U,
    setActiveIndex,
    nextChannel,
    prevChannel,
  }
}
