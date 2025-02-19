import { requestClient } from '#/utils/request';

/**
 * 角色查询对象
 */
export interface RoleQuery extends PageQuery {
  // 角色编码
  roleCode?: string;

  // 角色名称
  roleName?: string;
}

/**
 * 角色表格分页对象
 */
export interface RolePage {
  // 角色ID
  roleId?: string;

  // 角色编码
  roleCode?: string;

  // 角色名称
  roleName?: string;

  // 排序
  sort?: number;

  // 角色状态(1:正常；-1:停用)
  status?: number;

  // 创建时间
  createTime?: Date;

  // 更新时间
  updateTime?: Date;
}

export type RolePageResult = PageResult<RolePage[]>;

/**
 * 角色添加、编辑表单对象
 * @returns
 */
export interface RoleForm {
  // 角色ID
  roleId?: string;

  // 角色编码
  roleCode: string;

  // 角色名称
  roleName: string;

  // 数据权限
  dataScope: number;

  // 排序
  sort?: number;

  // 角色状态(1:正常；-1:停用)
  status?: number;
}

/**
 * 角色表格分页列表
 * @returns
 * @param roleQuery
 */
export async function selectRolePageApi(roleQuery: RoleQuery) {
  return requestClient.get<RolePageResult>('/api/role/page', {
    params: roleQuery,
  });
}

/**
 * 角色下拉选项
 */
export async function roleOptionApi(roleQuery?: RoleQuery) {
  return requestClient.get<OptionType[]>('/api/role/option', {
    params: roleQuery,
  });
}

/**
 *
 * 新增角色
 * @returns
 */
export async function addRoleApi(roleForm: RoleForm) {
  return requestClient.post('/api/role/add', {
    data: roleForm,
  });
}

/**
 * 角色详情
 * @param roleId
 * @returns
 */
export async function roleDetailApi(roleId: string) {
  return requestClient.get<RoleForm>(`/api/role/detail/${roleId}`);
}

/**
 * 编辑角色
 * @returns
 * @param roleForm
 */
export async function editRoleApi(roleForm: RoleForm) {
  return requestClient.put('/api/role/edit', {
    data: roleForm,
  });
}

/**
 * 删除角色
 * @param roleIds
 * @returns
 */
export async function deleteRoleApi(roleIds: string[]) {
  return requestClient.delete('/api/role/delete', {
    data: roleIds,
  });
}

/**
 * 更新角色状态（0：正常，1：禁用）
 * @param roleId
 * @param status
 * @returns
 */
export async function updateRoleStatusApi(roleId: string, status: number) {
  return requestClient.put(`/api/role/${roleId}/${status}`);
}

/**
 * 启动角色
 * @returns
 * @param roleIds
 */
export async function enableRoleApi(roleIds: string[]) {
  return requestClient.put('/api/role/enable', {
    data: roleIds,
  });
}

/**
 * 禁用角色
 * @returns
 * @param roleIds
 */
export async function disableRoleApi(roleIds: string[]) {
  return requestClient.put('/api/role/disable', {
    data: roleIds,
  });
}

/**
 * 获取角色的菜单id集合
 * @param roleId
 * @returns
 */
export async function getRoleMenuIdsApi(roleId: string) {
  return requestClient.get<string[]>(`/api/role/${roleId}/menuIds`);
}

/**
 * 角色分配用用户， 更新角色用户关系
 * @param roleId
 * @param userIds
 * @returns
 */
export async function updateRoleUserApi(roleId: string, userIds: string[]) {
  return requestClient.put(`/api/role/updateRoleUser/${roleId}`, {
    data: userIds,
  });
}
