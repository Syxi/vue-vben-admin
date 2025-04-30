<script setup lang="ts">
import type {
  DictTypeForm,
  DictTypePage,
  DictTypeQuery,
} from '#/api/system/sys/dictType';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  addDictTypeApi,
  deleteDictTypeApi,
  editDictTypeApi,
  getDictTypeDetailApi,
  selectDictTypePageApi,
} from '#/api/system/sys/dictType';
import DictValue from '#/views/system/sys/dict/dict-value.vue';

defineOptions({
  name: 'DictType',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const dataFormRef = ref(ElForm);

const loading = ref(false);

const ids = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<DictTypeQuery>({
  page: 1,
  limit: 10,
});

const dictTypeTableData = ref<DictTypePage[]>();

const formData = reactive<DictTypeForm>({
  status: 1,
});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  name: [{ required: true, message: '请输入字典类型名称', trigger: 'blur' }],
  typeCode: [
    { required: true, message: '请输入字典类型编码', trigger: 'blur' },
  ],
});

// 查询
function handleQuery() {
  loading.value = true;
  selectDictTypePageApi(queryParams)
    .then((data) => {
      dictTypeTableData.value = data.list;
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
 * 打开字典类型表单弹窗
 * @param dictTypeId
 */
async function openDialog(dictTypeId?: string) {
  dialog.visible = true;
  if (dictTypeId) {
    dialog.title = '修改字典类型';
    const data = await getDictTypeDetailApi(dictTypeId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增字典类型';
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
      const dictTypeId = formData.id;
      if (dictTypeId) {
        editDictTypeApi(formData)
          .then(() => {
            ElMessage.success('修改成功');
            closeDialog();
            handleQuery();
          })
          .finally(() => {
            loading.value = false;
          });
      } else {
        addDictTypeApi(formData)
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

function handleDelete(dictTypeId?: string) {
  let dictTypeIds: string[];
  if (dictTypeId) {
    dictTypeIds = [String(dictTypeId)]; // 删除单条记录
  } else if (ids.value.length > 0) {
    dictTypeIds = ids.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteDictTypeApi(dictTypeIds).then(() => {
      ElMessage.success('删除成功');
      resetQuery();
    });
  });
}

/**
 * 字典项弹窗
 */
const dictValueDialog = reactive({
  title: '',
  visible: false,
});

/**
 * 当前选中的字典类型
 */
const selectDictType = reactive({
  typeCode: '',
  typeName: '',
});

/**
 * 打开字典项弹窗
 * @param row
 */
function openDictValueDialog(row: DictTypePage) {
  dictValueDialog.visible = true;
  dictValueDialog.title = `【${row.name}】字典数据`;
  selectDictType.typeCode = row.typeCode;
  selectDictType.typeName = row.name;
}

/**
 * 关闭字典项弹窗
 */
function closeDictValueDialog() {
  dictValueDialog.visible = false;
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="m-2 flex h-full">
    <el-card class="w-full">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="字典类型名称/编码"
            clearable
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
            @click="openDialog()"
            v-access:code="['sys:dictType:add']"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="danger"
            @click="handleDelete()"
            v-access:code="['sys:dictType:delete']"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        heighlight-current-row
        :data="dictTypeTableData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />

        <el-table-column
          label="字典类型名称"
          prop="name"
          width="200"
          align="center"
        />

        <el-table-column
          label="字典类型编码"
          prop="typeCode"
          width="200"
          align="center"
        />

        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">启用</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sort" width="100" align="center" />

        <el-table-column label="备注" prop="remark" />

        <el-table-column label="操作" align="center" width="300" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:dictValue:index']"
              @click.stop="openDictValueDialog(scope.row)"
            >
              <el-icon><Collection /></el-icon> 字典数据
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:dictType:edit']"
              @click.stop="openDialog(scope.row.id)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              v-access:code="['sys:dictType:delete']"
              type="primary"
              link
              size="small"
              @click.stop="handleDelete(scope.row.id)"
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
        class="mt-2"
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
        <el-form-item label="字典类型名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入字典类型名称" />
        </el-form-item>

        <el-form-item label="字典类型编码" prop="typeCode">
          <el-input
            v-model="formData.typeCode"
            placeholder="请输入字典类型编码"
          />
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
            placeholder="字典类型备注"
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

    <!-- 字典项弹窗  -->
    <el-dialog
      v-model="dictValueDialog.visible"
      :title="dictValueDialog.title"
      width="1000px"
      @close="closeDictValueDialog()"
    >
      <DictValue
        v-model:type-code="selectDictType.typeCode"
        v-model:type-name="selectDictType.typeName"
      />
    </el-dialog>
  </div>
</template>
