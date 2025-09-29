<script setup lang="ts">
import type { Platform } from '#/api/system/sys/platform';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { ElMessageBox } from 'element-plus';

import { selectPlatformHomeApi } from '#/api/system/sys/platform';
import { useAuthStore } from '#/store';

const authStore = useAuthStore();

const platformData = ref<Platform[]>([]);

// 平台系统列表
const platformList = () => {
  selectPlatformHomeApi().then((data) => {
    platformData.value = data;
  });
};

const logout = () => {
  ElMessageBox.confirm('确定退出系统?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    authStore.logout();
  });
};

onMounted(() => {
  platformList();
});
</script>

<template>
  <div class="contain-content">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <h1 class="logo">平台首页</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="logout()"> 退出 </el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <el-row :gutter="20" justify="start">
        <el-col
          v-for="(item, index) in platformData"
          :key="index"
          :xs="24"
          :sm="12"
          :md="6"
          class="system-card-col"
        >
          <router-link :to="item.path" target="_blank">
            <el-card shadow="hover" class="system-card">
              <div class="icon">
                <Icon :icon="item.icon" />
              </div>
              <div class="title">
                <h3>{{ item.name }}</h3>
              </div>
            </el-card>
          </router-link>
        </el-col>
      </el-row>
    </main>
  </div>
</template>

<style scoped>
.contain-content {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  color: white;
  background: #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 10%);
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
}

.main-content {
  padding: 40px 20px;
  margin-right: 200px;
  margin-left: 200px;
}

.system-card-col {
  margin-bottom: 24px;
}

.system-card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  cursor: pointer;
  border-width: 2px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.system-card:hover {
  transform: translateY(-6px);
}

.card-content {
  text-align: center;
}

.icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 60px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}
</style>
