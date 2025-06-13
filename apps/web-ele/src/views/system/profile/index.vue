<script setup lang="ts">
import { ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { ElForm } from 'element-plus';

const useStore = useUserStore();

const activeName = ref('name');
const form = ref(ElForm);
const passwordForm = ref(ElForm);
</script>
<template>
  <div class="app-container">
    <el-row :gutter="8">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <span>个人信息</span>
          </template>
          <el-avatar
            shape="circle"
            :src="useStore.userInfo?.avatar"
            :size="140"
          />
          <el-descriptions :column="1" border class="mt-4">
            <el-descriptions-item label="用户名">
              {{ useStore.userInfo?.username }}
            </el-descriptions-item>
            <el-descriptions-item label="真实姓名">
              {{ useStore.userInfo?.realName }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号码">
              {{ useStore.userInfo?.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="用户邮箱">
              {{ useStore.userInfo?.email }}
            </el-descriptions-item>
            <el-descriptions-item label="所属部门">
              {{ useStore.userInfo?.department }}
            </el-descriptions-item>
            <el-descriptions-item label="所属岗位">
              {{ useStore.userInfo?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="所属角色">
              {{ useStore.userInfo?.position }}
            </el-descriptions-item>
            <el-descriptions-item label="上次登录时间">
              {{ useStore.userInfo?.position }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          <el-tabs v-model="activeName">
            <el-tab-pane label="个人信息" name="name">
              <ElForm ref="form" label-width="100px">
                <el-form-item label="用户名">
                  <el-input />
                </el-form-item>
                <el-form-item label="真实姓名">
                  <el-input />
                </el-form-item>
              </ElForm>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <ElForm ref="passwordForm" label-width="100px">
                <el-form-item label="旧密码">
                  <el-input />
                </el-form-item>
                <el-form-item label="新密码">
                  <el-input />
                </el-form-item>
              </ElForm>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style lang="scss" scoped></style>
