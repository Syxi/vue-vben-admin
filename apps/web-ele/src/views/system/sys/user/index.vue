<script setup lang="ts">
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';

import type { UserForm, UserPage, UserQuery } from '#/api/system/sys/user';

import { onMounted, reactive, ref, watch } from 'vue';

import {
  ElForm,
  ElMessage,
  ElMessageBox,
  ElTree,
  genFileId,
} from 'element-plus';

import { orgOptionTreeApi } from '#/api/system/sys/organiation';
import {
  addUserApi,
  deleteUserApi,
  disableUserApi,
  downloadTemplateApi,
  editUserApi,
  enableUserApi,
  exportUserApi,
  getUserDetailApi,
  importUserApi,
  resetPwdApi,
  selectUserPageApi,
} from '#/api/system/sys/user';
import { Dictionary } from '#/components/dictionary';
import { ImageUpload } from '#/components/image-upload';

defineOptions({
  name: 'User',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 用户ids
const userIds = ref<string[]>([]);

// 查询参数
const queryParams = reactive<UserQuery>({
  page: 1,
  limit: 20,
});

const dateTimeRange = ref('');

watch(dateTimeRange, (newVal) => {
  if (newVal) {
    queryParams.startTime = newVal[0];
    queryParams.endTime = newVal[1];
  } else {
    queryParams.startTime = undefined;
    queryParams.endTime = undefined;
  }
});

// 分页总记录数
const total = ref(0);

// 分页列表数据
const userTableData = ref<UserPage[]>();

// 组织下拉选项树数据
const organTreeOptionData = ref<OptionType[]>([]);

// 组织树
const organTreeRef = ref(ElTree);

// 组织名称
const organName = ref('');

watch(organName, (val) => {
  organTreeRef.value!.filter(val);
});

// 搜索树节点
const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.label.includes(value);
};

// 查询表单
const queryFormRef = ref(ElForm);

// 用户表单
const userFormRef = ref(ElForm);

// 用户表单数据
const formData = reactive<UserForm>({
  status: 1,
  avatar: '',
});

// 弹窗对象
const dialog = reactive({
  visible: false,
  width: 800,
  title: '',
});

// 校验规则
const rules = reactive({
  username: [{ required: true, message: '登录账号不能为空', trigger: 'blur' }],
  realName: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  organId: [{ required: true, message: '所属部门不能为空', trigger: 'blur' }],
  // password: [{ required: true, message: "密码不能为空", trigger: 'blur'}],
  // roleIds: [{ required: true, message: "用户角色不能为空", trigger: "blur" }],
  email: [
    {
      pattern: /\w[-\w.+]*@([A-Z0-9][-A-Z0-9]+\.)+[A-Z]{2,14}/i,
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
    },
  ],
  mobile: [
    {
      pattern: /^1[3-9|]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ],
});

// 查询用户事件
async function handleQuery() {
  loading.value = true;
  try {
    const data = await selectUserPageApi(queryParams);
    userTableData.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

// 重置查询事件
function resetQuery() {
  queryFormRef.value.resetFields();
  dateTimeRange.value = '';
  queryParams.page = 1;
  queryParams.organId = '';
  handleQuery();
}

// 行checkbox 单选或多选事件
function handleSelectionChange(selection: any) {
  userIds.value = selection.map((item: any) => item.userId);
}

function resetForm() {
  userFormRef.value.resetFields();
  userFormRef.value.clearValidate();
  formData.userId = undefined;
  formData.status = 1;
  formData.avatar = '';
}

// 重置密码
async function resetPassword() {
  const ids = userIds.value;
  if (ids.length > 0) {
    const data = await resetPwdApi(ids);
    ElMessage.success(`密码重置成功，新密码是：${data}`);
    resetQuery();
  }
}

/**
 * 启用用户
 */
async function enableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定启用用户?', '启用用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        await enableUserApi(ids);
        ElMessage.success('启用用户成功!');
        resetQuery();
      })
      .catch(() => {
        ElMessage.error('启用用户失败!');
      });
  }
}

/**
 * 禁用用户
 */
async function disableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定禁用用户?', '禁用用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        await disableUserApi(ids);
        ElMessage.success('禁用用户成功!');
        resetQuery();
      })
      .catch(() => {
        ElMessage.error('禁用用户失败');
      });
  }
}

// 新增或编辑用户弹出窗口事件
async function openDialog(userId?: string) {
  dialog.visible = true;
  // 用户表单弹窗
  await getOrganTreeOptions();
  if (userId) {
    dialog.title = '修改用户';
    const data = await getUserDetailApi(userId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增用户';
  }
}

/**
 * 点击树节点，查询部门用户
 * @param node
 */
function handleNodeClick(node: any) {
  queryParams.organId = node.value;
  handleQuery();
}

// 获取部门下拉选项
async function getOrganTreeOptions() {
  organTreeOptionData.value = await orgOptionTreeApi();
}

// 删除用户事件
async function handleDelete(userId?: string) {
  let ids: string[];
  if (userId) {
    ids = [String(userId)]; // 删除单条记录
  } else if (userIds.value.length > 0) {
    ids = userIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除用户?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteUserApi(ids);
    ElMessage.success('删除成功!');
    resetQuery();
  });
}

// 关闭弹窗
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

// 提交表单
const handleSubmit = async () => {
  // 验证表单字段
  const valid = userFormRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const userId = formData.userId;
    await (userId ? editUserApi(formData) : addUserApi(formData));
    ElMessage.success(userId ? '修改用户成功!' : '新增用户成功！');
    closeDialog();
    resetQuery();
    // }
  } finally {
    loading.value = false;
  }
};

/**
 * 下载用户导入模板
 */
async function downloadTemplate() {
  const response = await downloadTemplateApi();
  const fileData = response.data;
  const fileName = decodeURI(
    response.headers['content-disposition'].split(';')[1].split('=')[1],
  );
  const fileType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';

  const blob = new Blob([fileData], { type: fileType });
  const downloadUrl = window.URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;

  document.body.append(downloadLink);
  downloadLink.click();

  downloadLink.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * 导出用户
 */
async function handleExport() {
  const ids = userIds.value;
  if (ids.length === 0) {
    ElMessage.error('请选择导出的用户');
    return;
  }

  const response = await exportUserApi(ids);
  const fileData = response.data;
  const fileName = decodeURI(
    response.headers['content-disposition'].split(';')[1].split('=')[1],
  );
  const fileType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';

  const blob = new Blob([fileData], { type: fileType });
  const downloadUrl = window.URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;

  document.body.append(downloadLink);
  downloadLink.click();

  downloadLink.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

const uploadDialog = reactive({
  visible: false,
  title: '导入用户',
});

function handleCloseUploadDialog() {
  uploadRef.value!.clearFiles();
  uploadDialog.visible = false;
}

function handleOpenUploadDialog() {
  uploadDialog.visible = true;
}

// 上传组件
const uploadRef = ref<UploadInstance>();

const uploadFile = ref<UploadRawFile>();

/**
 * 当文件选择发生变化时，执行的钩子函数
 */
const handleChange: UploadProps['onChange'] = (file) => {
  uploadFile.value = file.raw; // 将文件赋值给 uploadFile.value
};

/**
 * 当超出限制时，执行的钩子函数
 */
const handleFileExceed: UploadProps['onExceed'] = (files) => {
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadFile.value = file;
};

const handleRemoveFile = () => {
  uploadFile.value = null;
  uploadRef.value!.clearFiles();
};

const handleUploadError = () => {};

const importResult = ref<ImportResult>();

// 提交上传文件
const submitUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.error('请先选择文件');
    return false;
  }

  try {
    importResult.value = await importUserApi(uploadFile.value);
    ElMessage({
      message: `导入成功：成功 ${importResult.value.validCount}条， 失败 ${importResult.value.invalidCount} 条`,
      duration: 6000,
      type: 'success',
    });
    handleCloseUploadDialog();
    uploadRef.value!.clearFiles();
    resetQuery();
  } catch {
    ElMessage.error('导入失败，请联系管理员');
  } finally {
    importResult.value.validCount = 0;
    importResult.value.invalidCount = 0;
  }
};

// 定义表格高度
const tableHeight = ref(window.innerHeight - 300); // 初始高度

// 监听窗口大小变化，动态调整表格高度
watch(
  () => window.innerHeight,
  () => {
    tableHeight.value = window.innerHeight - 300; // 动态计算表格高度
  },
);


onMounted(() => {
  // 初始化表格高度
  tableHeight.value = window.innerHeight - 300;

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    tableHeight.value = window.innerHeight - 300;
  });

  // 初始化用户列表数据
  handleQuery();
  getOrganTreeOptions();
});
</script>

<template>
  <div class="flex h-full bg-white">
    <!--部门树-->
    <div class="w-1/5 h-full border-r border-b p-4 overflow-auto">
      <el-input v-model="organName" placeholder="机构名称">
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
        @node-click="handleNodeClick"
      />
    </div>

    <div class="table-container">
      <ElForm
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        class="mb-2 p-4"
      >
        <el-form-item prop="username">
          <el-input
            v-model="queryParams.username"
            placeholder="用户名"
            @keyup.enter="handleQuery()"
            clearable
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item prop="realName">
          <el-input
            v-model="queryParams.realName"
            placeholder="真实姓名"
            @keyup.enter="handleQuery()"
            clearable
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="用户状态"
            clearable
            class="!w-[110px]"
            @change="handleQuery()"
          >
            <el-option label="正常" value="1" />
            <el-option label="禁用" value="-1" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-date-picker
            v-model="dateTimeRange"
            type="daterange"
            start-placeholder="开始时间"
            end-placeholder="截止时间"
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
            v-access:code="['sys:user:add']"
            type="primary"
            @click="openDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            v-access:code="['sys:user:enable']"
            type="primary"
            @click="enableUser()"
          >
            <template #icon>
              <el-icon><SwitchButton /></el-icon>
            </template>
            启用
          </el-button>

          <el-button
            :disabled="userIds.length === 0"
            v-access:code="['sys:user:disable']"
            type="danger"
            @click="disableUser()"
          >
            <template #icon>
              <el-icon><SwitchButton /></el-icon>
            </template>
            禁用
          </el-button>

          <el-button
            type="danger"
            v-access:code="['sys:user:delete']"
            :disabled="userIds.length === 0"
            @click="handleDelete()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>

          <el-button
            type="primary"
            @click="resetPassword()"
            v-access:code="['sys:user:password']"
          >
            <template #icon>
              <el-icon><RefreshRight /></el-icon>
            </template>
            重置密码
          </el-button>

          <el-button
            type="primary"
            @click="handleOpenUploadDialog()"
            v-access:code="['sys:user:import']"
          >
            <template #icon>
              <el-icon><Upload /></el-icon>
            </template>
            导入用户
          </el-button>

          <el-button
            type="primary"
            class="ml-3"
            @click="handleExport"
            v-access:code="['sys:user:export']"
          >
            <template #icon>
              <el-icon><Download /></el-icon>
            </template>
            导出用户
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        border
        :data="userTableData"
        @selection-change="handleSelectionChange"
        :max-height="tableHeight"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column
          v-if="false"
          key="userId"
          label="编号"
          prop="userId"
          width="100"
        />

        <el-table-column
          key="username"
          label="用户名"
          prop="username"
          align="center"
          width="150"
        />

        <el-table-column label="真实姓名" prop="realName" align="center" />

        <el-table-column
          label="性别"
          prop="genderLabel"
          align="center"
          width="80"
        />

        <el-table-column
          label="角色名称"
          prop="roleNames"
          align="center"
          :show-overflow-tooltip="true"
        />

        <el-table-column prop="organName" label="部门名称" align="center" />

        <el-table-column prop="mobile" label="手机号码" align="center" />

        <!-- <el-table-column prop="email" label="邮箱" align="center" /> -->

        <el-table-column label="状态" prop="status" align="center" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createTime" align="center" />

        <el-table-column fixed="right" label="操作" width="150" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              @click="openDialog(scope.row.userId)"
              v-access:code="['sys:user:edit']"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              @click="handleDelete(scope.row.userId)"
              v-access:code="['sys:user:delete']"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="mt-2"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
    </div>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      :width="dialog.width"
      :close-on-click-modal="false"
      :open-delay="60"
      draggable
      center
      @close="closeDialog()"
    >
      <ElForm
        :model="formData"
        :rules="rules"
        ref="userFormRef"
        label-width="100px"
      >
        <el-row>
          <el-col :span="7">
            <div class="flex justify-center">
              <ImageUpload v-model:model-value="formData.avatar" />
            </div>
          </el-col>

          <el-col :span="16">
            <el-form-item label="登录账号：" prop="username">
              <el-input
                v-model="formData.username"
                placeholder="请输入登录账号"
              />
            </el-form-item>

            <el-form-item label="真实姓名：" prop="realName">
              <el-input
                v-model="formData.realName"
                placeholder="请输入用户姓名"
              />
            </el-form-item>

            <el-form-item label="性别：" prop="gender">
              <Dictionary v-model="formData.gender" type-code="gender" />
            </el-form-item>

            <el-form-item label="机构：" prop="organId">
              <el-tree-select
                v-model="formData.organId"
                :data="organTreeOptionData"
                :default-expand-all="true"
                check-strictly
                filterable
              />
            </el-form-item>

            <el-form-item label="手机号码：" prop="mobile">
              <el-input
                v-model="formData.mobile"
                placeholder="请输入手机号码"
                maxlength="11"
              />
            </el-form-item>

            <el-form-item label="邮箱：" prop="email">
              <el-input
                v-model="formData.email"
                placeholder="请输入邮箱"
                maxlength="50"
              />
            </el-form-item>

            <el-form-item label="状态：">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="-1">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit()">确定</el-button>
          <el-button @click="closeDialog()">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传excel弹窗 -->
    <el-dialog
      v-model="uploadDialog.visible"
      :title="uploadDialog.title"
      :width="600"
      :close-on-click-modal="false"
      @close="handleCloseUploadDialog"
    >
      <el-row>
        <el-col :span="20">
          <el-upload
            ref="uploadRef"
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            :limit="1"
            :auto-upload="false"
            :on-change="handleChange"
            :on-exceed="handleFileExceed"
            :on-remove="handleRemoveFile"
            :on-error="handleUploadError"
          >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
        </el-col>

        <el-col :span="4">
          <el-button type="primary" @click="downloadTemplate">
            下载模版
          </el-button>
        </el-col>
      </el-row>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitUpload">导入</el-button>
          <el-button @click="handleCloseUploadDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
//.app-container {
//  display: flex;
//  flex-direction: row;
//  height: 100%;
//  background-color: #fff;
//}


//.tree-container {
//  width: 300px; // 设置 el-tree 容器的宽度
//  margin-right: 20px; // 添加右边距以分离树和表格
//}
//
//.table-container {
//
//}


</style>

