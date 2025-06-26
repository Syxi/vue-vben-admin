<script setup lang="ts">
import type { UserForm } from '#/api/system/sys/user';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  addUserApi,
  editUserApi,
  getUserDetailApi,
} from '#/api/system/sys/user';
import { Dictionary } from '#/components/dictionary';
import { ImageUpload } from '#/components/image-upload';

const emit = defineEmits<{ (e: 'success'): void }>();

// 用户表单
const userFormRef = ref(ElForm);

// 加载状态
const loading = ref(false);

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
  deptId: [{ required: true, message: '所属部门不能为空', trigger: 'blur' }],
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

function resetForm() {
  userFormRef.value.resetFields();
  userFormRef.value.clearValidate();
  formData.userId = undefined;
  formData.status = 1;
  formData.avatar = '';
}

// 组织下拉选项树数据
const deptTreeOptionData = ref<OptionType[]>([]);

// 新增或编辑用户弹出窗口事件
async function openDialog(userId?: string, treeData?: OptionType[]) {
  deptTreeOptionData.value = treeData || [];
  dialog.visible = true;
  if (userId) {
    dialog.title = '修改用户';
    const data = await getUserDetailApi(userId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增用户';
  }
}

// 关闭弹窗
function closeDialog() {
  dialog.visible = false;
  resetForm();
  deptTreeOptionData.value = [];
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
    emit('success');
    closeDialog();
  } finally {
    loading.value = false;
  }
};

defineExpose({ openDialog });
</script>
<template>
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

          <el-form-item label="机构：" prop="deptId">
            <el-tree-select
              v-model="formData.deptId"
              :data="deptTreeOptionData"
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
        <el-button @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="handleSubmit()">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
