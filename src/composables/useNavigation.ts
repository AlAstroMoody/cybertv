import { ref } from 'vue'

export function useNavigation() {
  const showInfoBar = ref(false)
  const showMenu = ref(false)
  const currentView = ref<'list' | 'info' | 'menu'>('list')

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

  return {
    showInfoBar,
    showMenu,
    currentView,
    toggleInfoBar,
    hideInfoBar,
    toggleMenu,
    setView,
  }
}
