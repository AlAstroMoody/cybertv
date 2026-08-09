import { createRouter, createWebHistory } from 'vue-router'
import TvPlayer from '../components/TvPlayer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', component: TvPlayer }],
})

export default router
