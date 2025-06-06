<script lang="ts" setup>
import { reactive } from 'vue';

const userData = reactive([
  { name: '用户量', number: 2300 },
  { name: '访问量', number: 6300 },
  { name: '成交金额', number: 2300 },
  { name: '支付用户', number: 2300 },
]);

// 柱形图数据
const barData = reactive({
  title: { text: 'apu处理器销售图' },
  tooltip: {}, // 鼠标移上去显示悬浮信息
  xAxis: {
    data: ['5600g', '5700g', '8600g', '8700g'],
  },
  yAxis: {},
  series: [
    {
      name: '销量',
      type: 'bar',
      data: [8000, 900, 600, 300],
      barWidth: ' 20%',
    },
  ],
});

// 饼状图数据
const pieData = reactive({
  title: { text: 'amd各系列处理器销量图' },
  series: [
    {
      type: 'pie',
      data: [
        {
          value: 86_000,
          name: '锐龙5000系列处理器',
        },
        {
          value: 12_000,
          name: '锐龙7000系列处理器',
        },
        {
          value: 5000,
          name: '锐龙8000系列处理器',
        },
      ],
    },
  ],
});

// 折线图
const categoryData = reactive({
  title: { text: 'amd年份处理器销量图' },
  xAxis: {
    type: 'category',
    data: ['2007', '2020', '2024'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: [200, 560, 1380],
      type: 'line',
      label: {
        show: true,
        position: 'top',
        textStyle: {
          fontSize: 20,
        },
      },
    },
  ],
});

const chartConfigs = reactive([
  { type: 'bar', data: barData, width: '400px', height: '400px' },
  { type: 'pie', data: pieData, width: '500px', height: '400px' },
  { type: 'line', data: categoryData, width: '400px', height: '400px' },
]);
</script>
<template>
  <div>
    <el-card class="card-welcome">
      <p>
        开源等于互助；开源需要大家一起来支持，支持的方式有很多种，比如使用、推荐、写教程、保护生态、贡献代码、回答问题、分享经验、打赏赞助等；欢迎您加入我们！
      </p>
    </el-card>

    <el-row :gutter="10">
      <el-col :span="6" v-for="item in userData" :key="item.name">
        <el-card class="card-welcome">
          <p>{{ item.name }}</p>
          <p class="stat-number">{{ item.number }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="10">
      <el-col v-for="chart in chartConfigs" :key="chart.type" :span="8">
        <el-card class="card-echarts">
          <vue-echarts
            :option="chart.data"
            :style="{ width: chart.width, height: chart.height }"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.card-welcome,
.card-echarts {
  padding: 10px;
  margin: 20px;
  text-align: center;
  border-radius: var(--radius);
  box-shadow: 0 0 10px rgb(82 63 105 / 5%);
  transition: all 0.3s ease-in-out;

  &:hover {
    box-shadow: 0 4px 14px rgb(0 0 0 / 12%);
    transform: translateY(-5px) scale(1.02);
  }
}

.stat-number {
  margin-top: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}
</style>
