<script setup lang="ts">
import type { SystemInfoVO } from '#/api/system/sys/systemInfo';

import { onMounted, ref } from 'vue';

import { getSystemInfo } from '#/api/system/sys/systemInfo';

const systemInfo = ref<SystemInfoVO>();

onMounted(async () => {
  systemInfo.value = await getSystemInfo();
});
</script>
<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-descriptions border :column="1" title="操作系统">
        <el-descriptions-item label="系统类型">
          {{ systemInfo?.osName }}
        </el-descriptions-item>
        <el-descriptions-item label="系统版本">
          {{ systemInfo?.osVersion }}
        </el-descriptions-item>
        <el-descriptions-item label="系统架构">
          {{ systemInfo?.osArch }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-card shadow="never" class="mt-5">
      <el-descriptions border :column="1" title="内存">
        <el-descriptions-item label="总内存">
          {{ systemInfo?.totalMemory }}G
        </el-descriptions-item>
        <el-descriptions-item label="已使用内存">
          {{ systemInfo?.usedMemory }}G
        </el-descriptions-item>
        <el-descriptions-item label="空闲内存">
          {{ systemInfo?.freeMemory }}G
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-card
      shadow="never"
      class="mt-5"
      v-for="item in systemInfo?.disks"
    >
      <el-descriptions border :column="1" :title="item.name">
        <el-descriptions-item label="硬盘路径">
          {{ item.mountPoint }}
        </el-descriptions-item>
        <el-descriptions-item label="硬盘总大小">
          {{ item.totalSpace }}G
        </el-descriptions-item>
        <el-descriptions-item label="已使用硬盘">
          {{ item.usedSpace }}G
        </el-descriptions-item>
        <el-descriptions-item label="空闲硬盘">
          {{ item.freeSpace }}G
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
</style>
