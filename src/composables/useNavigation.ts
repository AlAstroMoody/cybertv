import { ref } from 'vue'

export type AppPhase = 'intro' | 'unlock' | 'traced' | 'welcome' | 'categories' | 'player'

export function useNavigation() {
  const phase = ref<AppPhase>('intro')
  const showInfoBar = ref(false)
  const showMenu = ref(false)
  const currentView = ref<'list' | 'info' | 'menu'>('list')
  const categoryFocusIndex = ref(0)

  function setPhase(next: AppPhase) {
    phase.value = next
    if (next !== 'player') {
      showInfoBar.value = false
    }
  }

  function toggleInfoBar() {
    showInfoBar.value = !showInfoBar.value
  }

  function hideInfoBar() {
    showInfoBar.value = false
  }

  function toggleMenu() {
    showMenu.value = !showMenu.value
  }

  function setView(view: 'list' | 'info' | 'menu') {
    currentView.value = view
  }

  function setCategoryFocus(index: number, total: number) {
    if (total <= 0) {
      categoryFocusIndex.value = 0
      return
    }
    categoryFocusIndex.value = ((index % total) + total) % total
  }

  function nextCategory(total: number) {
    setCategoryFocus(categoryFocusIndex.value + 1, total)
  }

  function prevCategory(total: number) {
    setCategoryFocus(categoryFocusIndex.value - 1, total)
  }

  return {
    phase,
    showInfoBar,
    showMenu,
    currentView,
    categoryFocusIndex,
    setPhase,
    toggleInfoBar,
    hideInfoBar,
    toggleMenu,
    setView,
    setCategoryFocus,
    nextCategory,
    prevCategory,
  }
}
