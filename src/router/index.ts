/**
 * Vue Router 路由表：登录页、全屏访谈、以及 AdminLayout 下的客户首页 / 项目页 / 访谈记录 / 授信报告。
 */
import { createRouter, createWebHistory } from 'vue-router'
import CustomerHome from '../views/home/CustomerHome.vue'
import ProjectHome from '../views/home/ProjectHome.vue'
import CreditReport from '../views/home/CreditReport.vue'
import InterviewRecordsPage from '../views/home/InterviewRecordsPage.vue'
import InterviewStart from '../views/home/InterviewStart.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/index.vue')
    },
    /** 全屏访谈页：无 AdminHeader / 无侧栏（Figma 7.0 开始访谈） */
    {
      path: '/interview',
      name: 'Interview',
      component: InterviewStart
    },
    {
      path: '/',
      component: () => import('../views/layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          name: 'Home',
          /** 同步导入，避免与授信报告/项目页互跳时懒加载间隙导致 router-view 空白 */
          component: CustomerHome
        },
        {
          path: 'project/:projectId',
          name: 'HomeProject',
          component: ProjectHome,
          /** 将 params 以 props 传入，避免过渡后子组件仍读到空 projectId */
          props: true
        },
        {
          path: 'project/:projectId/interview-records',
          name: 'InterviewRecords',
          component: InterviewRecordsPage,
          props: true
        },
        {
          path: 'project/:projectId/credit-report',
          name: 'CreditReport',
          component: CreditReport,
          props: true
        }
      ]
    }
  ]
})

export default router
