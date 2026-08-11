import { ref, computed } from 'vue'

export interface Channel {
  name: string
  url: string
  group?: string
}

export const ALL_CATEGORIES = '__all__'

function parseExtInf(info: string): { name: string; group?: string } {
  const tvgName = info.match(/tvg-name="([^"]*)"/)?.[1]?.trim()
  const group = info.match(/group-title="([^"]*)"/)?.[1]

  let inQuotes = false
  let lastComma = -1
  for (let i = 0; i < info.length; i++) {
    const char = info[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      lastComma = i
    }
  }

  const displayName = lastComma === -1 ? '' : info.slice(lastComma + 1).trim()

  return {
    name: tvgName || displayName || 'Без названия',
    group,
  }
}

export function useChannelList() {
  const channels = ref<Channel[]>([])
  const activeIndex = ref(0)
  const categories = ref<string[]>([])
  const selectedCategory = ref<string>(ALL_CATEGORIES)
  const isLoading = ref(false)
  const hasError = ref(false)

  const categoryOptions = computed(() => [ALL_CATEGORIES, ...categories.value])

  const filteredChannels = computed(() => {
    if (selectedCategory.value === ALL_CATEGORIES) return channels.value
    return channels.value.filter((ch) => ch.group === selectedCategory.value)
  })

  const activeChannel = computed(() => filteredChannels.value[activeIndex.value] || null)

  const visibleChannels = computed(() => filteredChannels.value)

  function parseM3U(content: string): Channel[] {
    const lines = content.split('\n')
    const parsedChannels: Channel[] = []
    let currentChannel: Channel | null = null

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('#EXTINF:')) {
        const { name, group } = parseExtInf(trimmed.substring(8))

        currentChannel = {
          name,
          url: '',
          group,
        }
      } else if (!trimmed.startsWith('#') && currentChannel) {
        currentChannel.url = trimmed

        if (isValidStreamUrl(trimmed)) {
          parsedChannels.push(currentChannel)
        }
        currentChannel = null
      }
    }

    return parsedChannels
  }

  function isValidStreamUrl(url: string): boolean {
    if (url.includes('t.me') || url.includes('telegram')) {
      return false
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false
    }

    const streamExtensions = ['.m3u8', '.mp4', '.ts', '.flv', '.mkv']
    const hasStreamExtension = streamExtensions.some((ext) => url.includes(ext))

    return hasStreamExtension || url.includes('.m3u8') || url.includes('/stream')
  }

  async function loadM3U(url: string) {
    isLoading.value = true
    hasError.value = false

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const text = await response.text()
      channels.value = parseM3U(text)

      if (channels.value.length === 0) {
        hasError.value = true
        return []
      }

      const groups = new Set<string>()
      channels.value.forEach((ch) => {
        if (ch.group) groups.add(ch.group)
      })
      categories.value = Array.from(groups).sort((a, b) => a.localeCompare(b, 'ru'))

      return channels.value
    } catch (error) {
      console.error('Ошибка загрузки плейлиста:', error)
      channels.value = []
      hasError.value = true
      return []
    } finally {
      isLoading.value = false
    }
  }

  function selectCategory(categoryId: string) {
    selectedCategory.value = categoryId
    activeIndex.value = 0
  }

  function setActiveIndex(index: number) {
    const total = filteredChannels.value.length
    if (total === 0) {
      activeIndex.value = 0
      return
    }
    activeIndex.value = ((index % total) + total) % total
  }

  function nextChannel() {
    setActiveIndex(activeIndex.value + 1)
  }

  function prevChannel() {
    setActiveIndex(activeIndex.value - 1)
  }

  return {
    channels,
    filteredChannels,
    activeIndex,
    activeChannel,
    visibleChannels,
    categories,
    categoryOptions,
    selectedCategory,
    isLoading,
    hasError,
    loadM3U,
    selectCategory,
    setActiveIndex,
    nextChannel,
    prevChannel,
  }
}
