import { onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue'

type EventTargetLike = Window | Document | HTMLElement

export function useEventListener<K extends keyof WindowEventMap>(
  target: MaybeRefOrGetter<Window | null | undefined>,
  type: K,
  listener: (ev: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean,
): void
export function useEventListener<K extends keyof DocumentEventMap>(
  target: MaybeRefOrGetter<Document | null | undefined>,
  type: K,
  listener: (ev: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean,
): void
export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean,
): void
export function useEventListener(
  target: MaybeRefOrGetter<EventTargetLike | null | undefined>,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
): void {
  let cleanup: (() => void) | undefined

  const stopWatch = watch(
    () => toValue(target),
    (el) => {
      cleanup?.()
      cleanup = undefined

      if (!el) return

      el.addEventListener(type, listener, options)
      cleanup = () => el.removeEventListener(type, listener, options)
    },
    { flush: 'post', immediate: true },
  )

  onScopeDispose(() => {
    stopWatch()
    cleanup?.()
  })
}
