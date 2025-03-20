<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import {computed, onBeforeUnmount, onMounted, ref} from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';
import {getSecretKeyApi} from "#/api";

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    // {
    //   component: markRaw(SliderCaptcha),
    //   fieldName: 'captcha',
    //   rules: z.boolean().refine((value) => value, {
    //     message: $t('authentication.verifyRequiredTip'),
    //   }),
    // },
  ];
});

// 公钥
const publicKeyStr = ref('');

// 获取aes加密秘钥
async function getSecretKet() {
  publicKeyStr.value = await getSecretKeyApi();
  localStorage.setItem('publicKey', publicKeyStr.value);
}

onMounted(() => {
  getSecretKet();
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
