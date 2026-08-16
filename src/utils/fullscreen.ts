type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

export function isFullscreen(): boolean {
  const doc = document as FullscreenDocument
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
}

export function isFullscreenKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  if (e.key === 'f' || e.key === 'F' || e.code === 'KeyF') return true
  return e.key === 'Green' || e.key === 'ColorF1Green'
}

export async function toggleFullscreen(): Promise<void> {
  try {
    if (isFullscreen()) {
      await exitFullscreen()
      return
    }
    const el = document.documentElement as FullscreenElement
    if (el.requestFullscreen) {
      await el.requestFullscreen()
      return
    }
    el.webkitRequestFullscreen?.()
  } catch {
    // браузер отказал — жест или политика
  }
}

async function exitFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument
  if (doc.exitFullscreen) {
    await doc.exitFullscreen()
    return
  }
  doc.webkitExitFullscreen?.()
}
