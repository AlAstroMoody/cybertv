/** Телефон / планшет: нет пульта и клавиатуры. */
export function isHandheldTerminal(): boolean {
  if (typeof window === 'undefined') return false

  const noHover = window.matchMedia('(hover: none)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const touch = navigator.maxTouchPoints > 0
  if (!noHover && !coarse && !touch) return false

  const short = Math.min(window.innerWidth, window.innerHeight)
  if (short >= 1000 && navigator.maxTouchPoints === 0) return false

  return touch || (noHover && coarse)
}
