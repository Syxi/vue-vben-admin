import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  [key: string]: any;

  // 头像
  avatar?: string;

  // 首页地址
  homePath?: string;

  // 权限集合
  perms?: string[];

  // 用户真实姓名
  realName?: string;

  // 角色集合
  roles?: string[];

  // 用户ID
  userId?: string;

  // 用户名
  username?: string;
}

interface AccessState {
  /**
   * 用户信息
   */
  userInfo: BasicUserInfo | null;
  /**
   * 用户权限标识
   */
  userPerms: string[];
  /**
   * 用户角色
   */
  userRoles: string[];
}

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore('core-user', {
  actions: {
    setUserInfo(userInfo: BasicUserInfo | null) {
      // 设置用户信息
      this.userInfo = userInfo;
      // 设置角色信息
      const roles = userInfo?.roles ?? [];
      this.setUserRoles(roles);

      // 设置权限标识信息
      const perms = userInfo?.perms ?? [];
      this.setUserPerms(perms);
    },
    setUserPerms(perms: string[]) {
      this.userPerms = perms;
    },
    setUserRoles(roles: string[]) {
      this.userRoles = roles;
    },
  },
  state: (): AccessState => ({
    userInfo: null,
    userPerms: [],
    userRoles: [],
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
