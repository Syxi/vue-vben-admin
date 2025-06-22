<script setup lang="ts">
import { ElForm, ElMessage } from 'element-plus';
import { defineProps, defineEmits, ref, watch } from 'vue';

import { addRoleApi, editRoleApi, roleDetailApi, type RoleForm } from '#/api/system/sys/role';

const props = defineProps<{
  modelValue: boolean;
  roleId?: string;
  title: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

// 本地可写的 visible 状态
const localVisible = ref(false);

// 全屏控制
const fullScreen = ref(false);
function toggleFullScreen() {
  fullScreen.value = !fullScreen.value;
}

// 表单引用和状态
const roleFormRef = ref();
const loading = ref(false);

// 表单数据
const formData = ref<RoleForm>({
  roleId: undefined,
  roleName: '',
  roleCode: '',
  sort: 1,
  status: 1,
  dataScope: 0,
});

// 表单校验规则
const rules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
};

// 数据权限选项
const dataScopeOption = [
  { value: 0, label: '全部数据权限' },
  { value: 1, label: '组织及子部门数据' },
  { value: 2, label: '本部门数据权限' },
  { value: 3, label: '本人数据' },
];

// 同步 props 到本地状态
watch(
  () => props.modelValue,
  (newVal) => {
    localVisible.value = newVal;
  },
  { immediate: true }
);

// 当本地状态变化时通知父组件
watch(
  () => localVisible.value,
  (val) => {
    emit('update:modelValue', val);
  }
);

// 监听 localVisible 打开对话框并加载数据
watch(
  () => localVisible.value,
  async (newVal) => {
    if (newVal && props.roleId) {
      await getRoleFormData(props.roleId);
    } else if (!newVal) {
      resetForm();
    }
  }
);

/**
 * 打开角色表单弹窗
 * @param roleId
 */
async function getRoleFormData(roleId: string) {
  const data = await roleDetailApi(roleId);
  Object.assign(formData.value, data);
}

/**
 * 重置表单
 */
function resetForm() {
  roleFormRef.value?.resetFields();
  roleFormRef.value?.clearValidate();

  formData.value = {
    roleName: '',
    roleCode: '',
    sort: 1,
    status: 1,
    dataScope: 0,
  };
}

/**
 * 角色保存提交
 */
const handleSubmit = async () => {
  const valid = roleFormRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const roleId = formData.value.roleId;
    await (roleId ? editRoleApi(formData.value) : addRoleApi(formData.value));
    ElMessage.success(roleId ? '修改角色成功' : '新增角色成功');
    localVisible.value = false;
    emit('success'); // 通知父组件刷新列表
  } catch {
    ElMessage.error('角色名称或角色编码已存在，请检查');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <!-- 弹窗主体 -->
  <el-dialog
    center
    draggable
    v-model="localVisible"
    :title="title"
    width="500px"
    :fullscreen="fullScreen"
    @close="localVisible = false"
  >
    <!-- 自定义标题栏 -->
    <template #header>
      <div class="custom-header">
        <span>{{ title }}</span>
        <div class="header-icons">
          <el-button @click.stop="toggleFullScreen" circle size="small">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <!-- 表单内容 -->
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

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="localVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-icons {
  display: flex;
  align-items: center;
}
</style>
