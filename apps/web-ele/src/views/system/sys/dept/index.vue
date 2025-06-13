<script setup lang="ts">
import type { DeptForm, DeptQuery, DeptVO } from '#/api/system/sys/dept';

import { onMounted, reactive, ref, watch } from 'vue';

import { ElForm, ElMessage, ElMessageBox, ElTree } from 'element-plus';

import {
  addDeptApi,
  deleteDeptApi,
  deptOptionTreeApi,
  editDeptApi,
  getDeptDetailApi,
  orgTreeApi,
} from '#/api/system/sys/dept';
import { useCardHeight } from '#/hooks/useCardHeight';

// 组织树
const deptTreeRef = ref(ElTree);

// 组织名称
const deptName = ref('');

watch(deptName, (val) => {
  deptTreeRef.value!.filter(val);
});

const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.label.includes(value);
};

// 组织下拉选项树数据
const deptTreeOptionData = ref<OptionType[]>([]);

// 组织树数据
const deptTableData = ref<DeptVO[]>([]);

// 加载状态
const loading = ref(false);

// 查询表单
const queryElFormRef = ref(ElForm);

// 查询参数
const queryParams = reactive<DeptQuery>({});

// 弹出窗组织表单
const orgFormRef = ref(ElForm);

// 组织表单数据
const formData = reactive<DeptForm>({
  status: 1,
});

const rules = reactive({
  parentId: [{ required: true, message: '上级机构不能为空', trigger: 'blur' }],
  deptName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  deptCode: [{ required: true, message: '编码不能为空', trigger: 'blur' }],
  deptType: [{ required: true, message: '类型不能为空', trigger: 'blur' }],
});

// 新增或编辑机构，弹出窗
const dialog = reactive({
  visiable: false,
  title: '',
  type: '',
  width: 600,
});

/**
 * 查询机构树
 */
function handleQuery() {
  loading.value = true;
  orgTreeApi(queryParams)
    .then((data) => {
      deptTableData.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryElFormRef.value.resetFields();
  queryParams.keyWord = undefined;
  handleQuery();
}

/**
 * 新增或编辑机构，打开弹出窗
 */
async function handleOpenDialog(id?: string, parentId?: string) {
  dialog.visiable = true;
  // 组织下拉树
  await OrgOptionTree();

  if (id) {
    dialog.title = '修改';
    const data = await getDeptDetailApi(id);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增';
    formData.parentId = parentId;
  }
}

/**
 * 新增或编辑机构，关闭弹出窗
 */
function handleCloseDialog() {
  orgFormRef.value.resetFields();
  orgFormRef.value.clearValidate();
  formData.id = undefined;
  dialog.visiable = false;
}

/**
 * 提交表单
 * @param deptId
 */
async function handleSubmit() {
  const valid = orgFormRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const id = formData.id;
    await (id ? editDeptApi(formData) : addDeptApi(formData));
    ElMessage.success(id ? '修改成功！' : '新增成功');
    handleCloseDialog();
    resetQuery();
    await OrgOptionTree();
  } finally {
    loading.value = false;
  }
}

/**
 * 删除机构或部门
 * @param deptId
 */
function handleDelete(id?: string) {
  if (id) {
    ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        deleteDeptApi(id).then(() => {
          ElMessage.success('删除成功!');
          resetQuery();
          OrgOptionTree();
        });
      })
      .catch(() => {
        ElMessage.info('已取消删除!');
      });
  }
}

/**
 * 组织机构部门下拉树
 */
async function OrgOptionTree() {
  deptTreeOptionData.value = await deptOptionTreeApi();
}

onMounted(() => {
  handleQuery();
  OrgOptionTree();
});

const cardFormRef = ref();
const { cardHeight, tableHeight } = useCardHeight(cardFormRef);
</script>

<template>
  <div class="app-container">
    <el-card ref="cardFormRef" class="mb-2">
      <ElForm
        ref="queryElFormRef"
        :inline="true"
        :model="queryParams"
        class="mb-2"
      >
        <el-form-item prop="deptName">
          <el-input
            placeholder="机构名称"
            clearable
            style="width: 240px"
            v-model="queryParams.keyWord"
            @keyup.enter="handleQuery()"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery()">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="resetQuery()">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>

          <el-button
            type="primary"
            @click="handleOpenDialog()"
            v-access:code="['sys:dept:add']"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增机构
          </el-button>
        </el-form-item>
      </ElForm>
    </el-card>

    <el-card :style="{ height: cardHeight }">
      <el-table
        border
        :data="deptTableData"
        v-loading="loading"
        default-expand-all
        row-key="id"
        highlight-current-row
        :height="tableHeight"
      >
        <!-- <el-table-column
          v-if="false"
          prop="id"
        />

        <el-table-column
          v-if="false"
          prop="deptId"
        />

        <el-table-column
          v-if="false"
          prop="parentId"
        /> -->

        <el-table-column label="名称" prop="deptName" align="left" />

        <el-table-column
          label="类型"
          prop="deptType"
          align="center"
          width="100"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.deptType === 1" type="primary">
              机构
            </el-tag>
            <el-tag v-else type="success">部门</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="编码"
          prop="deptCode"
          align="center"
          width="120"
        />

        <el-table-column label="排序" prop="sort" align="center" width="80" />

        <el-table-column label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success"> 显示 </el-tag>
            <el-tag v-else type="info">隐藏</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="创建时间"
          prop="createTime"
          align="center"
          width="200"
        />

        <el-table-column align="center" label="操作">
          <template #default="scope">
            <el-button
              v-if="scope.row.deptType === 1"
              type="primary"
              link
              size="small"
              v-access:code="['sys:dept:add']"
              @click="handleOpenDialog(null, scope.row.parentId)"
            >
              <el-icon><Plus /></el-icon>
              新增
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:dept:edit']"
              @click="handleOpenDialog(scope.row.id, null)"
            >
              <el-icon><Edit /></el-icon> 编辑
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:dept:delete']"
              @click="handleDelete(scope.row.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialog.visiable"
      :title="dialog.title"
      :width="dialog.width"
      append-to-body
      draggable
      center
      @close="handleCloseDialog()"
    >
      <ElForm
        ref="orgFormRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="上级机构" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="deptTreeOptionData"
            filterable
            check-strictly
            :default-expand-all="true"
          />
        </el-form-item>

        <el-form-item prop="deptName" label="名称">
          <el-input v-model="formData.deptName" placeholder="名称" />
        </el-form-item>

        <el-form-item prop="deptCode" label="编码">
          <el-input v-model="formData.deptCode" placeholder="编码" />
        </el-form-item>

        <el-form-item label="类型" prop="deptType">
          <el-radio-group v-model="formData.deptType">
            <el-radio :value="1">机构</el-radio>
            <el-radio :value="2">部门</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="-1">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleCloseDialog()">
            取消
          </el-button>
          <el-button type="primary" @click="handleSubmit()">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
