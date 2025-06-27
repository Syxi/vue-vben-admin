<script setup lang="ts">
import type { DictTypeForm } from '#/api/system/sys/dictType';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  addDictTypeApi,
  editDictTypeApi,
  getDictTypeDetailApi,
} from '#/api/system/sys/dictType';

const emit = defineEmits<{ (e: 'success'): void }>();

const dataFormRef = ref(ElForm);

const loading = ref(false);

const formData = reactive<DictTypeForm>({
  status: 1,
});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  name: [{ required: true, message: '请输入字典类型名称', trigger: 'blur' }],
  typeCode: [
    { required: true, message: '请输入字典类型编码', trigger: 'blur' },
  ],
});

/**
 * 打开字典类型表单弹窗
 * @param dictTypeId
 */
async function openDialog(dictTypeId?: string) {
  dialog.visible = true;
  if (dictTypeId) {
    dialog.title = '修改字典类型';
    const data = await getDictTypeDetailApi(dictTypeId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增字典类型';
  }
}

/**
 * 关闭弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();

  formData.id = undefined;
  formData.status = 1;
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const valid = dataFormRef.value.validate();
  if (!valid) return;

  loading.value = true;
  const dictTypeId = formData.id;
  await (dictTypeId ? editDictTypeApi(formData) : addDictTypeApi(formData));
  ElMessage.success(dictTypeId ? '修改成功' : '新增成功');
  emit('success');
  loading.value = false;
  closeDialog();
}

defineExpose({ openDialog });
</script>

<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    append-to-body
    draggable
    center
    width="500px"
    @close="closeDialog()"
  >
    <ElForm
      ref="dataFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="字典类型名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入字典类型名称" />
      </el-form-item>

      <el-form-item label="字典类型编码" prop="typeCode">
        <el-input
          v-model="formData.typeCode"
          placeholder="请输入字典类型编码"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">正常</el-radio>
          <el-radio label="-1">停用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="字典类型备注"
          :autosize="{ minRows: 2, maxRows: 6 }"
        />
      </el-form-item>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="handleSubmit()">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
