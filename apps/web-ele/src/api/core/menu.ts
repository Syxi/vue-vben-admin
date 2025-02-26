import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户所有菜单, 生成系统菜单
 */
export async function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/api/menu/routes');
}
