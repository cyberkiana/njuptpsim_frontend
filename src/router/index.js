import { createRouter, createWebHistory } from 'vue-router'

import RootHomeView from '@/views/root/home/index.vue'
import ClazzView from '@/views/root/clazz/index.vue'
import LogView from '@/views/root/log/index.vue'
import CommentManageView from '@/views/root/comment/index.vue'
import UserView from '@/views/root/user/index.vue'
import RootLayoutView from '@/views/root/layout/index.vue'
import LoginView from '@/views/common/login/loginView.vue'
import TeaLayoutView from '@/views/teacher/layout/index.vue'
import UserDetail from '@/views/common/detail/userDetail.vue'
import ClazzDetail from '@/views/common/detail/clazzDetail.vue'
import RootExpView from '@/views/root/exp/expView.vue'
import RootExpDetail from '@/views/root/exp/exp.vue'
import RootReservationView from '@/views/root/reservation/index.vue'
import TeaTaskView from '@/views/teacher/task/index.vue'
import TeaTaskDataView from '@/views/teacher/data/index.vue'
import TeaHomeView from '@/views/teacher/home/index.vue'
import StuLayoutView from '@/views/stu/layout/index.vue'
import StuReservationView from '@/views/stu/reservation/index.vue'
import StuHomeView from '@/views/stu/home/index.vue'
import ExpView from '@/views/common/exp/expView.vue'
import ExpDetail from '@/views/common/exp/exp.vue'
import ExpTest from '@/views/common/exp/expTest.vue'
import Egg from '@/views/eggs/egg.vue'

import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
     path: '/root', 
     name: 'root',
     component: RootLayoutView, //所有界面共同渲染的组件
     redirect: '/root/home', //重定向
     meta: { requireAuth: true }, //自定义路由元，此处表示此路由需要登陆
     children: [
      {path: 'home', name: 'rootHome', component: RootHomeView},
      {path: 'clazz', name: 'clazz', component: ClazzView},
      {path: 'user', name: 'user', component: UserView},
      {path: 'log', name: 'log', component: LogView},
      {path: 'comment', name: 'comment', component: CommentManageView},
      {path: 'clazz/:id', name: 'clazzDetail', component: ClazzDetail},
      {path: 'exp', name: 'rootExp', component: RootExpView},
      {path: 'exp/:id', name: 'rootExpDetail', component: RootExpDetail},
      {path: 'reservation', name: 'rootReservation', component: RootReservationView},
      {path: 'userDetail', name: 'rootUserDetail', component: UserDetail},
     ]
    },
    {
      path: '/tea',
      name: 'tea',
      component: TeaLayoutView,
      redirect: '/tea/home',
      meta: { requireAuth: true },
      children: [
        {path: 'task', name: 'teaTask', component: TeaTaskView},
        {path: 'data', name: 'teaData', component: TeaTaskDataView},
        {path: 'exp', name: 'teaExp', component: ExpView},
        {path: 'exp/:id', name: 'teaExpDetail', component: ExpDetail},
        {path: 'home', name: 'teaHome', component: TeaHomeView},
        {path: 'userDetail', name: 'teaUserDetail', component: UserDetail},
      ]
    },
    {
      path: '/stu',
      name: 'stu',
      component: StuLayoutView,
      redirect: '/stu/home',
      meta: { requireAuth: true },
      children: [
        {path: 'reservation', name: 'stuReservation', component: StuReservationView},
        {path: 'exp', name: 'stuExp', component: ExpView},
        {path: 'exp/:id', name: 'stuExpDetail', component: ExpDetail},
        {path: 'home', name: 'stuHome', component: StuHomeView},
        {path: 'userDetail', name: 'stuUserDetail', component: UserDetail},
      ]
    },
    {path: '/login', name: 'login', component: LoginView},
    {path: '/', redirect: '/login'},
    {path: '/user', component: Egg},
    {path: '/eggs', name: 'egg', component: Egg},
    // WebGL实验测试页面 (egg文件夹内的粒子系统)
    {path: '/expTest', name: 'expTest', component: ExpTest},
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 需要登录才能访问的路由
  if (to.meta.requireAuth) {
    // 检查是否已登录
    if (userStore.isLoggedIn) {
      // 已登录，允许访问
      next()
    } else {
      // 未登录，跳转到登录页并携带重定向地址
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 不需要登录的路由
    next()
  }
})

export default router
