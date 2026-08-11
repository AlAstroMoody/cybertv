import { onScopeDispose, ref, type Ref } from 'vue'

export const SOUND_SRCS = {
  ambient: '/sound/fade.mp3',
  click: '/sound/click.mp3',
  confirm: '/sound/confirm.mp3',
  back: '/sound/back.mp3',
} as const

export type UiSound = 'click' | 'confirm' | 'back'

/**
 * UI-звуки + фоновый луп до старта видео.
 * Ambient создаётся сразу (new Audio).
 */
export function useSounds() {
  const clickRef = ref<HTMLAudioElement | null>(null)
  const confirmRef = ref<HTMLAudioElement | null>(null)
  const backRef = ref<HTMLAudioElement | null>(null)

  const ambient = new Audio(SOUND_SRCS.ambient)
  ambient.loop = true
  ambient.preload = 'auto'

  let ambientWanted = true
  let uiUnlocked = false

  const uiMap: Record<UiSound, Ref<HTMLAudioElement | null>> = {
    click: clickRef,
    confirm: confirmRef,
    back: backRef,
  }

  function tryStartAmbient() {
    if (!ambientWanted) return
    if (!ambient.paused && !ambient.ended) return

    void ambient.play().catch(() => {
      /* NotAllowedError до жеста — ждём unlock() с пульта */
    })
  }

  function syncAmbient() {
    if (!ambientWanted) {
      ambient.pause()
      return
    }
    tryStartAmbient()
  }

  /** Разморозка кликов + повторный старт фона (после keydown пульта) */
  function unlock() {
    if (!uiUnlocked) {
      uiUnlocked = true
      for (const el of [clickRef.value, confirmRef.value, backRef.value]) {
        if (!el) continue
        el.muted = true
        void el
          .play()
          .then(() => {
            el.pause()
            el.currentTime = 0
            el.muted = false
          })
          .catch(() => {
            el.muted = false
          })
      }
    }
    tryStartAmbient()
  }

  function play(id: UiSound) {
    const el = uiMap[id].value
    if (!el) return
    unlock()
    try {
      el.currentTime = 0
    } catch { }
    void el.play().catch(() => {})
  }

  function setAmbientEnabled(enabled: boolean) {
    ambientWanted = enabled
    syncAmbient()
  }

  ambient.addEventListener('canplay', tryStartAmbient)
  ambient.addEventListener('loadeddata', tryStartAmbient)
  ambient.load()
  tryStartAmbient()

  onScopeDispose(() => {
    ambient.pause()
    ambient.removeAttribute('src')
    ambient.load()
  })

  return {
    clickRef,
    confirmRef,
    backRef,
    play,
    unlock,
    setAmbientEnabled,
  }
}
