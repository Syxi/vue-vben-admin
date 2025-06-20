<script setup lang="ts">
import type { FormInstance } from 'element-plus';

import type { LoginParams } from '#/api';

import { computed, onBeforeMount, ref } from 'vue';

import { Icon } from '@iconify/vue';

import { getCaptchaApi, switchCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';

const isCapslock = ref(false);

const captchaBase64 = ref('');

const loginTitle = import.meta.env.VITE_APP_LOGIN_TITLE;

// 验证码开关
const captchaEnabled = ref(false);

// 登录表单 ref
const loginFormRef = ref<FormInstance>();

const params = ref<LoginParams>({
  username: '',
  password: '',
  captchaKey: '',
  captchaCode: '',
});

// 校验登录表单内容
const loginRules = computed(() => {
  return {
    username: [
      {
        required: true,
        trigger: 'blur',
        message: '请输入用户名',
      },
    ],
    password: [
      {
        required: true,
        trigger: 'blur',
        message: '请输入用密码',
      },
      {
        min: 6,
        trigger: 'blur',
        message: '密码至少是6位',
      },
    ],
    captchaCode: [
      {
        required: true,
        trigger: 'blur',
        message: '请输入验证码',
      },
    ],
  };
});

/**
 * 切换验证码
 */
async function showCaptcha() {
  captchaEnabled.value = await switchCaptchaApi();
  if (captchaEnabled.value) {
    await getCaptcha();
  }
}

/** 检查输入大小写 */
function checkCapslock(event: KeyboardEvent) {
  // 防止浏览器密码自动填充时报错
  if (event instanceof KeyboardEvent) {
    isCapslock.value = event.getModifierState('CapsLock');
  }
}

const authStore = useAuthStore();

async function handleLogin() {
  loginFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 登录

      try {
        await authStore.authLogin(params.value);
      } catch {
        // 登录异常，刷新验证码
        captchaBase64.value = '';
        const data = await getCaptchaApi();
        params.value.captchaKey = data.captchaKey;
        captchaBase64.value = data.captchaBase64;
      }
    }
  });
}

async function getCaptcha() {
  const data = await getCaptchaApi();
  params.value.captchaKey = data.captchaKey;
  captchaBase64.value = data.captchaBase64;
}

onBeforeMount(() => {
  showCaptcha();
});
</script>

<template>
  <div>
    <!-- 登录系统名称 -->
    <div class="title relative mx-2 text-center">
      <h1>{{ loginTitle }}</h1>
    </div>

    <el-form ref="loginFormRef" :model="params" :rules="loginRules">
      <!-- 用户名 -->
      <el-form-item prop="username">
        <el-input
          v-model="params.username"
          name="username"
          class="h-[40px]"
          placeholder="用户名"
        >
          <template #prefix>
            <Icon icon="mdi:account-outline" />
          </template>
        </el-input>
      </el-form-item>

      <!-- 密码 -->
      <el-form-item prop="password" :visible="isCapslock">
        <el-input
          v-model="params.password"
          name="password"
          type="password"
          class="h-[40px]"
          placeholder="密码"
          @keyup="checkCapslock"
          @keyup.enter="handleLogin()"
          show-password
        >
          <template #prefix>
            <Icon icon="mdi:lock-outline" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="captchaCode" v-if="captchaEnabled">
        <el-col :span="16">
          <el-input
            v-model="params.captchaCode"
            class="h-[40px]"
            placeholder="验证码"
            auto-complete="off"
            @keyup.enter="handleLogin()"
          >
            <template #prefix>
              <Icon icon="mdi:shield-account-outline" />
            </template>
          </el-input>
        </el-col>
        <el-col :span="7" :offset="1" class="cursor-pointer">
          <el-image @click="getCaptcha()" :src="captchaBase64" />
        </el-col>
      </el-form-item>

      <!-- 点击登录 -->
      <el-button
        :loading="authStore.loginLoading"
        @click.prevent="handleLogin"
        class="w-full"
        type="primary"
        size="large"
      >
        登录
      </el-button>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.el-form {
  padding: 30px 10px;
}

el-image {
  height: 40px;
  cursor: pointer;
}

.title {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.75rem;
}
</style>
