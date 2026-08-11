<template>
  <div class="tv-player">
    <video ref="videoRef" playsinline />

    <audio ref="clickRef" :src="SOUND_SRCS.click" preload="auto" />
    <audio ref="confirmRef" :src="SOUND_SRCS.confirm" preload="auto" />
    <audio ref="backRef" :src="SOUND_SRCS.back" preload="auto" />

    <canvas ref="canvasRef" />

    <div class="hint" v-if="phase === 'player' && uiVisible && !isPlaying">
      ▲ ▼ канал • ENTER — эфир • BACK — категории
    </div>
    <div class="hint" v-else-if="phase === 'categories'">
      ▲ ▼ ← → категория • ENTER — выбрать • BACK — назад
    </div>
    <div class="hint" v-else-if="phase === 'welcome' && !playlistError">
      ENTER — категории
    </div>
    <div class="hint" v-else-if="phase === 'welcome' && playlistError">
      плейлист недоступен
    </div>
    <div class="hint" v-else-if="phase === 'intro' && !isLoading">
      ENTER — далее
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useChannelList } from '../composables/useChannelList'
import { usePlayer } from '../composables/usePlayer'
import { useNavigation } from '../composables/useNavigation'
import { useEventListener } from '../composables/useEventListener'
import { SOUND_SRCS, useSounds } from '../composables/useSounds'
import { CanvasRenderer } from '../renderer/canvasRenderer'
import { moveCategoryFocus } from '../renderer/categoriesView'

const M3U_URL = 'https://loganettv.github.io/playlists/all.m3u'

const {
  filteredChannels,
  activeIndex,
  activeChannel,
  isLoading,
  hasError: playlistError,
  loadM3U,
  nextChannel,
  prevChannel,
  categoryOptions,
  selectCategory,
} = useChannelList()

const { video: videoRef, setUrl, stop, isPlaying, isBuffering, currentUrl, hasError: streamError } =
  usePlayer()

const {
  phase,
  showInfoBar,
  categoryFocusIndex,
  setPhase,
  hideInfoBar,
} = useNavigation()

const {
  play: playSound,
  unlock: unlockAudio,
  setAmbientEnabled,
} = useSounds()

const canvasRef = ref<HTMLCanvasElement>()
const renderer = ref<CanvasRenderer>()
const bootProgress = ref(0)
const introElapsedMs = ref(0)
const uiVisible = ref(true)

const UI_HIDE_MS = 5000
let hideUiTimer: ReturnType<typeof setTimeout> | null = null

function clearHideUiTimer() {
  if (hideUiTimer != null) {
    clearTimeout(hideUiTimer)
    hideUiTimer = null
  }
}

function scheduleHideUi() {
  clearHideUiTimer()
  if (!isPlaying.value || phase.value !== 'player') return
  hideUiTimer = setTimeout(() => {
    uiVisible.value = false
    hideInfoBar()
  }, UI_HIDE_MS)
}

function revealUi() {
  uiVisible.value = true
  clearHideUiTimer()
  if (isPlaying.value && phase.value === 'player') {
    scheduleHideUi()
  }
}

const hasError = computed(() => {
  if (phase.value === 'player') return streamError.value
  return playlistError.value
})

function tryEnterWelcome() {
  if (phase.value !== 'intro') return
  if (isLoading.value) return
  if (!renderer.value?.isIntroMinDone()) return
  setPhase('welcome')
}

function handleResize() {
  renderer.value?.resize()
  render()
}

function isBackKey(key: string) {
  return key === 'Escape' || key === 'Backspace' || key === 'BrowserBack'
}

function handleKeydown(e: KeyboardEvent) {
  const key = e.key
  const totalCategories = categoryOptions.value.length

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key) || isBackKey(key)) {
    e.preventDefault()
  }

  unlockAudio()

  if (phase.value === 'intro') {
    if (key === 'Enter' && !isLoading.value) {
      playSound('confirm')
      bootProgress.value = 1
      setPhase('welcome')
    }
    return
  }

  if (phase.value === 'welcome') {
    if (key === 'Enter' && !playlistError.value) {
      playSound('confirm')
      categoryFocusIndex.value = 0
      setPhase('categories')
    }
    return
  }

  if (phase.value === 'categories') {
    if (isBackKey(key)) {
      playSound('back')
      setPhase('welcome')
      return
    }
    if (
      key === 'ArrowDown' ||
      key === 'ArrowUp' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight'
    ) {
      playSound('click')
      categoryFocusIndex.value = moveCategoryFocus(
        categoryFocusIndex.value,
        totalCategories,
        key,
      )
    }
    if (key === 'Enter') {
      const selected = categoryOptions.value[categoryFocusIndex.value]
      if (selected) {
        playSound('confirm')
        selectCategory(selected)
        setPhase('player')
      }
    }
    return
  }

  // плеер
  if (isBackKey(key)) {
    playSound('back')
    clearHideUiTimer()
    stop()
    hideInfoBar()
    uiVisible.value = true
    setPhase('categories')
    return
  }

  if (key === 'ArrowDown') {
    playSound('click')
    revealUi()
    nextChannel()
    showInfoBar.value = true
  }

  if (key === 'ArrowUp') {
    playSound('click')
    revealUi()
    prevChannel()
    showInfoBar.value = true
  }

  if (key === 'Enter') {
    // Скрытый UI: только показать меню + инфо, канал не трогаем
    if (!uiVisible.value) {
      playSound('click')
      revealUi()
      showInfoBar.value = true
      return
    }

    if (!activeChannel.value) return

    const alreadyOnChannel =
      currentUrl.value === activeChannel.value.url && (isPlaying.value || isBuffering.value)

    // Тот же канал в эфире: OK скрывает UI
    if (alreadyOnChannel) {
      playSound('confirm')
      clearHideUiTimer()
      uiVisible.value = false
      hideInfoBar()
      return
    }

    playSound('confirm')
    setUrl(activeChannel.value.url, true)
    showInfoBar.value = true
    scheduleHideUi()
  }
}

useEventListener(window, 'resize', handleResize)
useEventListener(document, 'keydown', handleKeydown)

onMounted(() => {
  if (canvasRef.value) {
    renderer.value = new CanvasRenderer(canvasRef.value)
    renderer.value.onReady(() => {
      renderer.value?.setFrameCallback(() => {
        const elapsed = renderer.value?.getIntroElapsedMs() ?? 0
        introElapsedMs.value = elapsed

        const timeProgress = Math.min(1, elapsed / 1800)
        const loadProgress = isLoading.value ? Math.min(0.85, timeProgress) : 1
        bootProgress.value = Math.max(bootProgress.value, Math.min(timeProgress, loadProgress))
        if (!isLoading.value && !playlistError.value) {
          bootProgress.value = Math.max(bootProgress.value, timeProgress)
        }

        tryEnterWelcome()
        render()
      })
      render()
    })
  }

  void loadM3U(M3U_URL)
})

onUnmounted(() => {
  clearHideUiTimer()
  renderer.value?.destroy()
})

function render() {
  if (!renderer.value) return

  renderer.value.render({
    phase: phase.value,
    channels: filteredChannels.value,
    activeIndex: activeIndex.value,
    showInfoBar: showInfoBar.value,
    currentChannel: activeChannel.value,
    isPlaying: isPlaying.value,
    isLoading: isLoading.value,
    hasError: hasError.value,
    categories: categoryOptions.value,
    categoryFocusIndex: categoryFocusIndex.value,
    bootProgress: bootProgress.value,
    introElapsedMs: introElapsedMs.value,
    uiVisible: uiVisible.value,
    isBuffering: isBuffering.value,
  })
}

watch(
  [
    phase,
    activeIndex,
    showInfoBar,
    isPlaying,
    isLoading,
    hasError,
    categoryFocusIndex,
    filteredChannels,
    categoryOptions,
    uiVisible,
    isBuffering,
  ],
  () => {
    tryEnterWelcome()
    render()
  },
)

watch(isPlaying, (playing) => {
  if (playing && phase.value === 'player') {
    uiVisible.value = true
    scheduleHideUi()
  } else {
    clearHideUiTimer()
    uiVisible.value = true
  }
})

// Фон крутится до видео; на буфере/эфире — тишина меню
watch(
  [isPlaying, isBuffering, phase],
  ([playing, buffering, appPhase]) => {
    const videoLive = appPhase === 'player' && (playing || buffering)
    setAmbientEnabled(!videoLive)
  },
  { immediate: true },
)
</script>

<style scoped>
.tv-player {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.hint {
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 24px;
  border-radius: 30px;
  letter-spacing: 1px;
  pointer-events: none;
  font-family: monospace;
  transition: opacity 0.3s;
}
</style>
