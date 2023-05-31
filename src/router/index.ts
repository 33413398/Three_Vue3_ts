import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/LessonOne',
      name: 'LessonOne',
      component: () => import('@/views/LessonOne.vue')
    }, 
    {
      path: '/line',
      name: 'line',
      component: () => import('@/views/LineView.vue')
    },
  ]
})

export default router
