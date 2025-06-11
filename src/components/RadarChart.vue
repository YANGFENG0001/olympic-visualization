<template>
  <!-- 固定高度代替最小高度，确保DOM有明确尺寸 -->
  <div ref="chartRef" style="width: 100%; height: 100%;"></div>
</template>

<script>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
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

    // 调试日志
    console.log('🔧 RadarChart 组件初始化');
    console.log('接收到的 props:', {
      year: props.year,
      data: props.data,
      selectedCountries: props.selectedCountries
    });
    
    // 窗口 resize 事件处理器（单独提取便于卸载时移除）
    const resizeHandler = () => {
      chartInstance?.resize(); // 使用可选链操作符简化判断
    };
    
    // 初始化图表（增加DOM就绪检查）
    const initChart = () => {
      // 检查DOM引用是否存在
      if (!chartRef.value) {
        // 延迟重试机制
        setTimeout(initChart, 100);
        return;
      }
      
      // 检查DOM尺寸是否有效
      if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) {
        setTimeout(initChart, 100);
        return;
      }
      
      // 初始化ECharts实例
      chartInstance = echarts.init(chartRef.value);
      updateChart();
      
      // 添加resize监听
      window.addEventListener('resize', resizeHandler);
    };
    
    // 准备雷达图数据（基于sportPerformanceByYear）
    const prepareRadarData = () => {
      console.log('处理雷达图数据，年份:', props.year);
      
      const { sportPerformanceByYear, sportStats } = props.data;
      const currentYearData = sportPerformanceByYear[props.year] || {};
      
      // 获取所有运动项目
      const allSports = Object.keys(sportStats || {});
      
      // 筛选条件：当年有比赛且参与国家数>10的项目，最多取10个
      const selectedSports = allSports
        .filter(sport => {
          // 检查当年是否有国家在该项目有得分
          const hasPerformance = Object.values(currentYearData).some(
            country => country[sport]?.Score > 0
          );
          return hasPerformance && sportStats[sport]?.Countries?.size > 10;
        })
        .slice(0, 10);

      // 计算当年每个项目的最大得分（用于标准化）
      const yearMaxScores = {};
      selectedSports.forEach(sport => {
        yearMaxScores[sport] = Math.max(
          1, // 最小值为1
          ...Object.values(currentYearData).map(
            country => country[sport]?.Score || 0
          )
        );
      });

      // 准备雷达图指标
      const indicators = selectedSports.map(sport => ({
        name: sport,
        max: 100,  // 标准化为百分比
        min: 0
      }));
      
      // 准备系列数据
      const seriesData = props.selectedCountries
        .filter(country => currentYearData[country]) // 过滤掉当年无数据的国家
        .map(country => {
          const countrySports = currentYearData[country] || {};
          return {
            value: selectedSports.map(sport => {
              const performance = countrySports[sport] || { Score: 0 };
              // 计算标准化分数 (0-100)
              return Math.round((performance.Score / yearMaxScores[sport]) * 100);
            }),
            name: country,
            // 携带原始数据用于tooltip
            itemData: selectedSports.map(sport => ({
              sport,
              ...(countrySports[sport] || { 
                Gold: 0, 
                Silver: 0, 
                Bronze: 0,
                Score: 0,
                Events: 0 
              })
            }))
          };
        });

      console.log('生成的雷达图数据:', {
        year: props.year,
        selectedSports,
        yearMaxScores,
        seriesData
      });
      
      return { indicators, seriesData };
    };

    
    // 获取图表配置项
    const getOption = () => {
      // 无选中国家时的空状态
      if (props.selectedCountries.length === 0) {
        return {
          title: {
            text: '请选择要对比的国家',
            left: 'center',
            top: 'center'
          }
        };
      }
      
      const { indicators, seriesData } = prepareRadarData();
      
      return {
        title: {
          text: `${props.year}年各国优势项目对比`,
          left: 'center',
          top: 10
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          data: props.selectedCountries,
          bottom: 10
        },
        radar: {
          indicator: indicators,
          radius: '65%',
          splitNumber: 4,
          axisName: {
            color: '#333'
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(52, 152, 219, 0.1)', 'rgba(52, 152, 219, 0.2)', 
                      'rgba(52, 152, 219, 0.3)', 'rgba(52, 152, 219, 0.4)'],
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              shadowBlur: 10
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(52, 152, 219, 0.5)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(52, 152, 219, 0.5)'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: params => {
              const data = params.data || {};
              const itemData = data.itemData || [];
              let html = `<div style="font-weight:bold;margin-bottom:5px">${params.name} (${props.year}年)</div>`;
              
              itemData.forEach((item, index) => {
                html += `
                  <div style="margin-top:3px">
                    <span style="display:inline-block;width:120px;font-weight:500">
                      ${item.sport}:
                    </span>
                    <span style="float:right">${params.value[idx]}%</span>
                    <div style="font-size:12px;color:#666;padding-left:10px">
                      <span style="display:inline-block;width:60px">金牌: ${item.Gold}</span>
                      <span style="display:inline-block;width:60px">银牌: ${item.Silver}</span>
                      <span style="display:inline-block;width:60px">铜牌: ${item.Bronze}</span>
                      <div style="margin-top:2px">
                        项目总分: ${item.Score} (${item.Events || 0}个小项)
                      </div>
                    </div>
                  </div>
                `;
              });
              
              return html;
            }
          }, 
        },
        series: [
          {
            name: '奖牌数',
            type: 'radar',
            data: seriesData,
            areaStyle: {
              opacity: 0.3
            },
            lineStyle: {
              width: 2
            },
            symbolSize: 6,
            label: {
              show: true,
              formatter: params => {
                return params.value;
              }
            }
          }
        ]
      };
    };
    
    // 更新图表（不合并配置项）
    const updateChart = () => {
      if (!chartInstance) return;
      chartInstance.setOption(getOption(), true); // true表示不合并配置
    };
    
    // 生命周期钩子
    onMounted(() => {
      console.log('🚀 RadarChart 组件已挂载');
      initChart();
    });
    
    // 组件卸载前的清理
    onBeforeUnmount(() => {
      if (chartInstance) {
        window.removeEventListener('resize', resizeHandler); // 移除事件监听
        chartInstance.dispose(); // 销毁图表实例
      }
    });
    
    // 监听相关props变化
    watch(() => [props.year, props.selectedCountries], updateChart, { deep: true });
    
    return {
      chartRef
    };
  }
};
</script>