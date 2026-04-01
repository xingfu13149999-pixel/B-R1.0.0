import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/index.vue')
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/home/index.vue')
        },
        {
          path: 'project/:projectId',
          name: 'HomeProject',
          component: () => import('../views/home/ProjectHome.vue')
        }
      ]
    }
  ]
})

export default router
