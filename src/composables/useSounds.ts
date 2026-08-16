import { onScopeDispose } from 'vue'

export const SOUND_SRCS = {
  ambient: '/sound/fade.mp3',
  ambientDecoy: '/sound/fade2.mp3',
  alarm: '/sound/police-alarm.mp3',
  connect: '/sound/connect.mp3',
  alert: '/sound/alert.mp3',
} as const

export type AmbientTheme = 'real' | 'decoy'

const AMBIENT_VOL = 1
const AMBIENT_FADE_MS = 800

function makeAmbient(src: string) {
  const el = new Audio(src)
  el.loop = true
  el.preload = 'auto'
  el.volume = 0
  return el
}

/**
 * Fade / alarm / connect. UI-кликов нет.
 */
export function useSounds() {
  const ambients: Record<AmbientTheme, HTMLAudioElement> = {
    real: makeAmbient(SOUND_SRCS.ambient),
    decoy: makeAmbient(SOUND_SRCS.ambientDecoy),
  }
  let theme: AmbientTheme | null = null

  const alarm = new Audio(SOUND_SRCS.alarm)
  alarm.loop = true
  alarm.preload = 'auto'

  const connect = new Audio(SOUND_SRCS.connect)
  connect.preload = 'auto'

  const alertFx = new Audio(SOUND_SRCS.alert)
  alertFx.preload = 'auto'

  let ambientWanted = false
  let alarmWanted = false
  let fadeRaf = 0
  let fadeFrom = 0
  let fadeTo = 0
  let fadeStartedAt = 0

  function currentAmbient() {
    return theme ? ambients[theme] : null
  }

  function cancelFade() {
    if (fadeRaf) cancelAnimationFrame(fadeRaf)
    fadeRaf = 0
  }

  function tickFade() {
    const el = currentAmbient()
    if (!el) {
      fadeRaf = 0
      return
    }
    const t = Math.min(1, (performance.now() - fadeStartedAt) / AMBIENT_FADE_MS)
    const eased = t * t * (3 - 2 * t)
    el.volume = fadeFrom + (fadeTo - fadeFrom) * eased
    if (t < 1) {
      fadeRaf = requestAnimationFrame(tickFade)
      return
    }
    fadeRaf = 0
    el.volume = fadeTo
    if (fadeTo === 0) {
      el.pause()
    }
  }

  function startFade(to: number) {
    const el = currentAmbient()
    if (!el) return
    cancelFade()
    fadeFrom = el.volume
    fadeTo = to
    fadeStartedAt = performance.now()
    if (Math.abs(fadeFrom - fadeTo) < 0.01) {
      el.volume = fadeTo
      if (fadeTo === 0) el.pause()
      return
    }
    fadeRaf = requestAnimationFrame(tickFade)
  }

  /** Жест пульта — браузер разрешает дальше play() у ambient/alarm. */
  function unlock() {}

  function play(_id?: string) {
    unlock()
  }

  function startAmbient(next: AmbientTheme) {
    if (theme && theme !== next) {
      cancelFade()
      const prev = ambients[theme]
      prev.pause()
      prev.volume = 0
    }
    theme = next
    ambientWanted = true
    const el = ambients[next]
    if (el.paused) {
      void el.play().catch(() => {})
    }
    startFade(AMBIENT_VOL)
  }

  function silenceAmbient() {
    cancelFade()
    ambientWanted = false
    theme = null
    for (const el of Object.values(ambients)) {
      el.pause()
      el.volume = 0
      try {
        el.currentTime = 0
      } catch { }
    }
  }

  function setAmbientEnabled(enabled: boolean) {
    const el = currentAmbient()
    if (!el) return

    const alreadyOn = enabled && !el.paused && el.volume >= AMBIENT_VOL - 0.02
    const alreadyOff = !enabled && el.paused && el.volume <= 0.02
    if (ambientWanted === enabled && (alreadyOn || alreadyOff)) return

    ambientWanted = enabled
    if (enabled) {
      if (el.paused) {
        void el.play().catch(() => {})
      }
      startFade(AMBIENT_VOL)
      return
    }
    startFade(0)
  }

  function syncAlarm() {
    if (!alarmWanted) {
      alarm.pause()
      alarm.currentTime = 0
      return
    }
    if (!alarm.paused && !alarm.ended) return
    void alarm.play().catch(() => {})
  }

  function setAlarmEnabled(enabled: boolean) {
    alarmWanted = enabled
    if (enabled) {
      try {
        alarm.currentTime = 0
      } catch { }
    }
    syncAlarm()
  }

  function startConnect() {
    stopAlert()
    try {
      connect.currentTime = 0
    } catch { }
    void connect.play().catch(() => {})
  }

  function stopConnect() {
    connect.pause()
    try {
      connect.currentTime = 0
    } catch { }
  }

  function playAlert() {
    stopConnect()
    try {
      alertFx.currentTime = 0
    } catch { }
    void alertFx.play().catch(() => {})
  }

  function stopAlert() {
    alertFx.pause()
    try {
      alertFx.currentTime = 0
    } catch { }
  }

  onScopeDispose(() => {
    cancelFade()
    for (const el of Object.values(ambients)) {
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
    alarm.pause()
    alarm.removeAttribute('src')
    alarm.load()
    connect.pause()
    connect.removeAttribute('src')
    connect.load()
    alertFx.pause()
    alertFx.removeAttribute('src')
    alertFx.load()
  })

  return {
    play,
    unlock,
    startAmbient,
    setAmbientEnabled,
    silenceAmbient,
    setAlarmEnabled,
    startConnect,
    stopConnect,
    playAlert,
    stopAlert,
  }
}
