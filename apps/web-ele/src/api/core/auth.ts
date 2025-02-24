import { requestClient } from '#/api/request';

/**
 * 登录请求参数
 */
export interface LoginParams {
  /**
   * 用户名
   */
  username: string;
  /**
   * 密码
   */
  password: string;
  /**
   * 验证码图片Base64字符串
   */
  captchaCode?: string;
}

/**
 * 登录响应
 */
export interface LoginResult {
  /**
   * 访问token
   */
  accessToken: string;
  /**
   * 过期时间（单位：毫秒）
   */
  expires?: number;
  /**
   * 刷新token
   */
  refreshToken: string;
  /**
   * token类型
   */
  tokenType?: string;
}

export interface CaptchaResult {
  /**
   * 验证码缓存key
   */
  captchaKey: string;

  /**
   * 验证码图片Base64位字符串
   */
  captchaBase64: string;
}

/**
 * 登录
 * @returns
 * @param loginParams
 */
export async function loginApi(loginParams: LoginParams) {
  return requestClient.post<LoginResult>('/api/login', loginParams);
}

/**
 *
 * @returns 获取加密秘钥
 */
export async function getSecretKeyApi() {
  return requestClient.get<string>('/api/aes/secretKey');
}

/**
 * 刷新 token
 * @param refreshToken
 * @returns
 */
export async function refreshTokenApi(refreshToken: string) {
  return requestClient.post<LoginResult>(
    '/api/refreshToken',
    {
      data: { refreshToken },
    },
    {
      headers: {
        Authorization: 'no-auth',
      },
    },
  );
}

/**
 * 注销登录
 * @returns
 */
export async function logoutApi() {
  return requestClient.delete('/api/logout');
}

/**
 * 生成验证码
 * @returns
 */
export async function getCaptchaApi() {
  return requestClient.get<CaptchaResult>('/api/captcha');
}

/**
 * 验证码开关
 */
export async function switchCaptchaApi() {
  return requestClient.get<boolean>('/api/captchaEnabled');
}
