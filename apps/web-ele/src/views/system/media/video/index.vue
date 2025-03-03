<script setup lang="ts">
import type { UploadInstance, UploadUserFile } from 'element-plus';

import type { VideoQuery, VideoVO } from '#/api/system/media/video';

import { nextTick, onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteVideoApi,
  downloadVideoApi,
  selectVideosPageApi,
  uploadVideoApi,
} from '#/api/system/media/video';

defineOptions({
  name: 'Video',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 分页总记录数
const total = ref(0);

// 查询参数
const queryParams = reactive<VideoQuery>({
  page: 1,
  limit: 10,
});

// 查询表单
const queryForm = ref(ElForm);

const videoIds = ref<string[]>([]);

const videoPlayerRef = ref();

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  videoIds.value = selection.map((item: any) => item.id);
}

// 分页列表数据
const videoTableData = ref<VideoVO[]>();

const uploadRef = ref<UploadInstance>();

// 数组形式存储用户上传的多文件
let uploadFiles = reactive<UploadUserFile[]>([]);

const dialog = reactive({
  title: '',
  visible: false,
});

// 查询文件
function handleQuery() {
  loading.value = true;
  selectVideosPageApi(queryParams)
    .then((data) => {
      videoTableData.value = data.list;
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

// 只接受视频文件
function beforeUpload(uploadFile: UploadUserFile) {
  // 修改为检查视频格式
  const isVideo = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-flv',
    'video/x-m4v',
    'video/x-matroska',
    'video/x-msvideo', // AVI 视频
  ].includes(uploadFile.type);

  if (!isVideo) {
    ElMessage.error('上传文件只能是视频格式!'); // 提示信息已更正
    return false;
  }

  return isVideo;
}

// 删除上传列表的文件
async function handleRemove(uploadFile: UploadUserFile) {
  // 比较文件uid。上传文件的uid和删除文件的uid是否一样
  const index = uploadFiles.findIndex(
    (file) => file.raw.uid === uploadFile.uid,
  );

  console.log('Attempting to remove file with UID:', uploadFile.uid);
  console.log('Current uploadFiles content:', uploadFiles);
  console.log('index', index);

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

// 上传文件
const submitUpload = () => {
  if (uploadFiles.length === 0) {
    ElMessage.error('上传文件不能为空');
    return false;
  }
  Promise.all(
    uploadFiles.map((uploadFile) => {
      return uploadVideoApi(uploadFile.raw);
    }),
  ).then(() => {
    // 清空已上传的文件引用
    uploadFiles = [];
    uploadRef.value?.clearFiles();
    ElMessage.success('视频上传成功');
    resetQuery();
    uploadDialog.visible = false;
  });
};

const uploadDialog = reactive({
  title: '上传视频',
  visible: false,
});

// 打开上传视频窗口
function handleOpenUploadDialog() {
  uploadDialog.visible = true;
}

// 关闭上传视频窗口
function handleCloseUploadDialog() {
  // 清空已上传的文件引用
  uploadFiles = [];
  uploadRef.value?.clearFiles();
  resetQuery();
  uploadDialog.visible = false;
}

/**
 * 下载文件
 * @param fileName
 */
async function handleDownloadVideo(fileName: string) {
  try {
    const response = await downloadVideoApi(fileName);
    console.log(response);
    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // 创建隐藏的可下载链接元素
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
 * 删除文件
 * @param id
 */
function handleDeleteVideo(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (videoIds.value.length > 0) {
    ids = videoIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项！');
    return;
  }

  ElMessageBox.confirm('确定删除视频?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteVideoApi(ids).then(() => {
      ElMessage.success('删除成功!');
      resetQuery();
    });
  });
}

// VideoPlayer组件实例
const player = videoPlayerRef.value;

// 视频播放源
const videoSrc = ref('');

// 是否静音
const muted = ref(false);

const playerOptions = ref({
  playbackRates: [0.5, 1, 1.5, 2], // 可选播放速度
  loop: false, // 是否视频一结束就重新开始
  fluid: true, // 按比例缩放以适应其容器
  controls: true, // 是否显示控件
  languang: 'zh-cn',
  autoplay: true,
  poster: '', // 封面
  controlBar: {
    timeDivider: true, // 当前时间和持续时间的分隔符
    durationDisplay: true, // 显示持续时间
    remainingTimeDisplay: true, // 是否显示剩余时间功能
    fullscreenToggle: true, // 是否显示全屏按钮
  },
});

/**
 * 关闭预览弹窗
 */
function handleCloseDialog() {
  // 获取 videojs 播放器实例
  videoSrc.value = '';
  muted.value = true;
  dialog.visible = false;
}

function handlePlayVideo(fileName: string, url: string) {
  dialog.visible = true;
  muted.value = false;
  dialog.title = fileName;

  /**
   * path: 视频文件在服务端的保存路径
   */
  const path = url + fileName;

  // 构建url
  const videoUrl = `${import.meta.env.VITE_APP_BASE_API}/${path}`;
  videoSrc.value = videoUrl;
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
            v-model="queryParams.fileName"
            placeholder="请输入文件名"
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
            :disabled="videoIds.length === 0"
            v-access:code="['sys:video:delete']"
            @click="handleDeleteVideo()"
          >
            <i-ep-delete />删除
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:video:upload']"
            @click="handleOpenUploadDialog()"
          >
            <el-icon><Upload /></el-icon>上传视频
          </el-button>
        </el-form-item>
      </ElForm>
    </div>

    <el-card shadow="never" class="table-container">
      <el-table
        v-loading="loading"
        :data="videoTableData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="false" prop="id" />
        <el-table-column v-if="false" prop="filePath" />
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="fileName" label="视频名称" align="center" />

        <el-table-column
          prop="createTime"
          label="视频上传时间"
          align="center"
        />

        <!-- @click="handlePreviewFile(scope.row.id, scope.row.fileName)"  -->
        <el-table-column fixed="right" label="操作">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:previewer']"
              @click="handlePlayVideo(scope.row.fileName, scope.row.url)"
            >
              播放
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:video:download']"
              @click="handleDownloadVideo(scope.row.fileName)"
            >
              下载
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:video:delete']"
              @click="handleDeleteVideo(scope.row.id)"
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

      <el-dialog
        v-model="dialog.visible"
        :title="dialog.title"
        @close="handleCloseDialog()"
      >
        <VideoPlayer
          ref="videoPlayerRef"
          :playsinline="false"
          :options="playerOptions"
          :src="videoSrc"
          :muted="muted"
        />
      </el-dialog>

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
          :on-before="beforeUpload"
          accept=".mp4,.m4v,.mkv,.webm,.mov,.avi,.flv,.mpeg"
          :auto-upload="false"
          :multiple="true"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            Drop file here or <em>click to upload</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">上传视频列表</div>
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
