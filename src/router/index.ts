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
    {
      path: '/text',
      name: 'text',
      component: () => import('@/views/TextView.vue')
    },
    {
      path: '/init3D',
      name: 'init3D',
      component: () => import('@/views/Init3D.vue')
    },
    {
      path: '/DataCenterVisualizationSystem',
      name: 'DataCenterVisualizationSystem',
      component: () => import('@/views/DataCenterVisualizationSystem.vue')
    },
    {
      path: '/IntelligentPark',
      name: 'IntelligentPark',
      component: () => import('@/views/IntelligentPark.vue')
    },
  ]
})

export default router
