<script setup lang="ts">
import type { UploadInstance, UploadUserFile } from 'element-plus';

import type {
  ImageForm,
  ImagePage,
  ImageQuery,
} from '#/api/system/media/image';

import { nextTick, onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteImagesApi,
  getImageDetailsApi,
  handleDownloadImageApi,
  selectImagePageApi,
  updateImageApi,
  uploadImageApi,
} from '#/api/system/media/image';

defineOptions({
  name: 'Image',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 分页总记录数
const total = ref(0);

// 查询参数
const queryParams = reactive<ImageQuery>({
  page: 1,
  limit: 10,
});

// 查询表单
const queryForm = ref(ElForm);

const imageFormRef = ref(ElForm);

const imageIds = ref<string[]>([]);

const imgPath = `${import.meta.env.VITE_APP_BASE_API}`;

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  imageIds.value = selection.map((item: any) => item.id);
}

// 分页列表数据
const imageTableData = ref<ImagePage[]>();

const uploadRef = ref<UploadInstance>();

const formData = reactive<ImageForm>({});

// 数组形式存储用户上传的多图片
let uploadFiles = reactive<UploadUserFile[]>([]);

const dialog = reactive({
  title: '',
  visible: false,
});

// 查询图片
function handleQuery() {
  loading.value = true;
  selectImagePageApi(queryParams)
    .then((data) => {
      imageTableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryForm.value.resetFields();
  queryParams.imageName = '';
  queryParams.page = 1;
  handleQuery();
}

function handleFileExceed(files: any[]) {
  const excessFiles = files.slice(1); // 仅保留超出的图片
  excessFiles.forEach((file) => {
    uploadFiles.push({
      uid: file.uid,
      raw: file.raw,
      name: file.name,
    });
  });
}

function handleFileChange(file: any) {
  uploadFiles.push({
    raw: file.raw,
    name: file.name,
  });
}

// 删除上传列表的图片
async function handleRemove(uploadFile: UploadUserFile) {
  // 比较图片uid。上传图片的uid和删除图片的uid是否一样
  const index = uploadFiles.findIndex(
    (file) => file.raw.uid === uploadFile.uid,
  );

  // uid相同就可以删除
  if (index === -1) {
    ElMessage.error('图片未找到，无法删除');
  } else {
    // 从上传列表图片中移除图片
    uploadFiles.splice(index, 1);
    // 等待DOM更新后再显示信息
    await nextTick();
    ElMessage.success('图片已从上传列表移除');
  }
}

// 只接受图片文件
function beforeUpload(uploadFile: UploadUserFile) {
  const isImage = [
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ].includes(uploadFile.type);
  if (!isImage) {
    ElMessage.error('上传文件只能是图片格式!');
    return false;
  }

  return isImage;
}

// 上传图片
const submitUpload = () => {
  if (uploadFiles.length === 0) {
    ElMessage.error('上传图片不能为空');
    return false;
  }
  Promise.all(
    uploadFiles.map((uploadFile) => {
      return uploadImageApi(uploadFile.raw);
    }),
  ).then(() => {
    // 清空已上传的图片引用
    uploadFiles = [];
    uploadRef.value?.clearFiles();
    ElMessage.success('图片上传成功');
    resetQuery();
    uploadDialog.visible = false;
  });
};

const uploadDialog = reactive({
  title: '上传图片',
  visible: false,
});

// 打开上传图片窗口
function handleOpenUploadDialog() {
  uploadDialog.visible = true;
}

// 关闭上传图片窗口
function handleCloseUploadDialog() {
  // 清空已上传的图片引用
  uploadFiles = [];
  uploadRef.value?.clearFiles();
  resetQuery();
  uploadDialog.visible = false;
}

/**
 * 下载图片
 * @param fileName
 */
async function handleDownloadImage(row: ImagePage) {
  try {
    const id = row.id;
    const response = await handleDownloadImageApi(id);
    console.log(response);

    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    console.log(url);
    // 创建隐藏的可下载链接元素
    const link = document.createElement('a');
    link.href = url;

    const imageName = row.imageName;
    link.download = imageName;

    link.click();
    window.URL.revokeObjectURL(url);
  } catch {
    ElMessage.error('图片下载失败，请稍后再试!');
  }
}

/**
 * 删除图片
 * @param id
 */
function handleDeleteImage(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (imageIds.value.length > 0) {
    ids = imageIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项！');
    return;
  }

  ElMessageBox.confirm('确定删除图片?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteImagesApi(ids).then(() => {
      ElMessage.success('删除成功!');
      resetQuery();
    });
  });
}

/**
 * 关闭预览弹窗
 */
function handleCloseDiolog() {
  dialog.visible = false;
}

/**
 * 打开弹窗
 * @param id
 */
async function handleOpenDialog(id?: string) {
  dialog.visible = true;
  if (id) {
    dialog.title = '修改图片';
    const data = await getImageDetailsApi(id);
    Object.assign(formData, data);
  }
}

/**
 * 提交更新图片信息
 */
function handleSubmit() {
  loading.value = true;
  updateImageApi(formData)
    .then(() => {
      ElMessage.success('图片修改成功!');
      handleCloseDiolog();
      resetQuery();
    })
    .catch(() => {
      ElMessage.error('图片修改失败!');
      handleCloseDiolog();
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container">
      <ElForm :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item>
          <el-input
            v-model="queryParams.imageName"
            placeholder="请输入图片名称"
            clearable
            @keydown="handleQuery()"
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
            type="danger"
            :disabled="imageIds.length === 0"
            @click="handleDeleteImage()"
            v-hasPerm="['sys:image:delete']"
          >
            <i-ep-delete />删除
          </el-button>

          <el-button
            type="primary"
            v-hasPerm="['sys:image:upload']"
            @click="handleOpenUploadDialog()"
          >
            <el-icon><Upload /></el-icon>上传图片
          </el-button>
        </el-form-item>
      </ElForm>
    </div>

    <el-card shadow="never" class="table-container">
      <el-table
        v-loading="loading"
        :data="imageTableData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="false" prop="id" />
        <el-table-column v-if="false" prop="storagePath" />

        <el-table-column type="selection" width="80" align="center" />

        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="imageName" label="图片名称" align="center" />

        <el-table-column label="图片" prop="url" align="center">
          <template #default="scope">
            <el-image
              :src="imgPath + scope.row.url"
              style="width: 100px; height: 100px"
            />
          </template>
        </el-table-column>

        <el-table-column prop="imageSize" label="图片大小" align="center" />

        <el-table-column
          prop="createTime"
          label="图片上传时间"
          align="center"
        />

        <!-- @click="handlePreviewFile(scope.row.id, scope.row.fileName)"  -->
        <el-table-column fixed="right" label="操作">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-hasPerm="['sys:image:edit']"
              @click="handleOpenDialog(scope.row.id)"
            >
              编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-hasPerm="['sys:image:download']"
              @click="handleDownloadImage(scope.row)"
            >
              下载
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-hasPerm="['sys:image:delete']"
              @click="handleDeleteImage(scope.row.id)"
            >
              删除
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

      <!-- 编辑图片弹框 -->
      <el-dialog
        v-model="dialog.visible"
        :title="dialog.title"
        draggable
        center
        width="400px"
        @close="handleCloseDiolog()"
      >
        <ElForm ref="imageFormRef" :model="formData">
          <el-form-item label="图片名称">
            <el-input v-model="formData.imageName" />
          </el-form-item>
        </ElForm>

        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="handleSubmit">确定</el-button>
            <el-button @click="handleCloseDiolog">取消</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 上传图片弹框 -->
      <el-dialog
        v-model="uploadDialog.visible"
        :title="uploadDialog.title"
        width="800"
        @close="handleCloseUploadDialog()"
      >
        <el-upload
          class="upload-demo"
          drag
          ref="uploadRef"
          :file-list="uploadFiles"
          :on-exceed="handleFileExceed"
          :on-change="handleFileChange"
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          accept=".jpg,.jpeg,.png,.gif"
          :auto-upload="false"
          :multiple="true"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            Drop file here or <em>click to upload</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">上传图片列表</div>
          </template>
        </el-upload>

        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="submitUpload">确定</el-button>
            <el-button @click="handleCloseUploadDialog()">取消</el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>
