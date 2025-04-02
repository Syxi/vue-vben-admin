<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 定义响应式变量
const sendMessages = ref('');
const responseMessages = ref([]);
const isConnected = ref(false); // 用于跟踪连接状态
let stompClient;

// 启动 WebSocket 连接
const connect = () => {
  if (isConnected.value) return; // 如果已经连接，则不再重复连接

  const socket = new SockJS('http://localhost:8888/ws');
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    isConnected.value = true;
    console.log('Connected to WebSocket server.');
    stompClient.subscribe('/topic/messages', (frame) => {
      responseMessages.value.push(frame.body);
    });
  };

  stompClient.onStompError = (frame) => {
    console.error(`Broker reported error: ${frame.headers.message}`);
  };

  stompClient.activate();
};

// 关闭 WebSocket 连接
const disconnect = () => {
  if (!isConnected.value) return; // 如果已经断开连接，则无需再次关闭

  if (stompClient) {
    stompClient.deactivate().then(() => {
      isConnected.value = false;
      console.log('Disconnected from WebSocket server.');
    });
  }
};

// 发送消息的方法
const sendMessage = () => {
  if (stompClient && sendMessages.value.trim()) {
    stompClient.publish({
      destination: '/app/sendMessage',
      body: sendMessages.value,
    });
    sendMessages.value = ''; // 清空输入框
  }
};

onMounted(() => {
  // 组件挂载时自动尝试连接（可选）
  connect();
});

onUnmounted(() => {
  // 组件卸载时关闭连接
  disconnect();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container m-2">
      <h1 class="m-2">
        WebSocket连接状态：
        <span class="mr-10">
          <el-text type="primary" v-if="isConnected">已连接</el-text>
          <el-text type="danger" v-else>未连接</el-text>
        </span>
        <el-button type="primary" @click="connect">开启连接</el-button>
        <el-button type="danger" @click="disconnect">关闭连接</el-button>
      </h1>
      <el-row :gutter="20" class="m-4">
        <el-col :span="12">
          <el-input
            type="textarea"
            rows="4"
            v-model="sendMessages"
            placeholder="Enter a message"
            style="max-width: 800px"
          />
        </el-col>
        <el-col :span="12">
          <el-input
            type="textarea"
            rows="4"
            style="max-width: 800px"
            v-model="responseMessages"
          />
        </el-col>
      </el-row>
      <el-button type="primary" @click="sendMessage" class="m-2 ml-1">发送信息</el-button>
    </div>
  </div>
</template>

<style scoped></style>
