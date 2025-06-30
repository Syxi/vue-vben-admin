<script setup lang="ts">
import type { ScheduledJobForm } from '#/api/system/log/scheduledJob';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  addScheduledJobApi,
  getScheduledJobDetailApi,
  updateScheduledJobApi,
} from '#/api/system/log/scheduledJob';

const emit = defineEmits<{ (e: 'success'): void }>();

const scheduledJobFormRef = ref(ElForm);

const jobClassNameOptions = ref<string[]>([]);

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<ScheduledJobForm>({
  status: 1,
  jobName: '',
  jobClass: '',
  cronPopover: false,
});

const rules = reactive({
  jobName: [{ required: true, message: '请输入定时任务名称', trigger: 'blur' }],
  jobClass: [{ required: true, message: '请选择定时任务类', trigger: 'blur' }],
  cronExpression: [
    { required: true, message: '请选择cron表达式', trigger: 'blur' },
  ],
});

/**
 * 打开定时任务表单弹窗
 * @param jobId
 * @param jobClassName
 */
async function openDialog(jobId?: string, jobClassName?: string[]) {
  jobClassNameOptions.value = jobClassName;
  if (jobId) {
    dialog.title = '修改定时任务';
    const data = await getScheduledJobDetailApi(jobId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增定时任务';
  }
  dialog.visible = true;
}

/**
 * 定时任务保存提交
 */
async function handleSubmit() {
  const valid = scheduledJobFormRef.value.validate();
  if (!valid) return;
  const jobId = formData.jobId;
  await (jobId
    ? updateScheduledJobApi(formData)
    : addScheduledJobApi(formData));
  ElMessage.success(jobId ? '修改定时任务成功' : '新增定时任务成功');
  emit('success');
  closeDialog();
}

/**
 * 关闭表单弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  scheduledJobFormRef.value.resetFields();
  scheduledJobFormRef.value.clearValidate();

  formData.jobId = undefined;
  formData.jobName = '';
  formData.cronExpression = '';
  formData.jobClass = '';
}

defineExpose({ openDialog });
</script>
<template>
  <el-dialog
    center
    draggable
    v-model="dialog.visible"
    :title="dialog.title"
    width="600px"
    @close="closeDialog"
  >
    <div v-loading="loading"></div>
    <ElForm
      ref="scheduledJobFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="定时任务名称" prop="jobName">
        <el-input v-model="formData.jobName" placeholder="请输入定时任务名称" />
      </el-form-item>

      <el-form-item label="定时任务类" prop="jobClass">
        <el-select v-model="formData.jobClass" placeholder="Select">
          <el-option
            v-for="item in jobClassNameOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="cron表达式" prop="cronExpression">
        <el-input v-model="formData.cronExpression" placeholder="cron表达式" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          :rows="2"
          type="textarea"
          placeholder="备注"
        />
      </el-form-item>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
