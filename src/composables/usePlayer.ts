import { ref, onScopeDispose } from 'vue'
import Hls from 'hls.js'
import { useEventListener } from './useEventListener'

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8')
}

export function usePlayer() {
  const video = ref<HTMLVideoElement | null>(null)
  const isPlaying = ref(false)
  const isMuted = ref(false)
  const isBuffering = ref(false)
  const hasError = ref(false)
  const volume = ref(1)
  const currentUrl = ref<string | null>(null)

  let hls: Hls | null = null

  function destroyHls() {
    if (hls) {
      hls.destroy()
      hls = null
    }
  }

  useEventListener(video, 'play', () => {
    isPlaying.value = true
    hasError.value = false
  })

  useEventListener(video, 'pause', () => {
    isPlaying.value = false
  })

  useEventListener(video, 'playing', () => {
    isPlaying.value = true
    isBuffering.value = false
    hasError.value = false
  })

  useEventListener(video, 'waiting', () => {
    isBuffering.value = true
  })

  useEventListener(video, 'error', () => {
    isPlaying.value = false
    isBuffering.value = false
    hasError.value = true
  })

  onScopeDispose(() => {
    destroyHls()
  })

  async function play() {
    const el = video.value
    if (!el) return

    try {
      await el.play()
    } catch {
      isPlaying.value = false
    }
  }

  function pause() {
    video.value?.pause()
  }

  function stop() {
    destroyHls()
    const el = video.value
    if (el) {
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
    currentUrl.value = null
    isPlaying.value = false
    isBuffering.value = false
    hasError.value = false
  }

  function setUrl(url: string, autoplay = false) {
    const el = video.value
    if (!el) return

    destroyHls()
    hasError.value = false
    isBuffering.value = true
    isPlaying.value = false
    currentUrl.value = url
    el.removeAttribute('src')
    el.load()

    const tryAutoplay = () => {
      if (autoplay) void play()
    }

    if (isHlsUrl(url)) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        hls.loadSource(url)
        hls.attachMedia(el)
        hls.on(Hls.Events.MANIFEST_PARSED, tryAutoplay)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            hasError.value = true
            isPlaying.value = false
            isBuffering.value = false
          }
        })
        return
      }

      if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = url
        el.addEventListener('loadeddata', tryAutoplay, { once: true })
        el.load()
        return
      }

      hasError.value = true
      isBuffering.value = false
      return
    }

    el.src = url
    el.addEventListener('loadeddata', tryAutoplay, { once: true })
    el.load()
  }

  function toggleMute() {
    if (video.value) {
      video.value.muted = !video.value.muted
      isMuted.value = video.value.muted
    }
  }

  function setVolume(value: number) {
    volume.value = value
    if (video.value) {
      video.value.volume = value
    }
  }

  return {
    video,
    isPlaying,
    isMuted,
    isBuffering,
    hasError,
    currentUrl,
    volume,
    play,
    pause,
    stop,
    setUrl,
    toggleMute,
    setVolume,
  }
}
