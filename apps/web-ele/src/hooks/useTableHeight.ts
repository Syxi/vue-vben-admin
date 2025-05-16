import { onMounted, onUnmounted, ref } from 'vue';

// 监听窗口大小变化，并更新表格高度
export const useTableHeight = (offsetHeight: number) => {
  const tableHeight = ref(window.innerHeight - offsetHeight);

  // 监听窗口大小变化，并更新表格高度
  const updateTableHeight = () => {
    tableHeight.value = window.innerHeight - offsetHeight;
  };

  // 添加监听器
  onMounted(() => {
    window.addEventListener('resize', updateTableHeight);
    updateTableHeight(); // 初始化高度
  });

  // 移除监听器
  onUnmounted(() => {
    window.removeEventListener('resize', updateTableHeight);
  });

  return {
    tableHeight,
  };
};
