<template>
  <div class="tv-player">
    <video ref="videoRef" playsinline referrerpolicy="no-referrer" />

    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useChannelList } from '../composables/useChannelList'
import { usePlayer } from '../composables/usePlayer'
import { useNavigation } from '../composables/useNavigation'
import { useEventListener } from '../composables/useEventListener'
import { useSounds } from '../composables/useSounds'
import { CanvasRenderer } from '../renderer/canvasRenderer'
import { moveCategoryFocus } from '../renderer/categoriesView'
import { isTraceBurned, isTraceContact } from '../renderer/tracedView'
import { DECOY_M3U_URL } from '../constants/decoyPlaylist'
import { archivePlaylistUrl } from '../utils/archiveUrl'
import { isAccessCode } from '../utils/accessCode'
import { isFullscreen, isFullscreenKey, toggleFullscreen } from '../utils/fullscreen'

const M3U_URL = archivePlaylistUrl()

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
  setActiveIndex,
  deadUrls,
  markDead,
  markLive,
  nextLiveChannel,
} = useChannelList()

const {
  video: videoRef,
  setUrl,
  stop,
  fail,
  isPlaying,
  isBuffering,
  currentUrl,
  hasError: streamError,
} = usePlayer()

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
  startAmbient,
  setAmbientEnabled,
  silenceAmbient,
  setAlarmEnabled,
  startConnect,
  stopConnect,
  playAlert,
  stopAlert,
} = useSounds()

const canvasRef = ref<HTMLCanvasElement>()
const renderer = ref<CanvasRenderer>()
const bootProgress = ref(0)
const introElapsedMs = ref(0)
const uiVisible = ref(true)
const unlockDigits = ref('')
const unlockLocked = ref(false)
const realAccess = ref(false)
const menuSession = ref(false)
const tracedStartedAt = ref(0)
const NODE_COMMIT_MS = 1200
const CONNECT_DEAD_MS = 10_000
const nodeInput = ref('')
let nodeCommitTimer: ReturnType<typeof setTimeout> | null = null
let unlockHoldTimer: ReturnType<typeof setTimeout> | null = null
let connectDeadTimer: ReturnType<typeof setTimeout> | null = null
let lastZapDir: 1 | -1 = 1

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

function tryEnterUnlock() {
  if (phase.value !== 'intro') return
  if (!renderer.value?.isIntroMinDone()) return
  setPhase('unlock')
}

function digitFromEvent(e: KeyboardEvent): string | null {
  if (/^[0-9]$/.test(e.key)) return e.key
  const fromCode = e.code.match(/^(?:Digit|Numpad)([0-9])$/)
  if (fromCode?.[1]) return fromCode[1]
  const kc = e.keyCode || e.which
  if (kc >= 48 && kc <= 57) return String(kc - 48)
  if (kc >= 96 && kc <= 105) return String(kc - 96)
  return null
}

function clearNodeInput() {
  if (nodeCommitTimer != null) {
    clearTimeout(nodeCommitTimer)
    nodeCommitTimer = null
  }
  nodeInput.value = ''
}

function tuneChannel(channel: { name: string; url: string } | null) {
  if (!channel) return
  const alreadyOn =
    currentUrl.value === channel.url && (isPlaying.value || isBuffering.value)
  revealUi()
  showInfoBar.value = true
  if (alreadyOn) {
    scheduleHideUi()
    return
  }
  startConnect()
  setUrl(channel.url, true)
  armConnectDeadTimer(channel.url)
  scheduleHideUi()
}

function commitNodeInput() {
  const raw = nodeInput.value
  clearNodeInput()
  const total = filteredChannels.value.length
  const n = Number.parseInt(raw, 10)
  if (!total || !n) return

  const index = Math.min(n, total) - 1
  setActiveIndex(index)
  playSound('confirm')
  tuneChannel(filteredChannels.value[index] ?? null)
}

function appendNodeDigit(digit: string) {
  const total = filteredChannels.value.length
  if (total <= 0) return
  const maxDigits = Math.max(2, String(total).length)
  nodeInput.value = nodeInput.value.length >= maxDigits ? digit : nodeInput.value + digit
  revealUi()
  showInfoBar.value = true
  if (nodeCommitTimer != null) clearTimeout(nodeCommitTimer)
  nodeCommitTimer = setTimeout(() => {
    commitNodeInput()
  }, NODE_COMMIT_MS)
}

function resetUnlock() {
  unlockDigits.value = ''
  unlockLocked.value = false
  setPhase('unlock')
}

function rebootToIntro() {
  if (unlockHoldTimer != null) {
    clearTimeout(unlockHoldTimer)
    unlockHoldTimer = null
  }
  clearHideUiTimer()
  stop()
  stopConnect()
  stopAlert()
  setAlarmEnabled(false)
  silenceAmbient()
  unlockDigits.value = ''
  unlockLocked.value = false
  realAccess.value = false
  menuSession.value = false
  tracedStartedAt.value = 0
  bootProgress.value = 0
  uiVisible.value = true
  hideInfoBar()
  renderer.value?.resetBoot()
  clearNodeInput()
  clearConnectDeadTimer()
  setPhase('intro')
}

function clearConnectDeadTimer() {
  if (connectDeadTimer != null) {
    clearTimeout(connectDeadTimer)
    connectDeadTimer = null
  }
}

function armConnectDeadTimer(url: string) {
  clearConnectDeadTimer()
  connectDeadTimer = setTimeout(() => {
    connectDeadTimer = null
    if (phase.value !== 'player') return
    if (currentUrl.value !== url) return
    if (isPlaying.value || streamError.value) return
    fail()
  }, CONNECT_DEAD_MS)
}

function onDeadStream() {
  if (phase.value !== 'player') return
  const url = currentUrl.value
  if (url) markDead(url)
  const next = nextLiveChannel(lastZapDir)
  if (next) {
    queueMicrotask(() => tuneChannel(next))
    return
  }
  playAlert()
}

function submitUnlock(code: string) {
  unlockLocked.value = true
  if (isAccessCode(code)) {
    realAccess.value = true
    menuSession.value = true
    playSound('confirm')
    startAmbient('real')
    void loadM3U(M3U_URL)
    unlockHoldTimer = setTimeout(() => {
      setPhase('welcome')
    }, 320)
    return
  }

  if (Math.random() < 0.5) {
    tracedStartedAt.value = performance.now()
    setPhase('traced')
    return
  }

  menuSession.value = true
  playSound('confirm')
  startAmbient('decoy')
  void loadM3U(DECOY_M3U_URL)
  unlockHoldTimer = setTimeout(() => {
    setPhase('welcome')
  }, 320)
}

function handleResize() {
  renderer.value?.resize()
  render()
}

function isBackKey(key: string) {
  return key === 'Escape' || key === 'Backspace' || key === 'BrowserBack'
}

/** CH+/CH− пульта: 427/428 (CE-HTML), 166/167 (Android). */
function channelDeltaFromEvent(e: KeyboardEvent): 1 | -1 | null {
  const key = e.key
  const code = e.code
  const kc = e.keyCode || e.which
  if (key === 'ChannelUp' || code === 'ChannelUp' || kc === 427 || kc === 166) return 1
  if (key === 'ChannelDown' || code === 'ChannelDown' || kc === 428 || kc === 167) return -1
  return null
}

function zapChannel(delta: 1 | -1) {
  lastZapDir = delta
  playSound('click')
  const live = nextLiveChannel(delta)
  if (live) {
    tuneChannel(live)
    return
  }
  if (delta > 0) nextChannel()
  else prevChannel()
  tuneChannel(activeChannel.value)
}

function handleKeydown(e: KeyboardEvent) {
  const key = e.key
  const totalCategories = categoryOptions.value.length

  if (
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'ChannelUp', 'ChannelDown'].includes(
      key,
    ) ||
    isBackKey(key)
  ) {
    e.preventDefault()
  }

  unlockAudio()

  if (isFullscreenKey(e)) {
    e.preventDefault()
    void toggleFullscreen()
    return
  }

  if (isBackKey(key) && isFullscreen()) {
    e.preventDefault()
    void toggleFullscreen()
    return
  }

  if (phase.value === 'intro') {
    if (key === 'Enter') {
      playSound('confirm')
      bootProgress.value = 1
      setPhase('unlock')
    }
    return
  }

  if (phase.value === 'unlock') {
    if (unlockLocked.value) return

    if (key === 'ArrowLeft' || key === 'Backspace') {
      if (unlockDigits.value.length === 0) return
      playSound('back')
      unlockDigits.value = unlockDigits.value.slice(0, -1)
      return
    }

    const digit = digitFromEvent(e)
    if (!digit) return

    playSound('click')
    unlockDigits.value += digit
    if (unlockDigits.value.length >= 4) {
      submitUnlock(unlockDigits.value)
    }
    return
  }

  if (phase.value === 'traced') {
    if (isTraceContact(performance.now() - tracedStartedAt.value)) return
    if (key === 'Enter' || isBackKey(key)) {
      resetUnlock()
    }
    return
  }

  if (phase.value === 'welcome') {
    if (key === 'Enter' && !playlistError.value && !isLoading.value) {
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
  const channelDelta = channelDeltaFromEvent(e)
  if (channelDelta) {
    e.preventDefault()
    clearNodeInput()
    zapChannel(channelDelta)
    return
  }

  const nodeDigit = digitFromEvent(e)
  if (nodeDigit) {
    e.preventDefault()
    playSound('click')
    appendNodeDigit(nodeDigit)
    return
  }

  if (isBackKey(key)) {
    if (nodeInput.value) {
      playSound('back')
      clearNodeInput()
      return
    }
    playSound('back')
    clearHideUiTimer()
    clearConnectDeadTimer()
    stop()
    hideInfoBar()
    uiVisible.value = true
    setPhase('categories')
    return
  }

  if (key === 'ArrowDown') {
    clearNodeInput()
    playSound('click')
    revealUi()
    nextChannel()
    showInfoBar.value = true
  }

  if (key === 'ArrowUp') {
    clearNodeInput()
    playSound('click')
    revealUi()
    prevChannel()
    showInfoBar.value = true
  }

  if (key === 'Enter') {
    if (nodeInput.value) {
      commitNodeInput()
      return
    }

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

    tuneChannel(activeChannel.value)
  }
}

useEventListener(window, 'resize', handleResize)
useEventListener(document, 'fullscreenchange', handleResize)
useEventListener(document, 'keydown', handleKeydown)

onMounted(() => {
  if (canvasRef.value) {
    renderer.value = new CanvasRenderer(canvasRef.value)
    renderer.value.onReady(() => {
      renderer.value?.setFrameCallback(() => {
        const elapsed = renderer.value?.getIntroElapsedMs() ?? 0
        introElapsedMs.value = elapsed

        const timeProgress = Math.min(1, elapsed / 1800)
        bootProgress.value = Math.max(bootProgress.value, timeProgress)

        tryEnterUnlock()
        if (phase.value === 'traced' && tracedStartedAt.value) {
          const tracedElapsed = performance.now() - tracedStartedAt.value
          if (isTraceContact(tracedElapsed)) setAlarmEnabled(false)
          if (isTraceBurned(tracedElapsed)) rebootToIntro()
        }
        render()
      })
      render()
    })
  }
})

onUnmounted(() => {
  clearHideUiTimer()
  clearNodeInput()
  clearConnectDeadTimer()
  if (unlockHoldTimer != null) clearTimeout(unlockHoldTimer)
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
    unlockDigits: unlockDigits.value,
    tracedElapsedMs: tracedStartedAt.value ? performance.now() - tracedStartedAt.value : 0,
    realAccess: realAccess.value,
    nodeInput: nodeInput.value,
    deadUrls: deadUrls.value,
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
    unlockDigits,
    realAccess,
    nodeInput,
    deadUrls,
  ],
  () => {
    tryEnterUnlock()
    render()
  },
)

watch(
  () => phase.value,
  (appPhase) => {
    if (appPhase !== 'player') {
      clearNodeInput()
      clearConnectDeadTimer()
    }
    const tracedElapsed = tracedStartedAt.value ? performance.now() - tracedStartedAt.value : 0
    setAlarmEnabled(appPhase === 'traced' && !isTraceContact(tracedElapsed))
    setAmbientEnabled(menuSession.value && (appPhase === 'welcome' || appPhase === 'categories'))
  },
)

watch(isPlaying, (playing) => {
  if (playing && currentUrl.value) markLive(currentUrl.value)
  if (playing && phase.value === 'player') {
    uiVisible.value = true
    scheduleHideUi()
  } else {
    clearHideUiTimer()
    uiVisible.value = true
  }
})

watch(
  [isPlaying, isBuffering, hasError, phase],
  ([playing, buffering, error, appPhase]) => {
    const connected = playing && !buffering
    if (appPhase !== 'player' || error || connected) {
      stopConnect()
    }
    if (appPhase !== 'player') {
      stopAlert()
    }
  },
  { immediate: true },
)

watch(streamError, (error) => {
  if (error && phase.value === 'player') {
    onDeadStream()
  }
})
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
</style>
