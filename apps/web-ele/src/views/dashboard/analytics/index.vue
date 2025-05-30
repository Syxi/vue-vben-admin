<script lang="ts" setup>
import { useScrollbarHeight } from '#/hooks/useScrollbarHeight';

const cardHeight = useScrollbarHeight(140);
</script>

<template>
  <div class="app-container">
    <el-card :style="{ height: cardHeight }" />
  </div>
</template>
