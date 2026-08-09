<template>
  <div class="tv-player">
    <video ref="videoRef" loop @loadedmetadata="onVideoLoaded" />

    <canvas ref="canvasRef" />

    <div class="hint" v-if="!isPlaying">▲ ▼ выбор • ENTER переключить • повторный ENTER — инфо</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useChannelList } from '../composables/useChannelList'
import { usePlayer } from '../composables/usePlayer'
import { useNavigation } from '../composables/useNavigation'
import { CanvasRenderer } from '../renderer/canvasRenderer'

const M3U_URL = 'https://loganettv.github.io/playlists/all.m3u'

const { channels, activeIndex, activeChannel, isLoading, hasError, loadM3U, nextChannel, prevChannel } =
  useChannelList()

const { video: videoRef, play, setUrl, isPlaying } = usePlayer()
const { showInfoBar, toggleInfoBar, hideInfoBar } = useNavigation()

const canvasRef = ref<HTMLCanvasElement>()
const renderer = ref<CanvasRenderer>()

onMounted(async () => {
  console.log('📡 Загрузка плейлиста...')

  if (canvasRef.value) {
    renderer.value = new CanvasRenderer(canvasRef.value)
    renderer.value.onImagesLoaded(() => {
      render()
    })
    window.addEventListener('resize', handleResize)
  }

  await loadM3U(M3U_URL)

  document.addEventListener('keydown', handleKeydown)

  if (activeChannel.value) {
    setUrl(activeChannel.value.url)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
})

function handleResize() {
  renderer.value?.resize()
  render()
}

function handleKeydown(e: KeyboardEvent) {
  const key = e.key

  if (['ArrowUp', 'ArrowDown', 'Enter'].includes(key)) {
    e.preventDefault()
  }

  if (key === 'ArrowDown') {
    nextChannel()
    hideInfoBar()
  }

  if (key === 'ArrowUp') {
    prevChannel()
    hideInfoBar()
  }

  if (key === 'Enter') {
    if (showInfoBar.value) {
      hideInfoBar()
    } else if (activeChannel.value) {
      console.log(`📺 Переключился на: ${activeChannel.value.name}`)
      setUrl(activeChannel.value.url)
      play()
      toggleInfoBar()
    }
  }
}

function onVideoLoaded() {
  // Не устанавливаем isPlaying автоматически
}

function render() {
  if (!renderer.value) return

  renderer.value.render({
    channels: channels.value,
    activeIndex: activeIndex.value,
    showInfoBar: showInfoBar.value,
    currentChannel: activeChannel.value,
    isPlaying: isPlaying.value,
    isLoading: isLoading.value,
    hasError: hasError.value,
  })
}

watch([activeIndex, showInfoBar, isPlaying, isLoading, hasError], () => {
  render()
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

.hint {
  position: fixed;
  bottom: 30px;
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
