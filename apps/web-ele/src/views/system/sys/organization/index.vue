<script setup lang="ts">
import type {
  OrganizationForm,
  OrganizationQuery,
  OrganizationVO,
} from '#/api/system/sys/organiation';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { ElForm, ElMessage, ElMessageBox, ElTree } from 'element-plus';

import {
  addOrgApi,
  deleteOrgApi,
  editOrgApi,
  getOrgDetailApi,
  orgOptionTreeApi,
  orgTreeApi,
} from '#/api/system/sys/organiation';

// 组织树
const organTreeRef = ref(ElTree);

// 组织名称
const organName = ref('');

watch(organName, (val) => {
  organTreeRef.value!.filter(val);
});

const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.label.includes(value);
};

// 组织下拉选项树数据
const organTreeOptionData = ref<OptionType[]>([]);

// 组织树数据
const OrganTableData = ref<OrganizationVO[]>([]);

// 加载状态
const loading = ref(false);

// 查询表单
const queryElFormRef = ref(ElForm);

// 查询参数
const queryParams = reactive<OrganizationQuery>({});

// 弹出窗组织表单
const orgFormRef = ref(ElForm);

// 组织表单数据
const formData = reactive<OrganizationForm>({
  status: 1,
});

const orgTypeLabel = computed(() => {
  return formData.organType === 0 ? '机构名称' : '部门名称';
});

const rules = reactive({
  parentId: [{ required: true, message: '上级机构不能为空', trigger: 'blur' }],
  organName: [{ required: true, message: '机构名称不能为空', trigger: 'blur' }],
  organType: [{ required: true, message: '机构类型不能为空', trigger: 'blur' }],
});

// 机构类型下拉选项
const options = [
  { value: 1, label: '机构' },
  { value: 2, label: '部门' },
];

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
      OrganTableData.value = data;
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
async function handleOpenDialog(parentId?: string, id?: string) {
  dialog.visiable = true;
  // 组织下拉树
  await OrgOptionTree();

  if (id) {
    dialog.title = '修改机构';
    const data = await getOrgDetailApi(id);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增机构';
    formData.parentId = parentId;
  }
}

/**
 * 新增或编辑机构，关闭弹出窗
 */
function handleCloseDialog() {
  dialog.visiable = false;
  orgFormRef.value.resetFields();
  orgFormRef.value.clearValidate();
}

/**
 * 提交表单
 * @param deptId
 */
function handleSubmit() {
  orgFormRef.value.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        editOrgApi(formData)
          .then(() => {
            ElMessage.success('修改成功!');
            handleCloseDialog();
            resetQuery();
            OrgOptionTree();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        addOrgApi(formData)
          .then(() => {
            ElMessage.success('新增成功!');
            handleCloseDialog();
            resetQuery();
            OrgOptionTree();
          })
          .finally(() => {
            loading.value = false;
          });
      }
    }
  });
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
        deleteOrgApi(id).then(() => {
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
  const data = await orgOptionTreeApi();
  organTreeOptionData.value = data;
  organTreeOptionData.value = [{ value: '0', label: '机构树', children: data }];
}

onMounted(() => {
  handleQuery();
  OrgOptionTree();
});
</script>

<template>
  <div class="app-container">
    <el-row>
      <!-- 部门树 -->
      <el-col :lg="4" :xs="24">
        <el-card shadow="never">
          <el-input
            v-model="organName"
            style="width: 240px"
            placeholder="机构名称"
          >
            <template #prefix>
              <el-icon class="el-input__icon"><search /></el-icon>
            </template>
          </el-input>

          <ElTree
            class="mt-5"
            ref="organTreeRef"
            :data="organTreeOptionData"
            highlight-current
            :default-expand-all="true"
            :filter-node-method="filterNode"
          />
        </el-card>
      </el-col>

      <el-col :lg="20" :xs="24">
        <div class="search-container">
          <ElForm ref="queryElFormRef" :inline="true" :model="queryParams">
            <el-form-item prop="organName">
              <el-input
                placeholder="机构名称"
                clearable
                v-model="queryParams.keyWord"
                @keyup.enter="handleQuery()"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleQuery()">
                <template #icon><i-ep-search /></template>
                搜索
              </el-button>

              <el-button type="primary" @click="resetQuery()">
                <template #icon><i-ep-refresh /></template>
                重置
              </el-button>

              <el-button
                type="primary"
                @click="handleOpenDialog('0')"
                v-hasPerm="['sys:organ:add']"
              >
                <template #icon><i-ep-plus /></template>
                新增机构
              </el-button>
            </el-form-item>
          </ElForm>
        </div>

        <el-card class="table-container">
          <el-table
            border
            :data="OrganTableData"
            v-loading="loading"
            default-expand-all
            row-key="id"
            highlight-current-row
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

            <el-table-column
              label="名称"
              prop="organName"
              align="left"
              min-width="200"
            />

            <el-table-column
              label="机构类型"
              prop="organType"
              align="center"
              width="100"
            >
              <template #default="scope">
                <el-tag v-if="scope.row.organType === 1" type="primary">
                  机构
                </el-tag>
                <el-tag v-else type="warning">部门</el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="机构编码"
              prop="organCode"
              align="center"
              width="120"
            />

            <el-table-column
              label="排序"
              prop="sort"
              align="center"
              width="80"
            />

            <el-table-column label="状态" align="center" width="80">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 1" type="success">
                  显示
                </el-tag>
                <el-tag v-else type="info">隐藏</el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="创建时间"
              prop="createTime"
              align="center"
              width="200"
            />

            <el-table-column
              fixed="right"
              align="center"
              label="操作"
              width="300"
            >
              <template #default="scope">
                <el-button
                  v-if="scope.row.organType === 1"
                  type="primary"
                  link
                  size="small"
                  v-hasPerm="['sys:organ:add']"
                  @click="handleOpenDialog(scope.row.id)"
                >
                  <i-ep-plus /> 新增
                </el-button>

                <el-button
                  type="primary"
                  link
                  size="small"
                  v-hasPerm="['sys:organ:edit']"
                  @click="handleOpenDialog(undefined, scope.row.id)"
                >
                  <i-ep-edit /> 编辑
                </el-button>

                <el-button
                  type="primary"
                  link
                  size="small"
                  v-hasPerm="['sys:organ:delete']"
                  @click="handleDelete(scope.row.id)"
                >
                  <i-ep-delete /> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="dialog.visiable"
      :title="dialog.title"
      :width="dialog.width"
      append-to-body
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
            :data="organTreeOptionData"
            filterable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>

        <el-form-item prop="organName" :label="orgTypeLabel">
          <el-input v-model="formData.organName" placeholder="名称" />
        </el-form-item>

        <!-- <el-form-item label="类型" prop="organType">
          <el-radio-group v-model="formData.organType">
            <el-radio :value="1">机构</el-radio>
            <el-radio :value="2">部门</el-radio>
          </el-radio-group>
        </el-form-item> -->

        <el-form-item label="类型" prop="organType">
          <el-select
            v-model="formData.organType"
            clearable
            placeholder="机构类型"
          >
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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
          <el-button type="primary" @click="handleSubmit()">确定</el-button>
          <el-button type="primary" @click="handleCloseDialog()">
            取消
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
