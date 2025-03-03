<script setup lang="ts">
import type {
  DictValueForm,
  DictValuePage,
  DictValueQuery,
} from '#/api/system/sys/dictValue';

import { onMounted, reactive, ref, watch } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  addDictValueApi,
  deleteDictValuesApi,
  editDictValueApi,
  getDictValueDetailApi,
  selectDictValuePageApi,
} from '#/api/system/sys/dictValue';

defineOptions({
  name: 'DictValue',
  inheritAttrs: false,
});

const props = defineProps({
  typeCode: {
    type: String,
    default: () => {
      return '';
    },
  },
  typeName: {
    type: String,
    default: () => {
      return '';
    },
  },
});

watch(
  () => props.typeCode,
  (newVal: string) => {
    formData.typeCode = newVal;
    queryParams.typeCode = newVal;

    resetQuery();
  },
);

const queryFormRef = ref(ElForm);

const dataFormRef = ref(ElForm);

const loading = ref(false);

const ids = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<DictValueQuery>({
  page: 1,
  limit: 10,
  typeCode: props.typeCode,
});

const dictValueTableData = ref<DictValuePage[]>();

const formData = reactive<DictValueForm>({
  status: 1,
  typeCode: props.typeCode,
});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  name: [{ required: true, message: '请输入字典项名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入字典项值', trigger: 'blur' }],
});

// 查询
function handleQuery() {
  if (queryParams.typeCode) {
    loading.value = true;
    selectDictValuePageApi(queryParams)
      .then((data) => {
        dictValueTableData.value = data.list;
        total.value = data.total;
      })
      .finally(() => {
        loading.value = false;
      });
  }
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
 * 打开字典项表单弹窗
 * @param dictValueId
 */
async function openDialog(dictValueId?: string) {
  dialog.visible = true;
  if (dictValueId) {
    dialog.title = '修改字典项';
    const data = await getDictValueDetailApi(dictValueId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增字典项';
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

  formData.id = undefined;
  formData.status = 1;
  formData.typeCode = props.typeCode;
}

/**
 * 行复选框选中
 * @param selection
 */
function handleSelectionChange(selection: any) {
  ids.value = selection.map((item: any) => item.id);
}

/**
 * 提交表单
 */
function handleSubmit() {
  dataFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      loading.value = true;
      const dicValueId = formData.id;
      if (dicValueId) {
        editDictValueApi(formData)
          .then(() => {
            ElMessage.success('修改成功');
            closeDialog();
            handleQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        addDictValueApi(formData)
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

function handleDelete(dictValueId?: string) {
  let dictValueIds: string[];
  if (dictValueId) {
    dictValueIds = [String(dictValueId)]; // 删除单条记录
  } else if (ids.value.length > 0) {
    dictValueIds = ids.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteDictValuesApi(dictValueIds).then(() => {
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
        <el-form-item prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="字典项名称"
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

          <el-button type="primary" @click="openDialog()">
            <i-ep-plus />新增
          </el-button>

          <el-button type="danger" @click="handleDelete()">
            <i-ep-delete />删除
          </el-button>
        </el-form-item>
      </ElForm>
    </div>

    <el-card shadow="never" class="table-container">
      <el-table
        v-loading="loading"
        heighlight-current-row
        :data="dictValueTableData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />

        <el-table-column
          label="字典名称"
          prop="name"
          width="150"
          align="center"
        />

        <el-table-column
          label="字典值"
          prop="value"
          width="150"
          align="center"
        />

        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">启用</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sort" width="100" align="center" />

        <el-table-column label="备注" prop="remark" align="center" />

        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.id)"
            >
              <i-ep-edit />编辑
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleDelete(scope.row.id)"
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

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      append-to-body
      draggable
      center
      width="500px"
      @close="closeDialog()"
    >
      <ElForm
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="字典名称">{{ typeName }}</el-form-item>
        <el-form-item label="字典项名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入字典项名称" />
        </el-form-item>

        <el-form-item label="字典值" prop="value">
          <el-input v-model="formData.value" placeholder="请输入字典值" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio label="-1">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="字典项备注"
            :autosize="{ minRows: 2, maxRows: 6 }"
          />
        </el-form-item>
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
