<script setup lang="ts">
import type { UploadInstance, UploadUserFile } from 'element-plus';

import type { FileRecordQuery, FileRecordVO } from '#/api/system/media/file';

import { nextTick, onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  checkFileConvertStatusApi,
  deleteFileApi,
  fileUploadApi,
  handleDownloadPdfFileApi,
  handleDownloadSourceFileApi,
  selectFilePageApi,
} from '#/api/system/media/file';
import { useCardHeight } from '#/hooks/useCardHeight';

defineOptions({
  name: 'File',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 分页总记录数
const total = ref(0);

// 查询参数
const queryParams = reactive<FileRecordQuery>({
  page: 1,
  limit: 20,
});

// 查询表单
const queryForm = ref(ElForm);

// 分页列表数据
const fileTableData = ref<FileRecordVO[]>();

const uploadRef = ref<UploadInstance>();

// 数组形式存储用户上传的多文件
let uploadFiles = reactive<UploadUserFile[]>([]);

const fileIds = ref<string[]>([]);

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  fileIds.value = selection.map((item: any) => item.id);
}

const dialog = reactive({
  title: '',
  visible: false,
});

// 查询文件
function handleQuery() {
  loading.value = true;
  selectFilePageApi(queryParams)
    .then((data) => {
      fileTableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryForm.value.resetFields();
  queryParams.fileName = '';
  queryParams.page = 1;
  handleQuery();
}

function handleFileExceed(files: any[]) {
  const excessFiles = files.slice(1); // 仅保留超出的文件
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

// 删除上传列表的文件
async function handleRemove(uploadFile: UploadUserFile) {
  // 比较文件uid。上传文件的uid和删除文件的uid是否一样
  const index = uploadFiles.findIndex(
    (file) => file.raw.uid === uploadFile.uid,
  );

  // uid相同就可以删除
  if (index === -1) {
    ElMessage.error('文件未找到，无法删除');
  } else {
    // 从上传列表文件中移除文件
    uploadFiles.splice(index, 1);
    // 等待DOM更新后再显示信息
    await nextTick();
    ElMessage.success('文件已从上传列表移除');
  }
}

// 打开上传文件窗口
function handleOpenDialog() {
  dialog.visible = true;
}

// 关闭上传文件窗口
function handleCloseDiolog() {
  // 清空已上传的文件引用
  uploadFiles = [];
  uploadRef.value?.clearFiles();
  resetQuery();
  dialog.visible = false;
}

// 上传文件
const submitUpload = () => {
  if (uploadFiles.length === 0) {
    ElMessage.error('上传文件不能为空');
    return false;
  }
  Promise.all(
    uploadFiles.map((uploadFile) => {
      return fileUploadApi(uploadFile.raw);
    }),
  ).then(() => {
    // 清空已上传的文件引用
    uploadFiles = [];
    uploadRef.value?.clearFiles();
    ElMessage.success('文件上传成功');
    resetQuery();
    dialog.visible = false;
  });
};

/**
 * 删除文件
 * @param id
 */
function handleDeleteFile(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (fileIds.value.length > 0) {
    ids = fileIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项！');
    return;
  }

  ElMessageBox.confirm('确定删除文件?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteFileApi(ids).then(() => {
      ElMessage.success('删除成功!');
      resetQuery();
    });
  });
}

/**
 * 下载文件
 * @param row
 */
async function handleDownloadFile(row: FileRecordVO) {
  try {
    const id = row.id;
    const response = await handleDownloadSourceFileApi(id);

    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const fileName = row.fileName;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    link.click();
    window.URL.revokeObjectURL(url);
  } catch {
    ElMessage.error('文件下载失败，请稍后再试!');
  }
}

/**
 * 下载pdf文件
 */
async function handleDownloadPdfFile(row: FileRecordVO) {
  try {
    const id = row.id;

    const response = await handleDownloadPdfFileApi(id);

    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // 文件拓展名为pdf
    const fileName = `${row.fileName.split('.').slice(0, -1).join('.')}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    link.click();
    window.URL.revokeObjectURL(url);
  } catch {
    ElMessage.error('文件下载失败，请稍后再试!');
  }
}

// 浏览器自带插件方式预览pdf
// async function handlePreviewFile(id: string) {
//   try {
//     const response = await previewFileApi(id);
//     const uint8Array = new Uint8Array(response.data);
//     const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
//     const pdfUrl = URL.createObjectURL(pdfBlob);

//   window.open(pdfUrl, '_blank')
//   } catch (error) {
//     ElMessage.error("文件已丢失，请重新上传")
//   }

// }

// const pdfViewer = ref("");

/**
 * pdf.js的viewer插件预览文件
 */
// async function handlePreviewFile(id: string, fileName: string) {
//   dialog.visible = true;
//   // 去掉文件拓展名
//   dialog.title = fileName.slice(0, fileName.lastIndexOf("."));
//   try {
//     const response = await FileApi.previewFile(id);
//     const uint8Array = new Uint8Array(response.data);
//     const pdfBlob = new Blob([uint8Array], { type: "application/pdf" });
//     const url = URL.createObjectURL(pdfBlob);

//     pdfViewer.value = url;
//     initPdfViewer(url);
//   } catch (error) {
//     ElMessage.warning("文件已丢失, 请重新上传");
//   }
// }

// function initPdfViewer(url: any) {
//   const viewerElement = document.getElementById("pdfViewer");
//   if (viewerElement) {
//     const pdfUrl = `/lib/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`;
//     viewerElement.innerHTML = `<iframe src="${pdfUrl}" frameborder="0" style="width:100%;height:100vh;"></iframe>`;
//   }
// }

/**
 * 浏览器新窗口打开viewer插件预览
 *
 跨域问题 在项目的/lib/pdfjs/web/viewer.mjs中注释掉以下代码
 if (fileOrigin !== viewerOrigin) {
 throw new Error("file origin does not match viewer's");
 }
 */
// function handlePreviewFile(row: FileRecordVO) {
//   try {
//     checkFileConvertStatusApi(row.id).catch((error) => {
//       ElMessage.error(error);
//     });
//     // file=dev/pdf/318c3157280bf8d33d2218d7e69f7780.pdf
//     const path = `${import.meta.env.VITE_GLOB_API_URL}${row.url}${row.fileMd5}.pdf`;
//     const pdfUrl = `/static/pdfjs/web/viewer.html?file=${path}`;
//     const newWindow = window.open(pdfUrl, '_blank');
//     if (!newWindow) {
//       ElMessage.error('未能打开新窗口预览PDF,请允许弹出窗口或调整浏览器设置');
//     }
//   } catch {
//     ElMessage.warning('文件转换错误，请联系管理员');
//   }
// }

const dialogView = reactive({
  title: '',
  visible: false,
});

const pdfUrl = ref('');

function closeDialog() {
  dialogView.visible = false;
  pdfUrl.value = '';
}

async function handlePreviewFile(row: FileRecordVO) {
  try {
    // 检查文件转换状态
    const response = await checkFileConvertStatusApi(row.id);

    // 根据响应状态处理不同的逻辑
    switch (response) {
      case -1: {
        ElMessage.error('不支持该格式文件转换成pdf');
        break;
      }

      case 0: {
        ElMessage.warning('文件正在转换中，请稍后再打开');
        break;
      }

      case 1: {
        // 文件已转换成功，打开预览对话框
        dialogView.visible = true;
        dialogView.title = row.fileName;

        const url = `${import.meta.env.VITE_GLOB_API_URL}${row.url}${row.fileMd5}.pdf`;
        pdfUrl.value = `/static/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`;
        break;
      }

      default: {
        ElMessage.error('未知的文件转换状态');
        break;
      }
    }
  } catch (error) {
    // 捕获并处理异常
    console.error('检查文件转换状态时出错:', error);
    ElMessage.error('检查文件转换状态时发生错误，请稍后重试');
  }
}

onMounted(() => {
  handleQuery();
});

const cardFormRef = ref();
const { cardHeight, tableHeight } = useCardHeight(cardFormRef);
</script>

<template>
  <div class="app-container">
    <el-card ref="cardFormRef" class="mb-2">
      <ElForm :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item>
          <el-input
            v-model="queryParams.fileName"
            placeholder="请输入文件名"
            clearable
            @keydown="handleQuery()"
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
            type="danger"
            :disabled="fileIds.length === 0"
            v-access:code="['sys:file:delete']"
            @click="handleDeleteFile()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:file:upload']"
            @click="handleOpenDialog()"
          >
            <el-icon> <Upload /> </el-icon>上传文件
          </el-button>
        </el-form-item>
      </ElForm>
    </el-card>

    <el-card :style="{ height: cardHeight }">
      <el-table
        v-loading="loading"
        :data="fileTableData"
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="false" prop="id" />

        <el-table-column v-if="false" prop="fileSha256" />

        <el-table-column type="selection" width="50" align="center" />

        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="fileName" label="文件名称" align="center" />

        <el-table-column prop="fileSize" label="文件大小" align="center" />

        <el-table-column
          prop="createTime"
          label="文件上传时间"
          align="center"
        />

        <!-- @click="handlePreviewFile(scope.row.id, scope.row.fileName)"  -->
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:previewer']"
              @click="handlePreviewFile(scope.row)"
            >
              预览
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:downloadSourceFile']"
              @click="handleDownloadFile(scope.row)"
            >
              下载原文件
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:downloadPdfFile']"
              @click="handleDownloadPdfFile(scope.row)"
            >
              下载pdf文件
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:delete']"
              @click="handleDeleteFile(scope.row.id)"
            >
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

    <!-- 使用dialog查看pdf -->
    <el-dialog
      draggable
      center
      fullscreen
      v-model="dialogView.visible"
      :title="dialogView.title"
      width="100%"
      @close="closeDialog()"
    >
      <div style="height: 90vh; overflow: hidden">
        <iframe
          :src="pdfUrl"
          style="width: 100%; height: 100%"
          allowfullscreen
        ></iframe>
      </div>
    </el-dialog>

    <el-dialog
      v-model="dialog.visible"
      title="上传文件"
      width="800"
      @close="handleCloseDiolog()"
    >
      <el-upload
        class="upload-demo"
        drag
        multiple
        ref="uploadRef"
        :file-list="uploadFiles"
        :on-exceed="handleFileExceed"
        :on-change="handleFileChange"
        :on-remove="handleRemove"
        :auto-upload="false"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          Drop file here or <em>click to upload</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">上传文件列表</div>
        </template>
      </el-upload>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDiolog()">取消</el-button>
          <el-button type="primary" @click="submitUpload()">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
