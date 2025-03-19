<script setup lang="ts">
import type {
  ScheduledJobForm,
  ScheduledJobPage,
  ScheduledJobQuery,
} from '#/api/system/log/scheduledJob';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  addScheduledJobApi,
  deleteScheduledJobApi,
  executeJobsApi,
  getScheduledJobDetailApi,
  pauseJobsApi,
  scheduledJobPageApi,
  selectJobBeanNameListApi,
  updateScheduledJobApi,
} from '#/api/system/log/scheduledJob';

defineOptions({
  name: 'ScheduledJob',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const scheduledJobFormRef = ref(ElForm);

const loading = ref(false);

const jobIds = ref<string[]>([]);

const jobClassNameOptions = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<ScheduledJobQuery>({
  page: 1,
  limit: 10,
});

const scheduledJobList = ref<ScheduledJobPage[]>();

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

interface CheckedScheduledJob {
  jobId?: string;
  jobeName?: string;
}

const checkedScheduledJob: CheckedScheduledJob = reactive({});

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any[]) {
  // 没有选中项，情况jobIds
  jobIds.value = selection.map((item: any) => item.jobId); // 多选
}

const changeCron = (val: any) => {
  if (typeof val !== 'string') return false;
  formData.cronExpression = val;
};

/**
 * 查询定时任务
 */
function handleQuery() {
  loading.value = true;
  scheduledJobPageApi(queryParams)
    .then((data) => {
      scheduledJobList.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 重置查询
 */
function resetQuery() {
  queryFormRef.value.resetFields();
  queryParams.page = 1;
  handleQuery();
}

/**
 * 打开定时任务表单弹窗
 * @param roleId
 */
async function openDialog(jobId?: string) {
  console.log(`jobId: ${jobId}`);
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
function handleSubmit() {
  scheduledJobFormRef.value.validate((valid: any) => {
    if (valid) {
      loading.value = true;
      const jobId = formData.jobId;
      if (jobId) {
        updateScheduledJobApi(formData)
          .then(() => {
            ElMessage.success('修改定时任务成功');
            closeDialog();
            resetQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        addScheduledJobApi(formData)
          .then(() => {
            ElMessage.success('新增定时任务成功');
            closeDialog();
            resetQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      }
    }
  });
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

/**
 * 删除定时任务
 * @param roleId
 */
function handleDelete(jobId?: string) {
  let ids: string[];
  if (jobId) {
    ids = [String(jobId)]; // 删除单条记录
  } else if (jobIds.value.length > 0) {
    ids = jobIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项');
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deleteScheduledJobApi(ids)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

/**
 * 执行定时任务
 */
function executeJobs(jobId?: string) {
  let ids: string[];
  if (jobId) {
    ids = [String(jobId)]; // 执行单条记录
  } else if (jobIds.value.length > 0) {
    ids = jobIds.value; // 执行多条记录
  } else {
    ElMessage.warning('请勾选项');
    return;
  }

  if (ids.length > 0) {
    ElMessageBox.confirm('确定执行定时任务?', '执行定时任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
      .then(() => {
        executeJobsApi(ids).then(() => {
          ElMessage.success('执行定时任务成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('执行定时任务失败');
        resetQuery();
      });
  }
}

/**
 * 暂停定时任务
 */
function pauseJobs(jobId?: string) {
  let ids: string[];
  if (jobId) {
    ids = [String(jobId)]; // 暂停单条记录
  } else if (jobIds.value.length > 0) {
    ids = jobIds.value; // 暂停多条记录
  } else {
    ElMessage.warning('请勾选项');
    return;
  }

  if (ids.length > 0) {
    ElMessageBox.confirm('确定暂停定时任务?', '暂停定时任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        pauseJobsApi(ids).then(() => {
          ElMessage.success('暂停停定时任务成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('暂停停定时任务失败');
        resetQuery();
      });
  }
}

function handleJobBeanName() {
  selectJobBeanNameListApi().then((data) => {
    jobClassNameOptions.value = data;
  });
}

onMounted(() => {
  handleQuery();
  handleJobBeanName();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="jobName">
          <el-input
            v-model="queryParams.jobName"
            placeholder="定时任务名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-select
            v-model="queryParams.status"
            placeholder="定时任务状态"
            clearable
            style="width: 150px"
            @change="handleQuery()"
          >
            <el-option label="正常" value="1" />
            <el-option label="禁用" value="-1" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="resetQuery">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>

          <el-button
            type="primary"
            @click="openDialog()"
            v-access:code="['sys:scheduledJob:add']"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:scheduledJob:run']"
            @click="executeJobs()"
          >
            <template #icon>
              <el-icon><VideoPlay /></el-icon>
            </template>
            启用
          </el-button>

          <el-button
            type="danger"
            v-access:code="['sys:scheduledJob:pause']"
            @click="pauseJobs()"
          >
            <template #icon>
              <el-icon><VideoPlay /></el-icon>
            </template>
            暂停
          </el-button>

          <el-button
            type="danger"
            v-access:code="['sys:scheduledJob:delete']"
            :disabled="jobIds.length === 0"
            @click="handleDelete()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>
        </el-form-item>
      </ElForm>
    </div>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="scheduledJobList"
        highlight-current-row
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column v-if="false" prop="jobId" />

        <el-table-column label="定时任务名称" prop="jobName" align="center" />

        <el-table-column
          label="定时任务类"
          prop="jobClass"
          width="400"
          align="center"
        />

        <el-table-column
          label="cron表达式"
          prop="cronExpression"
          align="center"
        />

        <el-table-column
          label="任务状态"
          prop="status"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">暂停</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createTime" align="center" />

        <el-table-column label="备注" prop="remark" align="center" />

        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:scheduledJob:edit']"
              @click="openDialog(scope.row.jobId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:scheduledJob:run']"
              @click="executeJobs(scope.row.jobId)"
            >
              <el-icon><VideoPlay /></el-icon>启用
            </el-button>

            <el-button
              type="danger"
              link
              size="small"
              v-access:code="['sys:scheduledJob:pause']"
              @click="pauseJobs(scope.row.jobId)"
            >
              <el-icon><CircleClose /></el-icon>暂停
            </el-button>

            <el-button
              type="danger"
              link
              size="small"
              v-access:code="['sys:scheduledJob:delete']"
              @click="handleDelete(scope.row.jobId)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
    </el-card>

    <!-- 表单弹窗 -->
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
          <el-input
            v-model="formData.jobName"
            placeholder="请输入定时任务名称"
          />
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
          <el-input
            v-model="formData.cronExpression"
            placeholder="cron表达式"
          />
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
          <el-button type="primary" @click="handleSubmit">确定</el-button>
          <el-button @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
