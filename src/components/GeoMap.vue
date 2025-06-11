<template>
  <div ref="chartRef" style="width: 100%; height: 100%; min-height: 500px;"></div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import worldJSON from '../../src/mapdata/world.json';

export default {
  props: {
    year: {
      type: Number,
      required: true
    },
    data: {
      type: Object,
      required: true,
      default: () => ({})
    },
    selectedCountries: {
      type: Array,
      default: () => []
    }
  },
  emits: ['country-selected'],
  setup(props, { emit }) {
    const chartRef = ref(null);
    let chartInstance = null;
    // 在setup函数中添加国家名称映射
    const countryNameMap = {
      'USA': 'United States'
      // 可以添加其他需要映射的国家
    };

    // 调试日志
    console.log('🔧 GeoMap 组件初始化');
    console.log('接收到的 props:', {
      year: props.year,
      data: props.data,
      selectedCountries: props.selectedCountries
    });

    // 初始化图表
    const initChart = () => {
      console.log('初始化图表');
      
      try {
        // 注册地图
        echarts.registerMap('world', worldJSON);
        console.log('地图注册成功');
        
        // 创建图表实例
        chartInstance = echarts.init(chartRef.value);
        updateChart();
        
        // 添加点击事件
        chartInstance.on('click', (params) => {
          if (params.name) {
            console.log('点击国家:', params.name);
            emit('country-selected', params.name);
          }
        });
        
        // 窗口大小变化时重绘
        window.addEventListener('resize', () => {
          chartInstance?.resize();
        });
      } catch (e) {
        console.error('图表初始化失败:', e);
      }
    };

    // 获取配置项
    const getOption = () => {
      console.log('生成图表配置，当前数据:', props.data);
      
      if (!props.data || Object.keys(props.data).length === 0) {
        console.warn('数据为空，显示空白状态');
        return {
          title: {
            text: '暂无数据',
            left: 'center',
            top: 'center'
          }
        };
      }

      // 准备数据
      const data = Object.entries(props.data).map(([country, medals]) => {
        // 转换国家名称
        const mappedName = countryNameMap[country] || country;
        return {
          name: mappedName,  // 使用映射后的名称
          value: (medals.Gold || 0) * 3 + (medals.Silver || 0) * 2 + (medals.Bronze || 0),
          ...medals
        };
      });

      return {
        title: {
          text: `${props.year}年奥运会奖牌分布`,
          subtext: '点击国家可添加到对比列表',
          left: 'center',
          top: 10
        },
        tooltip: {
          trigger: 'item',
          formatter: params => {
            const medals = params.data || {};
            return `
              <strong>${params.name}</strong><br/>
              金牌: ${medals.Gold || 0}<br/>
              银牌: ${medals.Silver || 0}<br/>
              铜牌: ${medals.Bronze || 0}<br/>
              总分: ${(medals.Gold || 0) * 3 + (medals.Silver || 0) * 2 + (medals.Bronze || 0)}
            `;
          }
        },
        visualMap: {
          min: 0,
          max: Math.max(...data.map(item => item.value), 10),
          inRange: {
            color: ['#f0f9e8', '#bae4bc', '#7bccc4', '#43a2ca', '#0868ac']
          }
        },
        series: [{
          name: '奖牌分布',
          type: 'map',
          map: 'world',
          roam: true,
          data: data,
          emphasis: {
            itemStyle: {
              areaColor: '#e74c3c'
            }
          }
        }]
      };
    };

    // 更新图表
    const updateChart = () => {
      if (!chartInstance) return;
      
      try {
        const option = getOption();
        chartInstance.setOption(option, true);
        
        // 高亮选中国家
        props.selectedCountries.forEach(country => {
          chartInstance.dispatchAction({
            type: 'select',
            name: country
          });
        });
      } catch (e) {
        console.error('图表更新失败:', e);
      }
    };

    // 使用组合式 API 的生命周期钩子
    onMounted(() => {
      console.log('🚀 GeoMap 组件已挂载');
      initChart();
    });

    // 监听 props 变化
    watch(() => props.data, (newData) => {
      console.log('data prop 变化:', newData);
      updateChart();
    }, { deep: true });

    watch(() => props.year, () => {
      console.log('year prop 变化');
      updateChart();
    });

    return { chartRef };
  }
};
</script>