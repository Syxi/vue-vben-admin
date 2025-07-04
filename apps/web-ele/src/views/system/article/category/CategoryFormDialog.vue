<script setup lang="ts">
import {ElForm, ElMessage} from "element-plus";
import {reactive, ref} from "vue";
import {
  type CategoryForm,
  getCategoryDetailApi, saveCategoryApi,
  updateCategoryApi
} from "#/api/system/article/category";

const emit = defineEmits<{ (e: 'success'): void }>();

const dataFormRef = ref(ElForm);

const formData = reactive<CategoryForm>({});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  categoryName: [
    { required: true, message: '请输入文章分类名称', trigger: 'blur' },
  ],
});

/**
 * 打开弹窗
 * @param categoryId
 */
async function openDialog(categoryId?: string) {
  dialog.visible = true;
  if (categoryId) {
    dialog.title = '修改文章分类';
    const data = await getCategoryDetailApi(categoryId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增文章分类';
  }
}

/**
 * 关闭弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const valid = dataFormRef.value.validate();
  if (!valid) return;

  const id = formData.categoryId;
  await (id ? updateCategoryApi(formData) : saveCategoryApi(formData));
  ElMessage.success(id ? '修改成功' : '新增成功');
  emit('success');
  closeDialog();
}

defineExpose({ openDialog });
</script>
<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    draggable
    center
    @close="closeDialog()"
    width="400px"
  >
    <ElForm
      ref="dataFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :inline="true"
    >
      <el-form-item label="文章分类名称" prop="categoryName">
        <el-input
          v-model="formData.categoryName"
          placeholder="请输入文章分类名称"
        />
      </el-form-item>

      <div>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" style="width: 200px" />
        </el-form-item>
      </div>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="handleSubmit()">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
