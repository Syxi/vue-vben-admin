import { requestClient } from '#/api/request';

/**
 * 用户查询对象
 */
export interface UserQuery extends PageQuery {
  // 用户名
  username?: string;

  // 用户真实姓名
  realName?: string;

  // 用户状态(1:正常;-1:禁用)
  status?: number;

  startTime?: string;

  endTime?: string;

  organId?: string;
}

/**
 *  分页表格用户对象
 */
export interface UserPage {
  // 用户ID
  userId?: string;

  // 用户名
  username: string;

  // 密码
  password: string;

  // 头像
  avatar?: string;

  // 邮箱
  email?: string;

  // 性别
  gender?: string;

  // 手机号
  mobile?: string;

  // 用户真实姓名
  realName?: string;

  // 用户状态(1:正常; -1:禁用)
  status?: number;

  // 部门名称
  organName?: string;

  // 创建时间
  createTime?: Date;

  // 角色名称，多个用（,）隔开
  roleNames?: string;
}

export type UserPageResult = PageResult<UserPage[]>;

/**
 * 编辑、新增表单用户
 */
export interface UserForm {
  // 用户ID
  userId?: string;

  // 用户名
  username?: string;

  // 用户头像
  avatar?: string;

  // 邮箱
  email?: string;

  // 性别
  gender?: number;

  // 手机号
  mobile?: string;

  // 用户真实姓名
  realName?: string;

  // 密码
  password?: string;

  // 用户状态(0:正常;1:禁用)
  status?: number;

  // 部门名称
  organId?: string;

  // 角色id数组
  roleIds?: string[];

  // 角色名称，多个用（,）隔开
  roleNames?: string;

  // 部门名称
  organName?: string;
}

export interface UserPassword {
  // 旧密码
  oldPassword?: string;

  // 新密码
  newPassword?: string;

  // 确认新密码
  confirmPassword?: string;
}

/**
 * 获取用户分页列表
 * @returns
 * @param userQuery
 */
export async function selectUserPageApi(userQuery: UserQuery) {
  return requestClient.get<UserPageResult>('/api/user/page', {
    params: userQuery,
  });
}

/**
 *  获取用户详情
 * @param userId
 */
export async function getUserDetailApi(userId: string) {
  return requestClient.get<UserForm>(`/api/user/detail/${userId}`);
}

/**
 * 新增用户
 * @returns
 * @param userForm
 */
export async function addUserApi(userForm: UserForm) {
  return requestClient.post('/api/user/add', userForm);
}

/**
 * 编辑用户
 * @returns
 * @param userForm
 */
export async function editUserApi(userForm: UserForm) {
  return requestClient.put('/api/user/edit', userForm);
}

/**
 *  删除用户
 * @param userIds
 * @returns
 */
export async function deleteUserApi(userIds: string[]) {
  return requestClient.delete('/api/user/delete', userIds);
}

/**
 * 启用用户
 * @param userIds
 * @returns
 */
export async function enableUserApi(userIds: string[]) {
  return requestClient.put('/api/user/enable', userIds);
}

/**
 * 禁用用户
 * @param userIds
 * @returns
 */
export async function disableUserApi(userIds: string[]) {
  return requestClient.put('/api/user/disable', userIds);
}

/**
 * 重置密码
 * @param userIds
 */
export async function resetPwdApi(userIds: string[]) {
  return requestClient.put('/api/user/resetPassword', userIds);
}

/**
 * 下载用户导入模板
 * @returns
 */
export async function downloadTemplateApi() {
  return requestClient.get('/api/user/template', {
    responseType: 'arraybuffer',
  });
}

/**
 * 导出用户
 * @returns
 * @param userIds
 */
export async function exportUserApi(userIds: string[]) {
  return requestClient.post('/api/user/export', userIds, {
    responseType: 'arraybuffer',
  });
}

/**
 * 导入用户
 * @param file
 * @returns
 */
export async function importUserApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<string>('/api/user/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 更新密码
 * @param userPassword
 */
export async function updatePasswordApi(userPassword: UserPassword) {
  return requestClient.post('/api/user/updatePassword', userPassword);
}

/**
 * 个人信息
 * @returns
 */
export async function getUserVOInfoApi() {
  return requestClient.get<UserPage>('/api/user/me');
}

/**
 * 更新个人信息
 * @returns
 * @param userForm
 */
export async function updateUserVOInfoApi(userForm: UserForm) {
  return requestClient.put('/api/user/update/me', userForm);
}

/**
 * 角色分配用用户, 穿梭框左侧数据
 * @returns
 * @param roleId
 */
export async function userNotInRoleApi(roleId: string) {
  return requestClient.get<TransferVO[]>(`/api/user/notInRole/${roleId}`);
}

/**
 * 角色分配用用户， 穿梭框右侧数据  (穿梭框右侧数据必须是左侧数据的子集)
 * @returns
 * @param roleId
 */
export async function UserInRoleApi(roleId: string) {
  return requestClient.get<TransferVO[]>(`/api/user/inRole/${roleId}`);
}
