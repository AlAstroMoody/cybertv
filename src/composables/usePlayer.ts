import { ref } from 'vue'

export function usePlayer() {
  const video = ref<HTMLVideoElement | null>(null)
  const isPlaying = ref(false)
  const isMuted = ref(false)
  const volume = ref(1)

  function play() {
    video.value?.play()
    isPlaying.value = true
  }

  function pause() {
    video.value?.pause()
    isPlaying.value = false
  }

  function setUrl(url: string) {
    if (video.value) {
      video.value.src = url
      video.value.load()
    }
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
    volume,
    play,
    pause,
    setUrl,
    toggleMute,
    setVolume,
  }
}
