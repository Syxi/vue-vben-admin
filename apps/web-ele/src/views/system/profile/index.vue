<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { UserInfo } from '@vben/types';

import {updatePasswordApi, type UserForm, type UserPassword} from '#/api/system/sys/user';

import { reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { ElForm, ElMessage } from 'element-plus';

import { getUserInfoApi } from '#/api';
import { updateUserVOInfoApi } from '#/api/system/sys/user';
import { Dictionary } from '#/components/dictionary';
import { ImageUpload } from '#/components/image-upload';

const userStore = useUserStore();

const activeName = ref('name');

const userFormRef = ref<FormInstance>();

const avatar = userStore.userInfo?.avatar;
const realName = userStore.userInfo?.realName;
const mobile = userStore.userInfo?.mobile;
const email = userStore.userInfo?.email;
const gender = userStore.userInfo?.gender;

const getGenderLabel = (gender: number) => {
  const genderMap = {
    '1': '男',
    '2': '女',
    '3': '未知',
  };
  return genderMap[gender] || '未知';
};

const userFormData = reactive<UserForm>({
  avatar,
  realName,
  gender,
  mobile,
  email,
});

// 表单用户验证规则
const userRules = reactive<FormRules<UserForm>>({
  realName: [{ required: true, message: '登录账号不能为空', trigger: 'blur' }],
  gender: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  email: [
    {
      pattern: /\w[-\w.+]*@([A-Z0-9][-A-Z0-9]+\.)+[A-Z]{2,14}/i,
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
    },
  ],
  mobile: [
    {
      pattern: /^1[3-9|]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ],
});

// 提交用户表单
const submitUserForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    try {
      if (valid) {
        await updateUserVOInfoApi(userFormData);
        ElMessage({
          message: '修改成功',
          type: 'success',
          plain: true,
        });
      }
    } catch {
      ElMessage({
        message: '修改失败',
        type: 'error',
        plain: true,
      });
    } finally {
      let userInfo: null | UserInfo = null;
      userInfo = await getUserInfoApi();
      userStore.setUserInfo(userInfo);
    }
  });
};


const passwordFormData = reactive<UserPassword>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordFormRef = ref<FormInstance>();

// 重置密码表单
const resetPasswordForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

// 验证新密码是否包含数字和字母，且长度至少为6位
const validateNewPassword = (rule: any, value: any, callback: any) => {
  const regex = /^(?=.*[A-Z])(?=.*\d)[A-Z\d]{6,}$/i;
  if (regex.test(value)) {
    callback();
  } else {
    callback(new Error('新密码必须至少6位，且包含数字和字母'));
  }
};

/**
 * 验证两次输入的新密码是否一致
 * @param rule
 * @param value
 * @param callback
 */
const validateConfirmPasswordMatch = (rule: any, value: any, callback: any) => {
  if (value === passwordFormData.newPassword) {
    callback();
  } else {
    callback(new Error('两次输入的密码不一致'));
  }
};

// 密码验证规则
const passwordRules = reactive<FormRules<UserPassword>>({
  oldPassword: [
    {
      required: true,
      message: '请输入旧密码',
      trigger: 'blur',
    },
  ],
  newPassword: [
    {
      required: true,
      message: '请输入新密码',
      trigger: 'blur',
    },
    {
      validator: validateNewPassword,
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      required: true,
      message: '请确认新密码',
      trigger: 'blur',
    },
    {
      validator: validateConfirmPasswordMatch,
      trigger: 'blur',
    },
  ],
});

const submitPasswordForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    try {
      if (valid) {
        await updatePasswordApi(passwordFormData);
        ElMessage({
          message: '修改密码成功',
          type: 'success',
          plain: true,
        });
      }
    } finally {
      passwordFormRef.value?.resetFields();
    }
  });
};
</script>
<template>
  <div class="app-container">
    <el-row :gutter="8">
      <el-col :span="7">
        <el-card shadow="never" class="card">
          <div class="flex justify-center">
            <el-avatar
              shape="circle"
              :src="userStore.userInfo?.avatar"
              :size="140"
            />
          </div>
          <el-descriptions :column="1" border class="mt-8">
            <el-descriptions-item label="姓名">
              {{ userStore.userInfo?.realName }}
            </el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ getGenderLabel(userStore.userInfo?.gender) }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号码">
              {{ userStore.userInfo?.mobile }}
            </el-descriptions-item>
            <el-descriptions-item label="用户邮箱">
              {{ userStore.userInfo?.email }}
            </el-descriptions-item>
            <el-descriptions-item label="所属部门">
              {{ userStore.userInfo?.deptNames }}
            </el-descriptions-item>
            <el-descriptions-item label="所属岗位">
              {{ userStore.userInfo?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="所属角色">
              {{ userStore.userInfo?.roleNames }}
            </el-descriptions-item>
            <el-descriptions-item label="上次登录时间">
              {{ userStore.userInfo?.lastLoginTime }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="17">
        <el-card class="card" shadow="never">
          <el-tabs v-model="activeName">
            <el-tab-pane label="基本信息" name="name">
              <ElForm
                ref="userFormRef"
                :rules="userRules"
                :model="userFormData"
                label-width="100px"
              >
                <el-form-item>
                  <ImageUpload v-model:model-value="userFormData.avatar" />
                </el-form-item>
                <el-form-item label="姓名：" prop="realName">
                  <el-input
                    v-model="userFormData.realName"
                    placeholder="请输入用户姓名"
                  />
                </el-form-item>
                <el-form-item label="性别：" prop="gender">
                  <Dictionary
                    v-model="userFormData.gender"
                    type-code="gender"
                  />
                </el-form-item>
                <el-form-item label="手机号码：" prop="mobile">
                  <el-input
                    v-model="userFormData.mobile"
                    placeholder="请输入手机号码"
                    maxlength="11"
                  />
                </el-form-item>

                <el-form-item label="邮箱：" prop="email">
                  <el-input
                    v-model="userFormData.email"
                    placeholder="请输入邮箱"
                    maxlength="50"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    @click="submitUserForm(userFormRef)"
                  >
                    保存更改
                  </el-button>
                </el-form-item>
              </ElForm>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <ElForm
                ref="passwordFormRef"
                :rules="passwordRules"
                :model="passwordFormData"
                label-width="100px"
                class="mt-4"
              >
                <el-form-item label="旧密码" prop="oldPassword">
                  <el-input
                    v-model="passwordFormData.oldPassword"
                    type="password"
                    placeholder="请输入旧密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordFormData.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordFormData.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    @click="resetPasswordForm(passwordFormRef)"
                  >
                    重置
                  </el-button>
                  <el-button
                    type="primary"
                    @click="submitPasswordForm(passwordFormRef)"
                  >
                    保存
                  </el-button>
                </el-form-item>
              </ElForm>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style lang="scss" scoped>
.card {
  height: calc(100vh - 110px);
}

.card-header {
  justify-content: center;
}

.el-form-item {
  width: 480px;
}
</style>
