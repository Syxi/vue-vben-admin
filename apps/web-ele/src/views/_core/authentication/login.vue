<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw, onMounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getCaptchaApi, switchCaptchaApi } from '#/api';
import { ImageCaptcha } from '#/components/image-captcha';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

// 验证码开关
const captchaEnabled = ref(false);

const imageCaptchaRef = ref();

imageCaptchaRef.value?.refresh();

/**
 * 验证码开关
 */
async function showCaptcha() {
  captchaEnabled.value = await switchCaptchaApi();
}

const formSchema = computed((): VbenFormSchema[] => {
  return captchaEnabled.value
    ? [
        {
          component: 'VbenInput',
          componentProps: {
            placeholder: $t('authentication.usernameTip'),
          },
          fieldName: 'username',
          label: $t('authentication.username'),
          rules: z
            .string()
            .min(1, { message: $t('authentication.usernameTip') }),
          formItemClass: 'col-span-12',
        },
        {
          component: 'VbenInputPassword',
          componentProps: {
            placeholder: $t('authentication.password'),
          },
          fieldName: 'password',
          label: $t('authentication.password'),
          rules: z
            .string()
            .min(1, { message: $t('authentication.passwordTip') }),
          formItemClass: 'col-span-12',
        },
        {
          component: 'VbenInput',
          componentProps: {
            placeholder: '请输入图片验证码',
          },
          fieldName: 'captchaCode',
          label: '验证码',
          rules: z.string().min(1, { message: '请输入图片验证码' }),
          formItemClass: 'col-span-8',
        },
        {
          component: markRaw(ImageCaptcha),
          fieldName: 'captchaKey',
          componentProps: {
            api: getCaptchaApi,
            uuidFileId: 'captchaKey',
            base64FileId: 'captchaBase64',
            // immediate: false,
            onRegister(obj: any) {
              imageCaptchaRef.value = obj;
            },
          },
          formItemClass: 'col-span-4',
        },
      ]
    : [
        {
          component: 'VbenInput',
          componentProps: {
            placeholder: $t('authentication.usernameTip'),
          },
          fieldName: 'username',
          label: $t('authentication.username'),
          rules: z
            .string()
            .min(1, { message: $t('authentication.usernameTip') }),
        },
        {
          component: 'VbenInputPassword',
          componentProps: {
            placeholder: $t('authentication.password'),
          },
          fieldName: 'password',
          label: $t('authentication.password'),
          rules: z
            .string()
            .min(1, { message: $t('authentication.passwordTip') }),
        },
        {
          component: markRaw(ImageCaptcha),
          fieldName: 'captcha',
          rules: z.boolean().refine((value) => value, {
            message: $t('authentication.verifyRequiredTip'),
          }),
        },
      ];
});

onMounted(() => {
  showCaptcha();
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-third-party-login="false"
    :show-forget-password="false"
    :show-remember-me="false"
    @submit="authStore.authLogin"
  />
</template>
