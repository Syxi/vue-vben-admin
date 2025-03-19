<script setup lang="ts">
import type {
  UploadFile,
  UploadFiles,
  UploadInstance,
  UploadProgressEvent,
  UploadRawFile,
} from 'element-plus';

import type { UserForm, UserPage, UserQuery } from '#/api/system/sys/user';

import { onMounted, reactive, ref, watch } from 'vue';

import { useThrottleFn } from '@vueuse/core';
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
  resetPwdApi,
  selectUserPageApi,
} from '#/api/system/sys/user';
import { Dictionary } from '#/components/dictionary';

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
  limit: 10,
});

const image = ref('/images/85702b3fc4634fdaae2fc2a2f9302388.jpg');
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

// 上传组件
const uploadRef = ref<UploadInstance>();

// 用户导入数据
const importData = reactive({
  file: undefined,
  fileList: [],
});

// 用于存储上传进度的百分比
const uploadProgress = ref(0);

const showProgress = ref(false);

// 弹窗对象
const dialog = reactive({
  visible: false,
  type: 'user-form',
  width: 600,
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
function handleQuery() {
  loading.value = true;
  selectUserPageApi(queryParams)
    .then((data) => {
      userTableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
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
}

// 重置密码
function resetPassword() {
  const ids = userIds.value;
  if (ids.length > 0) {
    resetPwdApi(ids).then((data) => {
      ElMessage.success(`密码重置成功，新密码是：${data}`);
      resetQuery();
    });
  }
}

/**
 * 启用用户
 */
function enableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定启用用户?', '启用用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        enableUserApi(ids).then(() => {
          ElMessage.success('启用用户成功!');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('启用用户失败!');
      });
  }
}

/**
 * 禁用用户
 */
function disableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定禁用用户?', '禁用用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      disableUserApi(ids)
        .then(() => {
          ElMessage.success('禁用用户成功!');
          resetQuery();
        })
        .catch(() => {
          ElMessage.error('禁用用户失败');
        });
    });
  }
}

// 新增或编辑用户弹出窗口事件
async function openDialog(type: string, userId?: string) {
  dialog.type = type;
  dialog.visible = true;
  if (dialog.type === 'user-form') {
    // 用户表单弹窗
    await getOrganTreeptions();
    if (userId) {
      dialog.title = '修改用户';
      const data = await getUserDetailApi(userId);
      Object.assign(formData, data);
    } else {
      dialog.title = '新增用户';
    }
  } else if (dialog.type === 'user-import') {
    // 用户导入弹出
    dialog.title = '导入用户';
    dialog.width = 600;
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
async function getOrganTreeptions() {
  const data = await orgOptionTreeApi();
  organTreeOptionData.value = data;
  organTreeOptionData.value = [
    { value: '0', label: 'cpu集团', children: data },
  ];
}

// 删除用户事件
function handleDelete(userId?: string) {
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
  }).then(() => {
    deleteUserApi(ids).then(() => {
      ElMessage.success('删除成功!');
      resetQuery();
    });
  });
}

// 关闭弹窗
function closeDialog() {
  dialog.visible = false;
  if (dialog.type === 'user-form') {
    resetForm();
  } else if (dialog.type === 'user-import') {
    importData.file = undefined;
    importData.fileList = [];
  }
}

// 提交表单
const handleSubmit = useThrottleFn(async () => {
  if (dialog.type === 'user-form') {
    userFormRef.value.validate((valid: any) => {
      if (valid) {
        const userId = formData.userId;
        loading.value = true;
        if (userId) {
          editUserApi(formData)
            .then(() => {
              ElMessage.success('修改用户成功!');
              closeDialog();
              resetQuery();
            })
            .finally(() => (loading.value = false));
        } else {
          addUserApi(formData)
            .then(() => {
              ElMessage.success('新增用户成功！');
              closeDialog();
              resetQuery();
            })
            .finally(() => (loading.value = false));
        }
      }
    });
  } else if (dialog.type === 'user-import') {
    // if (!importData?.file) {
    //   ElMessage.warning("上传Excel文件不能为空");
    //   return false;
    // }

    // Excel 导入用户
    uploadRef.value?.submit();
  }
}, 3000);

/**
 * 下载用户导入模板
 */
function downloadTemplate() {
  downloadTemplateApi().then((response: any) => {
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
  });
}

/**
 * 导出用户
 */
function handleExport() {
  const ids = userIds.value;
  if (ids.length === 0) {
    ElMessage.error('请选择导出的用户');
    return;
  }
  exportUserApi(ids).then((response: any) => {
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
  });
}

/**
 * 上传请求的 url
 */
const uploadUrl = `${import.meta.env.VITE_GLOB_API_URL}/user/import`;

/**
 * 请求头设置 token
 */
const headers = {
  // Authorization: getToken(),
};

const progressTime = ref();

/**
 * 文件上传前
 */
function handleBeforeUpload(rawFile: UploadRawFile) {
  if (!rawFile) {
    ElMessage.warning('上传Excel文件不能为空');
    return false;
  }
}

/**
 * 文件上传成功后
 */
function handleUploadSuccess(response: any) {
  ElMessage.success({
    message: response.data,
    duration: 4000, // 4000
  });
  uploadProgress.value = 0;
  showProgress.value = false;
  closeDialog();
  resetQuery();
}

/**
 * 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
 */
function handleFileChange(file: any) {
  importData.file = file.raw;
}

/**
 * 当超出限制时，执行的钩子函数
 */
function handleFileExceed(files: any) {
  uploadRef.value!.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  uploadRef.value!.handleStart(file);
  importData.file = file;
}

/**
 * 上传文件进度条
 * @param evt
 */
function handleUploadProgress(
  evt: UploadProgressEvent,
  uploadFile: UploadFile,
  uploadFiles: UploadFiles,
) {
  showProgress.value = true;

  // uploadProgress.value = evt.percent;
  progressTime.value = setInterval(() => {
    uploadProgress.value++;
    if (uploadProgress.value == 99) {
      clearInterval(progressTime.value);
      progressTime.value = null;
    }
  });
}

function handleUploadError() {
  uploadProgress.value = 0;
}

// uploadProgress.value = evt.loaded / evt.total * 100;
// uploadProgress.value = Number(((evt.loaded * 100) / evt.total).toFixed(0));

onMounted(() => {
  // 初始化用户列表数据
  handleQuery();
  getOrganTreeptions();
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
            @node-click="handleNodeClick"
          />
        </el-card>
      </el-col>

      <el-col :lg="20" :xs="24">
        <div class="search-container">
          <ElForm :model="queryParams" ref="queryFormRef" :inline="true">
            <el-form-item prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="用户名"
                @keyup.enter="handleQuery()"
                clearable
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
                @click="openDialog('user-form')"
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

              <el-dropdown split-button class="ml-3" type="primary">
                导入用户
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="downloadTemplate">
                      <el-icon><Download /></el-icon>下载模板
                    </el-dropdown-item>
                    <el-dropdown-item
                      @click="openDialog('user-import')"
                      v-access:code="['sys:user:import']"
                    >
                      <el-icon><Upload /></el-icon>导入数据
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <el-button
                type="primary"
                class="ml-3"
                @click="handleExport"
                v-access:code="['sys:user:export']"
              >
                <template #icon>
                  <el-icon><Top /></el-icon>
                </template>
                导出用户
              </el-button>
            </el-form-item>
          </ElForm>
        </div>

        <el-card shadow="never" class="table-container">
          <el-table
            v-loading="loading"
            border
            :data="userTableData"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />

            <el-table-column
              type="index"
              label="序号"
              width="80"
              align="center"
            />

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

            <el-table-column prop="organName" label="部门" align="center" />

            <el-table-column prop="mobile" label="手机号码" align="center" />

            <!-- <el-table-column prop="email" label="邮箱" align="center" /> -->

            <el-table-column
              label="状态"
              prop="status"
              align="center"
              width="100"
            >
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="创建时间"
              prop="createTime"
              align="center"
            />

            <el-table-column
              fixed="right"
              label="操作"
              width="150"
              align="center"
            >
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="openDialog('user-form', scope.row.userId)"
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
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.limit"
            :total="total"
            :page-sizes="[10, 20, 30, 40, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleQuery"
            @current-change="handleQuery"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      :width="dialog.width"
      draggable
      center
      @close="closeDialog()"
    >
      <ElForm
        v-if="dialog.type === 'user-form'"
        :model="formData"
        :rules="rules"
        ref="userFormRef"
        label-width="100px"
        style="max-width: 500px"
      >
        <el-form-item label="头像：" prop="avatar">
          <div class="el-form-item__content">
            <!-- <SigleUpload v-model:model-value="formData.avatar" /> -->
            <ImageUpload v-model:model-value="formData.avatar" />
          </div>
        </el-form-item>

        <el-form-item label="登录账号：" prop="username">
          <el-input v-model="formData.username" placeholder="请输入登录账号" />
        </el-form-item>

        <el-form-item label="真实姓名：" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入用户姓名" />
        </el-form-item>

        <el-form-item label="性别：" prop="gender">
          <Dictionary v-model="formData.gender" type-code="gender" />
          <!-- <el-select v-model="formData.gender">
            <el-option
              v-for="option in genderOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
            </el-option>
          </el-select> -->
        </el-form-item>

        <!-- <el-form-item label="角色" prop="roleIds">
          <el-select v-model="formData.roleIds" multiple placeholder="请选择">
            <el-option
              v-for="item in roleList"
              :value="item.value"
              :label="item.label"
              :key="item.value"
            />
          </el-select>
        </el-form-item> -->

        <el-form-item label="机构：" prop="organId">
          <el-tree-select
            v-model="formData.organId"
            :data="organTreeOptionData"
            :render-after-expand="false"
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
      </ElForm>

      <!-- 用户导入Excel -->
      <ElForm v-else-if="dialog.type === 'user-import'" :model="importData">
        <el-form-item label="Excel文件">
          <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="headers"
            :on-success="handleUploadSuccess"
            :before-upload="handleBeforeUpload"
            drag
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            :limit="1"
            :auto-upload="false"
            :file-list="importData.fileList"
            :on-change="handleFileChange"
            :on-exceed="handleFileExceed"
            :on-progress="handleUploadProgress"
            :on-error="handleUploadError"
          >
            <el-icon class="el-icon--upload">
              <i-ep-upload-filled />
            </el-icon>
            <div class="el-upload__text">
              将文件拖到此处, 或
              <em>点击上传</em>
            </div>
            <template #tip>
              <div>xls / xlsx 文件</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-progress
          v-if="showProgress"
          :percentage="uploadProgress"
          :stroke-width="24"
          striped
          striped-flow
        />
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit()">确定</el-button>
          <el-button @click="closeDialog()">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.el-tooltip__popper {
  max-width: 20%;
}

.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.upload-tip {
  margin-top: 10px;
  color: #606266;
}

.el-form-item__content {
  position: relative;
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  min-width: 0;
  font-size: var(--font-size);
  line-height: 32px;
}
</style>
