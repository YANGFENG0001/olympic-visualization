<template>
    <div ref="chartRef" style="width: 100%; height: 100%;"></div>
  </template>
  
  <script>
  import { ref, onMounted, watch } from 'vue';
  import * as echarts from 'echarts';
  
  export default {
    props: {
      year: Number,
      data: Object,
      selectedCountries: Array
    },
    setup(props) {
      const chartRef = ref(null);
      let chartInstance = null;
      
      // 初始化图表
      const initChart = () => {
        if (!chartRef.value) return;
        
        chartInstance = echarts.init(chartRef.value);
        updateChart();
        
        // 窗口大小变化时重绘
        window.addEventListener('resize', () => {
          chartInstance.resize();
        });
      };
      
      // 获取配置项
      const getOption = () => {
        // 准备数据
        const countries = props.selectedCountries.length > 0 
          ? props.selectedCountries 
          : Object.keys(props.data).slice(0, 5);
        
        const medalData = countries.map(country => {
          const medals = props.data[country] || { Gold: 0, Silver: 0, Bronze: 0 };
          return {
            name: country,
            gold: medals.Gold,
            silver: medals.Silver,
            bronze: medals.Bronze,
            total: medals.Gold * 3 + medals.Silver * 2 + medals.Bronze * 1
          };
        }).sort((a, b) => a.total - b.total);
        
        return {
          title: {
            text: `${props.year}年奖牌榜`,
            left: 'left',
            top: 10
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: ['金牌', '银牌', '铜牌'],
            right: 10,
            top: 10
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'value'
          },
          yAxis: {
            type: 'category',
            data: medalData.map(item => item.name)
          },
          series: [
            {
              name: '金牌',
              type: 'bar',
              stack: 'total',
              label: {
                show: true,
                position: 'inside'
              },
              emphasis: {
                focus: 'series'
              },
              data: medalData.map(item => item.gold),
              itemStyle: {
                color: '#FFD700'
              }
            },
            {
              name: '银牌',
              type: 'bar',
              stack: 'total',
              label: {
                show: true,
                position: 'inside'
              },
              emphasis: {
                focus: 'series'
              },
              data: medalData.map(item => item.silver),
              itemStyle: {
                color: '#C0C0C0'
              }
            },
            {
              name: '铜牌',
              type: 'bar',
              stack: 'total',
              label: {
                show: true,
                position: 'inside'
              },
              emphasis: {
                focus: 'series'
              },
              data: medalData.map(item => item.bronze),
              itemStyle: {
                color: '#CD7F32'
              }
            }
          ]
        };
      };
      
      // 更新图表
      const updateChart = () => {
        if (!chartInstance) return;
        
        const option = getOption();
        chartInstance.setOption(option);
      };
      
      // 初始化和监听变化
      onMounted(initChart);
      watch(() => [props.year, props.data, props.selectedCountries], updateChart, { deep: true });
      
      return {
        chartRef
      };
    }
  };
  </script>