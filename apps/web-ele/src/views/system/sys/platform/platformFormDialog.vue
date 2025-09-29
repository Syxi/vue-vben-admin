<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { Platform } from '#/api/system/sys/platform';

import { reactive, ref } from 'vue';

import { ElMessage } from 'element-plus';

import {
  addPlatformApi,
  getPlatformInfoApi,
  updatePlatformApi,
} from '#/api/system/sys/platform';
import {MenuTypeEnum} from "#/enums/MenuTypesEnum";
import {IconPicker} from "@vben/common-ui";

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

const platformFormRef = ref<FormInstance>();

const formData = reactive<Platform>({
  id: '',
  name: '',
  icon: '',
  status: undefined,
  sort: undefined,
});

// 表单校验规则
const rules = reactive<FormRules<Platform>>({
  name: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'blur' }],
});

/**
 * 打开平台表单弹窗（暴露给 ref）
 * @param id 平台ID
 */
async function open(id?: string) {
  visible.value = true;
  title.value = id ? '修改平台' : '新增平台';
  if (id) {
    await getPlatformData(id);
  }
}

/**
 * 关闭平台表单弹窗（暴露给 ref）
 */
function close() {
  visible.value = false;
  platformFormRef.value?.resetFields();
  platformFormRef.value?.clearValidate();
  formData.id = '';
}

/**
 * 获取平台数据
 * @param id 平台ID
 */
async function getPlatformData(id: string) {
  const data = await getPlatformInfoApi(id);
  Object.assign(formData, data);
}

/**
 * 平台保存提交
 */
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid) => {
    if (valid) {
      const id = formData.id;
      await (id ? updatePlatformApi(formData) : addPlatformApi(formData));
      ElMessage.success(id ? '修改平台成功' : '新增平台成功');
      close();
      emit('success'); // 通知父组件刷新列表
    }
  });
};

// 暴露方法给 ref
defineExpose({ open, close });
</script>

<template>
  <!-- 弹窗主体 -->
  <el-dialog
    center
    draggable
    v-model="visible"
    :title="title"
    width="500px"
    @close="close"
    :z-index="100"
  >
    <ElForm
      ref="platformFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="平台名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入平台名称" />
      </el-form-item>

      <el-form-item label="平台路径" prop="path">
        <el-input v-model="formData.path" placeholder="请输入平台名称" />
      </el-form-item>

      <el-form-item label="平台icon" prop="icon">
        <IconPicker v-model="formData.icon" />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="-1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remake" :rows="4" />
      </el-form-item>
    </ElForm>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="handleSubmit(platformFormRef)">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped></style>
