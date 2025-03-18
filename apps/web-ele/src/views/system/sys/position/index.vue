<script setup lang="ts">
import type {
  PositionForm,
  PositionQuery,
  PositionVO,
} from '#/api/system/sys/position';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import { orgOptionTreeApi } from '#/api/system/sys/organiation';
import {
  addPositionApi,
  deletePositionApi,
  getPositionApi,
  selectPositionPageApi,
  updatePositionApi,
} from '#/api/system/sys/position';

defineOptions({
  name: 'Position',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const positionFormRef = ref(ElForm);

const loading = ref(false);

const positionIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<PositionQuery>({
  page: 1,
  limit: 10,
});

const positionTableData = ref<PositionVO[]>();

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<PositionForm>({
  sort: 1,
  status: 1,
  positionName: '',
});

const rules = reactive({
  positionName: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' },
  ],
});

// 组织下拉选项树数据
const organTreeOptionData = ref<OptionType[]>([]);

interface CheckedPosition {
  positionId?: string;
  positionName?: string;
}

const checkedPosition: CheckedPosition = reactive({});

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选
  positionIds.value = selection.map((item: any) => item.positionId);
}

/**
 * 查询
 */
function handleQuery() {
  loading.value = true;
  selectPositionPageApi(queryParams)
    .then((data) => {
      positionTableData.value = data.list;
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
 * @param positionId
 */
async function openDialog(positionId?: string) {
  dialog.visible = true;
  if (positionId) {
    dialog.title = '修改岗位';
    const data = await getPositionApi(positionId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增岗位';
  }
}

/**
 * 保存提交
 */
function handleSubmit() {
  positionFormRef.value.validate((valid: any) => {
    if (valid) {
      loading.value = true;
      const positionId = formData.positionId;
      if (positionId) {
        updatePositionApi(formData)
          .then(() => {
            ElMessage.success('修改岗位成功');
            closeDialog();
            resetQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        addPositionApi(formData)
          .then(() => {
            ElMessage.success('新增岗位成功');
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
  positionFormRef.value.resetFields();
  positionFormRef.value.clearValidate();

  formData.positionId = undefined;
  formData.sort = 1;
  formData.status = 1;
}

/**
 * 删除岗位
 * @param positionId
 */
function handleDelete(positionId?: string) {
  let ids: string[];
  if (positionId) {
    ids = [String(positionId)]; // 删除单条记录
  } else if (positionIds.value.length > 0) {
    ids = positionIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项', '警告', {
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deletePositionApi(ids)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

// 获取部门下拉选项
async function getOrganTreeptions() {
  const data = await orgOptionTreeApi();
  organTreeOptionData.value = data;
  organTreeOptionData.value = [{ value: '0', label: '根节点', children: data }];
}

onMounted(() => {
  handleQuery();
  getOrganTreeptions();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="roleName">
          <el-input
            v-model="queryParams.positionName"
            placeholder="岗位名称"
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
            v-access:code="['sys:position:add']"
            @click="openDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="danger"
            :disabled="positionIds.length === 0"
            v-access:code="['sys:position:delete']"
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
        :data="positionTableData"
        highlight-current-row
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column
          label="岗位名称"
          prop="positionName"
          width="200"
          align="center"
        />

        <el-table-column
          label="所属部门"
          prop="organName"
          width="200"
          align="center"
        />

        <el-table-column label="状态" prop="status" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sort" width="100" align="center" />

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
              v-access:code="['sys:position:edit']"
              @click="openDialog(scope.row.positionId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:position:delete']"
              @click="handleDelete(scope.row.positionId)"
            >
              <el-icon><Delete /></el-icon>删除
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
        ref="positionFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="岗位名称" prop="positionName">
          <el-input
            v-model="formData.positionName"
            placeholder="请输入岗位名称"
          />
        </el-form-item>

        <el-form-item label="机构" prop="organId">
          <el-tree-select
            v-model="formData.organId"
            :data="organTreeOptionData"
            :render-after-expand="false"
            check-strictly
            filterable
          />
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
