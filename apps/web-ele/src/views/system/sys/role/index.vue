<script setup lang="ts">
import type { TransferKey } from 'element-plus';

import type { RoleForm, RolePage, RoleQuery } from '#/api/system/sys/role';

import { onMounted, reactive, ref, watch } from 'vue';

import { ElForm, ElMessage, ElMessageBox, ElTree } from 'element-plus';

import { menuOptionApi, updateRoleMenusApi } from '#/api/system/sys/menu';
import {
  addRoleApi,
  deleteRoleApi,
  disableRoleApi,
  editRoleApi,
  enableRoleApi,
  getRoleMenuIdsApi,
  roleDetailApi,
  selectRolePageApi,
  updateRoleUserApi,
} from '#/api/system/sys/role';
import { UserInRoleApi, userNotInRoleApi } from '#/api/system/sys/user';

defineOptions({
  name: 'Role',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const roleFormRef = ref(ElForm);

const menuTreeRef = ref(ElTree);

const loading = ref(false);

const roleIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<RoleQuery>({
  page: 1,
  limit: 10,
});

const roleTableData = ref<RolePage[]>();

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<RoleForm>({
  sort: 1,
  status: 1,
  roleCode: '',
  roleName: '',
  dataScope: 0,
});

const rules = reactive({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'blur' }],
});

const menuDialogVisiable = ref(false);

const menuOptionData = ref<OptionType[]>([]);

// 树展开默认选中的值
const checkedMenuIds = ref<string[]>([]);

interface CheckedRole {
  roleId?: string;
  roleName?: string;
}

let checkedRole: CheckedRole = reactive({});

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选的roleIds
  roleIds.value = selection.map((item: any) => item.roleId);
}

const permMenuName = ref('');

const isExpanded = ref(true);

const parentChildrenLink = ref(true);

const dataScopeOption = [
  { value: 0, label: '全部数据权限' },
  { value: 1, label: '组织及子部门数据' },
  { value: 2, label: '本部门数据权限' },
  { value: 3, label: '本人数据' },
];

/**
 * 查询角色
 */
function handleQuery() {
  loading.value = true;
  selectRolePageApi(queryParams)
    .then((data) => {
      roleTableData.value = data.list;
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
 * 打开角色表单弹窗
 * @param roleId
 */
async function openDialog(roleId?: string) {
  dialog.visible = true;
  if (roleId) {
    dialog.title = '修改角色';
    const data = await roleDetailApi(roleId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增角色';
  }
}

/**
 * 角色保存提交
 */
function handleSubmit() {
  roleFormRef.value.validate((valid: any) => {
    if (valid) {
      loading.value = true;
      const roleId = formData.roleId;
      if (roleId) {
        editRoleApi(formData)
          .then(() => {
            ElMessage.success('修改角色成功');
            closeDialog();
            resetQuery();
          })
          .catch(() => {
            ElMessage.error('角色名称或角色编码已存在，请检查');
            closeDialog();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        addRoleApi(formData)
          .then(() => {
            ElMessage.success('新增角色成功');
            closeDialog();
            resetQuery();
          })
          .catch(() => {
            ElMessage.error('角色名称或角色编码已存在，请检查');
            closeDialog();
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
  roleFormRef.value.resetFields();
  roleFormRef.value.clearValidate();

  formData.roleId = undefined;
  formData.sort = 1;
  formData.status = 1;
}

/**
 * 删除角色
 * @param roleId
 */
function handleDelete(roleId?: string) {
  let ids: string[];
  if (roleId) {
    ids = [String(roleId)]; // 删除单条记录
  } else if (roleIds.value.length > 0) {
    ids = roleIds.value; // 删除多条记录
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
    deleteRoleApi(ids)
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
 * 启动角色
 */
function enableRole() {
  const ids = roleIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定启动角色?', '启动角色', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
      .then(() => {
        enableRoleApi(ids).then(() => {
          ElMessage.success('启动角色成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('启动角色失败');
        resetQuery();
      });
  }
}

/**
 * 禁用角色
 */
function disableRole() {
  const ids = roleIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定禁用角色?', '禁用角色', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        disableRoleApi(ids).then(() => {
          ElMessage.success('禁用角色成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('禁用角色失败');
        resetQuery();
      });
  }
}

// 初始化菜单下拉树
async function menuOption() {
  const data = await menuOptionApi();
  menuOptionData.value = data;
}

// 展开和收缩菜单权限
function toggleMenuTree() {
  isExpanded.value = !isExpanded.value;
  if (menuTreeRef.value) {
    Object.values(menuTreeRef.value.store.nodesMap).forEach((node: any) => {
      if (isExpanded.value) {
        node.expand();
      } else {
        node.collapse();
      }
    });
  }
}

watch(permMenuName, (val) => {
  menuTreeRef.value!.filter(val);
});

function handlePermFilter(
  value: string,
  data: {
    [key: string]: any;
  },
) {
  if (!value) return true;
  return data.label.includes(value);
}

// 父子节点是否自动关联
function handleParentChildrenChange(val: any) {
  parentChildrenLink.value = val;
}

/**
 * 打开角色分配菜单弹窗
 * @param row
 */
async function openMenuDialog(row: RolePage) {
  menuDialogVisiable.value = true;
  const roleId = row.roleId;
  const roleName = row.roleName;
  if (roleId) {
    checkedRole = {
      roleId,
      roleName,
    };

    // 获取菜单下拉树选项
    await menuOption();

    getRoleMenuIdsApi(roleId).then((data) => {
      checkedMenuIds.value = data;
      checkedMenuIds.value.forEach((menuId) =>
        menuTreeRef.value.setChecked(menuId, true, false),
      );
    });
  }
}

/**
 * 角色分配菜单保存提交
 */
function handleRoleMenuSubmit() {
  const roleId = checkedRole.roleId;
  if (roleId) {
    const checkedMenuIds: string[] = menuTreeRef.value
      .getCheckedNodes(false, true)
      .map((node: any) => node.value);

    loading.value = true;
    updateRoleMenusApi(roleId, checkedMenuIds)
      .then(() => {
        ElMessage.success('分配权限成功');
        menuDialogVisiable.value = false;
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  }
}

// 角色分配用户弹出窗
const roleDialogVisible = ref(false);

// 角色分配用户弹出窗, 左侧数据
const usersNotInRole = ref<TransferVO[]>([]);

// 角色分配用户弹出窗, 右侧数据
const usersInRole = ref<TransferKey[]>([]);

/**
 * 打开分配用户弹窗
 */
async function openUserDialog(row: RolePage) {
  roleDialogVisible.value = true;
  const roleName = row.roleName;
  const roleId = row.roleId;
  if (roleId && roleName) {
    checkedRole = {
      roleId,
      roleName,
    };

    // 穿梭框左侧数据，获取不属于角色的用户列表
    await getUserListNotInRole(roleId);
    // 穿梭框右侧数据，获取属于角色的用户列表
    await getUserListInRole(roleId);
  }
}

/**
 * 穿梭框左侧数据，获取不属于角色的用户列表
 */
async function getUserListNotInRole(roleId: string) {
  const data = await userNotInRoleApi(roleId);
  usersNotInRole.value = data;
}

/**
 * 穿梭框右侧数据，获取属于角色的用户列表
 * @param roleId
 */
async function getUserListInRole(roleId: string) {
  const data = await UserInRoleApi(roleId);
  // 获取到的key，转换为数组
  usersInRole.value = data.map((item) => item.key as TransferKey);
}

/**
 * 穿梭框右侧列表元素变化时触发，获取右侧列表的key
 */
function handleTransferChange(rightKey: TransferKey[]) {
  const userIds = rightKey.map(String);
  return userIds;
}

/**
 * 角色分配用用户， 更新角色用户关系
 */
function handleRoleUserSubmit() {
  const roleId = checkedRole.roleId;
  const userIds = handleTransferChange(usersInRole.value);
  if (roleId) {
    updateRoleUserApi(roleId, userIds).then(() => {
      ElMessage.success('分配用户成功!');
      roleDialogVisible.value = false;
    });
  }
}

onMounted(() => {
  handleQuery();
  menuOption();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="roleName">
          <el-input
            v-model="queryParams.roleName"
            placeholder="角色名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <i-ep-search />搜索
          </el-button>

          <el-button type="primary" @click="resetQuery">
            <i-ep-refresh />重置
          </el-button>

          <el-button
            type="primary"
            v-hasPerm="['sys:role:add']"
            @click="openDialog()"
          >
            <i-ep-plus />新增
          </el-button>

          <el-button
            type="primary"
            v-hasPerm="['sys:role:enable']"
            @click="enableRole()"
          >
            启用
          </el-button>

          <el-button
            type="danger"
            :disabled="roleIds.length === 0"
            v-hasPerm="['sys:role:disable']"
            @click="disableRole()"
          >
            禁用
          </el-button>

          <el-button
            type="danger"
            :disabled="roleIds.length === 0"
            v-hasPerm="['sys:role:delete']"
            @click="handleDelete()"
          >
            <i-ep-delete />删除
          </el-button>
        </el-form-item>
      </ElForm>
    </div>

    <el-card class="table-container">
      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="roleTableData"
        highlight-current-row
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column
          label="角色名称"
          prop="roleName"
          width="200"
          align="center"
        />

        <el-table-column
          label="角色编码"
          prop="roleCode"
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
              @click="openMenuDialog(scope.row)"
              v-hasPerm="['sys:role:menu']"
            >
              <i-ep-position />菜单授权
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              @click="openUserDialog(scope.row)"
              v-hasPerm="['sys:role:user']"
            >
              <el-icon><User /></el-icon>分配用户
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-hasPerm="['sys:role:edit']"
              @click="openDialog(scope.row.roleId)"
            >
              <i-ep-edit />编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-hasPerm="['sys:role:delete']"
              @click="handleDelete(scope.row.roleId)"
            >
              <i-ep-delete />删除
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

    <!-- 角色表单弹窗 -->
    <el-dialog
      center
      draggable
      v-model="dialog.visible"
      :title="dialog.title"
      width="500px"
      @close="closeDialog"
    >
      <ElForm
        ref="roleFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        style="max-width: 400px"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="formData.roleCode" placeholder="请输入角色编码" />
        </el-form-item>

        <!-- <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="-1">禁用</el-radio>
          </el-radio-group>
        </el-form-item> -->

        <el-form-item label="数据权限" prop="dataScope">
          <el-select v-model="formData.dataScope">
            <el-option
              v-for="item in dataScopeOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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

    <!-- 分配菜单弹窗 -->
    <el-dialog
      draggable
      center
      v-model="menuDialogVisiable"
      :title="`【${checkedRole.roleName}】权限分配`"
      width="800px"
    >
      <div class="flex-x-between">
        <el-input
          v-model="permMenuName"
          clearable
          class="w-[150px]"
          placeholder="菜单权限名称"
        >
          <template #prefix>
            <Search />
          </template>
        </el-input>
        <div class="flex-center ml-5">
          <el-button type="primary" size="small" plain @click="toggleMenuTree">
            <template #icon><Switch /></template>
            {{ isExpanded ? '收缩' : '展开' }}
          </el-button>

          <el-checkbox
            v-model="parentChildrenLink"
            class="ml-5"
            @change="handleParentChildrenChange"
          >
            父子联动
          </el-checkbox>
          <el-tooltip placement="bottom">
            <template #content>
              如果只需勾选菜单权限，不需要勾选子菜单或者按钮权限，请关闭父子联动
            </template>
            <el-icon
              class="color-[--el-color-primary] ml-1 inline-block cursor-pointer"
            >
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </div>
      </div>
      <el-scrollbar v-loading="loading" max-height="600px">
        <ElTree
          ref="menuTreeRef"
          node-key="value"
          show-checkbox
          default-expand-all
          :data="menuOptionData"
          :filter-node-method="handlePermFilter"
          :check-strictly="!parentChildrenLink"
          class="mt-5"
        >
          <template #default="{ data }">{{ data.label }}</template>
        </ElTree>
      </el-scrollbar>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleRoleMenuSubmit">
            确定
          </el-button>
          <el-button @click="menuDialogVisiable = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 角色分配用户 -->
    <el-dialog
      draggable
      center
      v-model="roleDialogVisible"
      :title="`【${checkedRole.roleName}】分配用户`"
    >
      <div style="height: 600px; text-align: center">
        <el-transfer
          filterable
          :titles="['未分配用户列表', '已分配用户列表']"
          :button-texts="['移除', '添加']"
          :data="usersNotInRole"
          v-model="usersInRole"
          @change="handleTransferChange"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleRoleUserSubmit">
            确定
          </el-button>
          <el-button @click="roleDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 穿梭框宽度和高度调整 */
.el-transfer {
  --el-transfer-panel-width: 300px;
  --el-transfer-border-color: var(--el-border-color-lighter);
  --el-transfer-border-radius: var(--el-border-radius-base);
  /* stylelint-disable-next-line declaration-block-no-duplicate-custom-properties */
  --el-transfer-panel-width: 300px;
  --el-transfer-panel-header-height: 40px;
  --el-transfer-panel-header-bg-color: var(--el-fill-color-light);
  --el-transfer-panel-footer-height: 60px;
  --el-transfer-panel-body-height: 500px;
  --el-transfer-item-height: 30px;
  --el-transfer-filter-height: 32px;
}
</style>
