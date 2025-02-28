<script setup lang="ts">
import type {
  CategoryForm,
  CategoryPage,
  CategoryQuery,
} from '#/api/system/article/category';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteCategoryApi,
  getCategoryDetailApi,
  saveCategoryApi,
  selectCategoryPageApi,
  updateCategoryApi,
} from '#/api/system/article/category';

defineOptions({
  name: 'Category',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const dataFormRef = ref(ElForm);

const loading = ref(false);

const ids = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<CategoryQuery>({
  page: 1,
  limit: 10,
});

const categoryTableData = ref<CategoryPage[]>();

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

// 查询
function handleQuery() {
  loading.value = true;
  selectCategoryPageApi(queryParams)
    .then((data) => {
      categoryTableData.value = data.list;
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
 * 行复选框选中
 * @param selection
 */
function handleSelectionChange(selection: any) {
  ids.value = selection.map((item: any) => item.categoryId);
}

/**
 * 提交表单
 */
function handleSubmit() {
  dataFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      loading.value = true;
      const id = formData.categoryId;
      if (id) {
        updateCategoryApi(formData)
          .then(() => {
            console.log(formData);
            ElMessage.success('修改成功');
            closeDialog();
            handleQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        saveCategoryApi(formData)
          .then(() => {
            ElMessage.success('新增成功');
            closeDialog();
            handleQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      }
    }
  });
}

function handleDelete(categoryId?: string) {
  let categoryIds: string[];
  if (categoryId) {
    categoryIds = [String(categoryId)]; // 删除单条记录
  } else if (ids.value.length > 0) {
    categoryIds = ids.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteCategoryApi(categoryIds).then(() => {
      ElMessage.success('删除成功');
      resetQuery();
    });
  });
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="categoryName">
          <el-input
            v-model="queryParams.categoryName"
            placeholder="文章分类名称"
            clearable
            @keyup.enter="handleQuery()"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery()">
            <i-ep-search />搜索
          </el-button>

          <el-button type="primary" @click="resetQuery()">
            <i-ep-refresh />重置
          </el-button>

          <el-button
            type="primary"
            @click="openDialog()"
            v-hasPerm="['category:add']"
          >
            <i-ep-plus />新增
          </el-button>

          <el-button
            type="danger"
            @click="handleDelete()"
            v-hasPerm="['category:delete']"
          >
            <i-ep-delete />删除
          </el-button>
        </el-form-item>
      </ElForm>
    </div>

    <el-card shadow="never" class="table-container">
      <el-table
        v-loading="loading"
        heighlight-current-row
        :data="categoryTableData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />

        <!-- <el-table-column
            label="图标"
            prop="icon"
            align="center"
          /> -->

        <el-table-column
          label="文章分类名称"
          prop="categoryName"
          align="center"
        />

        <el-table-column label="文章量" prop="articleCount" align="center" />

        <el-table-column label="排序" prop="sort" align="center" />

        <el-table-column label="创建时间" prop="createTime" align="center" />

        <el-table-column label="操作" align="center" width="300" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              v-hasPerm="['category:edit']"
              @click.stop="openDialog(scope.row.categoryId)"
            >
              <i-ep-edit />编辑
            </el-button>

            <el-button
              v-hasPerm="['category:delete']"
              type="primary"
              link
              size="small"
              @click.stop="handleDelete(scope.row.categoryId)"
            >
              <i-ep-delete />删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.page"
        v-model:limit="queryParams.limit"
        @pagination="handleQuery()"
      />
    </el-card>

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
          <el-button type="primary" @click="handleSubmit()">确定</el-button>
          <el-button type="primary" @click="closeDialog()">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
