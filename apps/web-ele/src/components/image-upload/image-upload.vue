<!-- 单图片上传组件 -->
<script setup lang="ts">
import type { UploadRawFile, UploadRequestOptions } from 'element-plus';

import { useVModel } from '@vueuse/core';
import { ElMessage } from 'element-plus';

import { uploadImageApi } from '#/api/system/media/image';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);
const imgUrl = useVModel(props, 'modelValue', emit);

/**
 * 自定义图片上传
 *
 * @param options
 */
async function uploadFile(options: UploadRequestOptions): Promise<any> {
  const url = await uploadImageApi(options.file);
  imgUrl.value = `${import.meta.env.VITE_GLOB_API_URL}${url}`;
}

/**
 * 限制用户上传文件的格式和大小
 */
function handleBeforeUpload(file: UploadRawFile) {
  if (file.size > 5 * 1048 * 1048) {
    ElMessage.warning('上传图片不能大于5M');
    return false;
  }
  return true;
}
</script>

<template>
  <el-upload
    v-model="imgUrl"
    class="single-uploader"
    :show-file-list="false"
    :before-upload="handleBeforeUpload"
    :http-request="uploadFile"
  >
    <el-image v-if="imgUrl" :src="imgUrl" class="single-uploader__image" />
    <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
  </el-upload>
</template>

<style scoped lang="scss">
.single-uploader {
  overflow: hidden;
  cursor: pointer;
  border: 1px var(--el-border-color) solid;
  border-radius: 6px;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &__image {
    display: block;
    width: 178px;
    height: 178px;
  }

  &___icon {
    width: 178px;
    height: 178px;
    font-size: 28px;
    color: #8c939d;
    text-align: center;
  }
}

.avatar-uploader-icon {
  width: 178px;
  height: 178px;
  font-size: 28px;
  color: #8c939d;
  text-align: center;
}
</style>
