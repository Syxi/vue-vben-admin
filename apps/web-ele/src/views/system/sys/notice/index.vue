<script setup lang="ts">
import type {
  NoticeForm,
  NoticeQuery,
  NoticeVO,
} from '#/api/system/sys/notice';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  addNoticeApi,
  cancelPublishNoticesApi,
  cancelTopNoticeApi,
  deleteNoticeApi,
  getNoticeApi,
  publishNoticesApi,
  selectNoticePageApi,
  topNoticeApi,
  updateNoticeApi,
} from '#/api/system/sys/notice';
import { WangEditor } from '#/components/wang-editor';

defineOptions({
  name: 'Notice',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const noticeFormRef = ref(ElForm);

const loading = ref(false);

const noticeIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<NoticeQuery>({
  page: 1,
  limit: 10,
});

const noticeTableData = ref<NoticeVO[]>();

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<NoticeForm>({
  isPublish: -1,
  isTop: -1,
  noticeContent: '',
});

const rules = reactive({
  noticeTitle: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  isPublish: [{ required: true, message: '请选择是否发布', trigger: 'blur' }],
  isTop: [{ required: true, message: '请选择是否置顶', trigger: 'blur' }],
});

interface CheckedNotice {
  noticeId?: string;
  noticeTitle?: string;
}

const checkedNotice: CheckedNotice = reactive({});

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选
  noticeIds.value = selection.map((item: any) => item.noticeId);
}

/**
 * 查询
 */
function handleQuery() {
  loading.value = true;
  selectNoticePageApi(queryParams)
    .then((data) => {
      noticeTableData.value = data.list;
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
 * 打开表单弹窗
 * @param noticeId
 */
async function openDialog(noticeId?: string) {
  dialog.visible = true;
  if (noticeId) {
    dialog.title = '修改通知';
    const data = await getNoticeApi(noticeId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增通知';
  }
}

/**
 * 保存提交
 */
function handleSubmit() {
  noticeFormRef.value.validate((valid: any) => {
    if (valid) {
      loading.value = true;
      const noticeId = formData.noticeId;
      if (noticeId) {
        updateNoticeApi(formData)
          .then(() => {
            ElMessage.success('修改成功');
            closeDialog();
            resetQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        addNoticeApi(formData)
          .then(() => {
            ElMessage.success('新增成功');
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
  noticeFormRef.value.resetFields();
  noticeFormRef.value.clearValidate();

  formData.noticeId = undefined;
  formData.noticeContent = '';
}

/**
 * 删除岗位
 * @param noticeId
 */
function handleDelete(noticeId?: string) {
  let ids: string[];
  if (noticeId) {
    ids = [String(noticeId)]; // 删除单条记录
  } else if (noticeIds.value.length > 0) {
    ids = noticeIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deleteNoticeApi(ids)
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
 * 置顶通知
 */
function handleTopNotice() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾选置顶项');
  } else if (noticeIds.value.length > 1) {
    ElMessage.error('不能置顶多条通知');
  } else {
    const noticeId = String(noticeIds.value[0]); // 勾选一条通知
    topNoticeApi(noticeId).then(() => {
      ElMessage.success('置顶通知成功');
      resetQuery();
    });
  }
}

/**
 *  取消置顶通知
 */
function handleCancelTopNotice() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾取消选置顶项');
  } else if (noticeIds.value.length > 1) {
    ElMessage.error('不能取消置顶多条通知');
  } else {
    const noticeId = String(noticeIds.value[0]); // 勾选一条通知
    cancelTopNoticeApi(noticeId).then(() => {
      ElMessage.success('取消置顶通知成功');
      resetQuery();
    });
  }
}

/**
 * 发布通知
 */
function publishNotices() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾选发布项');
  } else {
    publishNoticesApi(noticeIds.value).then(() => {
      ElMessage.success('发布通知成功');
      resetQuery();
    });
  }
}

/**
 * 取消发布通知
 */
function cancelPublishNotices() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾选发布项');
  } else {
    cancelPublishNoticesApi(noticeIds.value).then(() => {
      ElMessage.success('取消发布通知成功');
      resetQuery();
    });
  }
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="roleName">
          <el-input
            v-model="queryParams.noticeTitle"
            placeholder="通知标题"
            clearable
            @keyup.enter="handleQuery"
          />
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
            v-access:code="['sys:notice:add']"
            @click="openDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button type="primary" @click="openDialog()"> 查看 </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:top']"
            @click="handleTopNotice"
          >
            置顶
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:cancelTop']"
            @click="handleCancelTopNotice"
          >
            取消置顶
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:publish']"
            @click="publishNotices"
          >
            发布
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:cancelPublish']"
            @click="cancelPublishNotices"
          >
            取消发布
          </el-button>

          <el-button
            type="danger"
            :disabled="noticeIds.length === 0"
            v-access:code="['sys:notice:delete']"
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
        ref="dataTableRef"
        v-loading="loading"
        :data="noticeTableData"
        highlight-current-row
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column
          label="通知标题"
          prop="noticeTitle"
          width="200"
          align="center"
        />

        <el-table-column
          label="通知内容"
          prop="noticeContent"
          width="200"
          align="center"
        />

        <el-table-column label="置顶" prop="isTop" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isTop === 1" type="success">置顶</el-tag>
            <el-tag v-else type="info">未置顶</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="状态"
          prop="isPublish"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.isPublish === 1" type="success">
              发布
            </el-tag>
            <el-tag v-else type="info">未发布</el-tag>
          </template>
        </el-table-column>

        <!-- <el-table-column
            label="置顶时间"
            prop="topTime"
            width="250"
            align="center"
          /> -->

        <el-table-column
          label="创建时间"
          prop="createTime"
          width="250"
          align="center"
        />

        <el-table-column
          label="更新时间"
          prop="updateTime"
          width="250"
          align="center"
        />

        <el-table-column label="操作" fixed="right" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:notice:edit']"
              @click="openDialog(scope.row.noticeId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:notice:delete']"
              @click="handleDelete(scope.row.noticeId)"
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
      v-model="dialog.visible"
      :title="dialog.title"
      @close="closeDialog"
      center
    >
      <ElForm
        ref="noticeFormRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="标题：" prop="noticeTitle">
          <el-input
            v-model="formData.noticeTitle"
            placeholder="请输入通知标题"
          />
        </el-form-item>

        <el-form-item label="发布：" prop="isPublish">
          <el-radio-group v-model="formData.isPublish">
            <el-radio :value="1">发布</el-radio>
            <el-radio :value="-1">未发布</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="置顶：" prop="isTop">
          <el-radio-group v-model="formData.isTop">
            <el-radio :value="1">置顶</el-radio>
            <el-radio :value="-1">取消置顶</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="通知内容：">
          <WangEditor v-model:model-value="formData.noticeContent" />
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
