/** 用户信息 */
interface UserInfo {
  /**
   * 头像
   */
  avatar?: string;
  /**
   * 权限标识
   */
  perms?: string[];
  /**
   * 用户角色
   */
  roles?: string[];
  /**
   * 用户id
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
  /**
   * 用户昵称
   */
  realName: string;
}

export type { UserInfo };
