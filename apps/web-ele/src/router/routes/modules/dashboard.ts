import type { RouteRecordStringComponent } from '@vben/types';

const localRoutes: RouteRecordStringComponent[] = [
  {
    component: '/dashboard/index.vue',
    meta: {
      icon: 'lucide:house',
      order: -1,
      title: '首页',
    },
    name: 'Dashboard',
    path: '/dashboard',
    // children: [
    //   {
    //     name: 'Analytics',
    //     path: '/analytics',
    //     component: '/dashboard/analytics/index.vue',
    //     meta: {
    //       affixTab: true,
    //       icon: 'lucide:area-chart',
    //       title: '首页',
    //     },
    //   },
    // {
    //   name: 'Workspace',
    //   path: '/workspace',
    //   component: '/dashboard/workspace/index.vue',
    //   meta: {
    //     icon: 'carbon:workspace',
    //     title: $t('page.dashboard.workspace'),
    //   },
    // },
    // ],
  },
];

export default localRoutes;
