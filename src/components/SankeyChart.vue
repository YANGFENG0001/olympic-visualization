<template>
  <div class="container">
    <!-- 历史事件列表 -->
    <div class="event-list">
      <div class="event-list-header">历史重大事件</div>
      <div class="event-scroll-container">
        <div 
          v-for="(event, year) in filteredHistoricalEvents" 
          :key="year"
          class="event-item"
          :style="{ borderLeftColor: event.color }"
          @click="handleEventClick(year)"
          :class="{ 'active': selectedEventYear === Number(year) }"
        >
          <div class="event-year">{{ year }}</div>
          <div class="event-name">{{ event.name }}</div>
          <div class="event-desc">{{ event.oldCountry }} → {{ event.newCountries.join(', ') }}</div>
        </div>
      </div>
    </div>
    
    <!-- 桑基图容器 -->
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
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
    const selectedEventYear = ref(null);

    // 定义重大历史事件及其影响的国家
    // 桑基图使用的历史事件数据 (HISTORICAL_EVENTS)
    const HISTORICAL_EVENTS = {
      1905: { // 挪威独立
        name: "挪威独立",
        oldCountry: "Sweden-Norway",
        newCountries: ["Sweden", "Norway"],
        color: "#6e7074",
        relatedYears: [1900, 1908]
      },
      1912: { // 巴尔干战争
        name: "巴尔干战争",
        oldCountry: "Ottoman Empire",
        newCountries: ["Greece", "Bulgaria", "Serbia", "Montenegro"],
        color: "#d48265",
        relatedYears: [1912, 1920]
      },
      1947: { // 印巴分治
        name: "印巴分治",
        oldCountry: "British India",
        newCountries: ["India", "Pakistan"],
        color: "#749f83",
        relatedYears: [1948, 1952]
      },
      1948: { // 以色列建国
        name: "以色列建国",
        oldCountry: "Palestine",
        newCountries: ["Israel"],
        color: "#ca8622",
        relatedYears: [1948, 1952]
      },
      1961: { // 叙利亚退出阿联
        name: "叙利亚退出阿联",
        oldCountry: "United Arab Republic",
        newCountries: ["Egypt", "Syria"],
        color: "#6e7074",
        relatedYears: [1960, 1964]
      },
      1965: { // 新加坡独立
        name: "新加坡独立",
        oldCountry: "Malaysia",
        newCountries: ["Malaysia", "Singapore"],
        color: "#d48265",
        relatedYears: [1964, 1968]
      },
      1971: { // 孟加拉独立
        name: "孟加拉独立",
        oldCountry: "Pakistan",
        newCountries: ["Pakistan", "Bangladesh"],
        color: "#91c7ae",
        relatedYears: [1968, 1972]
      },
      1990: { // 两德统一
        name: "两德统一",
        oldCountry: "West Germany",
        newCountries: ["Germany"],
        color: "#61a0a8",
        relatedYears: [1988, 1992]
      },
      1991: { // 苏联解体
        name: "苏联解体",
        oldCountry: "Soviet Union",
        newCountries: ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan"],
        color: "#c23531",
        relatedYears: [1988, 1992, 1996]
      },
      1993: { // 捷克斯洛伐克分裂
        name: "捷克斯洛伐克分裂",
        oldCountry: "Czechoslovakia",
        newCountries: ["Czech Republic", "Slovakia"],
        color: "#2f4554",
        relatedYears: [1992, 1996]
      },
      2006: { // 塞尔维亚和黑山分离
        name: "塞黑分离",
        oldCountry: "Serbia and Montenegro",
        newCountries: ["Serbia", "Montenegro"],
        color: "#bda29a",
        relatedYears: [2004, 2008]
      },
      
    };
    // 计算过滤后的历史事件（只显示与当前年份相关的事件）
    const filteredHistoricalEvents = computed(() => {
      const result = {};
      for (const year in HISTORICAL_EVENTS) {
        const event = HISTORICAL_EVENTS[year];
        if (event.relatedYears.includes(props.year)) {
          result[year] = event;
        }
      }
      return result;
    });

    // 处理事件点击
    const handleEventClick = (year) => {
      selectedEventYear.value = Number(year);
      updateChart();
    };

    // 自动选择第一个相关事件
    watch(() => props.year, (newYear) => {
      const events = filteredHistoricalEvents.value;
      const firstEventYear = Object.keys(events)[0];
      selectedEventYear.value = firstEventYear ? Number(firstEventYear) : null;
    }, { immediate: true });

    // 窗口resize处理器
    const resizeHandler = () => {
      chartInstance?.resize();
    };

    // 初始化图表
    const initChart = () => {
      if (!chartRef.value) {
        setTimeout(initChart, 50);
        return;
      }

      if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) {
        setTimeout(initChart, 50);
        return;
      }

      chartInstance = echarts.init(chartRef.value);
      updateChart();
      window.addEventListener('resize', resizeHandler);
    };

    // 计算国家奖牌总数
    const calculateCountryTotal = (countryData) => {
      if (!countryData) return 0;
      if (countryData.total !== undefined) return countryData.total;
      if (countryData.Total !== undefined) return countryData.Total;
      return (countryData.Gold || 0) + (countryData.Silver || 0) + (countryData.Bronze || 0);
    };

    // 计算新国家数据之和
    const calculateNewCountriesSum = (data, newCountries) => {
      let sum = 0;
      newCountries.forEach(country => {
        const countryData = data[country];
        const countryTotal = calculateCountryTotal(countryData);
        sum += countryTotal;
      });
      return sum;
    };

    // 检查所选年份是否是重大历史变迁前后的奥运年份
    const isYearAroundHistoricalEvent = () => {
      if (!selectedEventYear.value) return { isAroundEvent: false };
      
      const { medalDataByYear = {} } = props.data || {};
      const allYears = Object.keys(medalDataByYear).map(Number).sort((a, b) => a - b);
      
      const eventYear = selectedEventYear.value;
      const event = HISTORICAL_EVENTS[eventYear];
      if (!event) return { isAroundEvent: false };
      
      // 找到变迁前后的最近奥运年份
      const preYear = allYears.filter(y => y < eventYear).pop();
      const postYear = allYears.filter(y => y > eventYear).shift();
      
      // 如果选择的年份是变迁前后的奥运年份，则返回相关信息
      if (props.year === preYear || props.year === postYear) {
        return {
          isAroundEvent: true,
          eventYear,
          preYear,
          postYear,
          event
        };
      }
      
      return { isAroundEvent: false };
    };

    // 准备桑基图数据
    const prepareSankeyData = () => {
      const { medalDataByYear = {} } = props.data || {};
      
      // 检查所选年份是否是重大历史变迁前后的奥运年份
      const { isAroundEvent, eventYear, preYear, postYear, event } = isYearAroundHistoricalEvent();
      
      if (!isAroundEvent) {
        return null;
      }
      
      const { oldCountry, newCountries, color } = event;
      const preData = medalDataByYear[preYear] || {};
      const postData = medalDataByYear[postYear] || {};
      
      // 检查变迁前后是否有数据
      let hasPreData = false;
      let hasPostData = false;

      // 检查老国家是否有数据
      const oldCountryData = preData[oldCountry];
      if (oldCountryData && calculateCountryTotal(oldCountryData) > 0) {
        hasPreData = true;
      }

      // 检查新国家是否有数据
      for (const newCountry of newCountries) {
        const newCountryData = postData[newCountry];
        if (newCountryData && calculateCountryTotal(newCountryData) > 0) {
          hasPostData = true;
          break;
        }
      }

      // 如果变迁前后都没有数据，返回特殊标识
      if (!hasPreData && !hasPostData) {
        return {
          noData: true,
          event,
          preYear,
          postYear
        };
      }

      // 如果只有变迁前有数据，也要处理
      if (!hasPostData) {
        return {
          noPostData: true,
          event,
          preYear,
          postYear,
          oldCountryTotal: calculateCountryTotal(oldCountryData)
        };
      }

      // 原始桑基图数据处理逻辑
      const nodes = [];
      const links = [];
      const nodeMap = new Map();
      
      // 计算新国家数据总和
      const newCountriesSum = calculateNewCountriesSum(preData, newCountries);
      
      // 获取老国家数据，如果没有则使用新国家总和
      const oldCountryTotal = oldCountryData 
        ? calculateCountryTotal(oldCountryData)
        : newCountriesSum;

      // 添加旧国家节点
      const nodeName = `${oldCountry} (${preYear})`;
      if (!nodeMap.has(nodeName)) {
        nodes.push({
          name: nodeName,
          itemStyle: { color },
          value: oldCountryTotal
        });
        nodeMap.set(nodeName, nodes.length - 1);
      }

      // 添加新国家节点和链接
      newCountries.forEach(newCountry => {
        const newCountryData = postData[newCountry];
        const newCountryTotal = calculateCountryTotal(newCountryData) || 0;
        
        if (newCountryTotal > 0) {
          const newNodeName = `${newCountry} (${postYear})`;
          if (!nodeMap.has(newNodeName)) {
            nodes.push({
              name: newNodeName,
              itemStyle: { color },
              value: newCountryTotal
            });
            nodeMap.set(newNodeName, nodes.length - 1);
          }
          
          // 计算链接值比例
          const ratio = newCountriesSum > 0 ? newCountryTotal / newCountriesSum : 1 / newCountries.length;
          const linkValue = oldCountryTotal * ratio;
          
          links.push({
            source: nodeName,
            target: newNodeName,
            value: linkValue,
            lineStyle: {
              color: color,
              opacity: 0.6
            }
          });
        }
      });
      
      return {
        nodes,
        links,
        event
      };
    };

    // 在 getOption 函数中处理无数据情况
    const getOption = () => {
      const result = prepareSankeyData();
      
      // 无相关历史事件的情况
      if (!result) {
        return {
          title: {
            text: '请从左侧选择历史事件',
            subtext: '当前年份无自动匹配的重大国家政治变迁\n请从左侧列表中选择一个历史事件查看其影响',
            left: 'center',
            top: 'center',
            textStyle: {
              fontSize: 18,
              color: '#333'
            },
            subtextStyle: {
              fontSize: 14,
              color: '#666',
              lineHeight: 20
            }
          }
        };
      }
      
      // 变迁前后都没有数据的情况
      if (result.noData) {
        return {
          title: {
            text: `${result.event.name} (${result.preYear}-${result.postYear})`,
            subtext: `${result.event.oldCountry} → ${result.event.newCountries.join(', ')}\n变迁前后该国家/地区均无奖牌数据`,
            left: 'center',
            top: 'center',
            textStyle: {
              fontSize: 18,
              color: '#333'
            },
            subtextStyle: {
              fontSize: 14,
              color: '#666',
              lineHeight: 20
            }
          }
        };
      }
      
      // 变迁后没有数据的情况
      if (result.noPostData) {
        return {
          title: {
            text: `${result.event.name} (${result.preYear}-${result.postYear})`,
            subtext: `${result.event.oldCountry} 在 ${result.preYear} 年获得 ${result.oldCountryTotal} 枚奖牌\n但在 ${result.postYear} 年分裂后的国家均无奖牌数据`,
            left: 'center',
            top: 'center',
            textStyle: {
              fontSize: 18,
              color: '#333'
            },
            subtextStyle: {
              fontSize: 14,
              color: '#666',
              lineHeight: 20
            }
          }
        };
      }
      
      // 正常显示桑基图的情况
      const { event } = result;
      const eventDescription = `${event.name}: ${event.oldCountry} → ${event.newCountries.join(', ')}`;
      
      const option = {
        title: {
          text: '国家政治变迁对体育实力的影响',
          subtext: eventDescription,
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 18
          },
          subtextStyle: {
            fontSize: 12,
            lineHeight: 16
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: params => {
            if (params.dataType === 'node') {
              return `${params.name}<br/>奖牌总数: ${params.value || '无数据'}`;
            }
            const sourceYear = params.source.match(/\((\d+)\)/)?.[1] || '';
            const targetYear = params.target.match(/\((\d+)\)/)?.[1] || '';
            return `${params.source.replace(` (${sourceYear})`, '')} (${sourceYear}) → ${params.target.replace(` (${targetYear})`, '')} (${targetYear})<br/>奖牌数: ${params.value.toFixed(0)}`;
          }
        },
        grid: {
          top: 80,
          left: 20,
          right: 20,
          bottom: 20,
          containLabel: true
        },
        series: [{
          type: 'sankey',
          layout: 'none',
          data: result.nodes,
          links: result.links,
          emphasis: {
            focus: 'adjacency',
            blurScope: 'coordinateSystem'
          },
          lineStyle: {
            color: 'source',
            curveness: 0.5,
            opacity: 0.6
          },
          label: {
            color: '#333',
            position: 'right',
            formatter: params => {
              return params.name.replace(/ \(\d+\)$/, '');
            },
            fontSize: 12
          },
          nodeWidth: 12,
          nodeGap: 20,
          draggable: true,
          top: '15%',
          bottom: '5%',
          left: '5%',
          right: '18%'
        }],
        animationDuration: 1500
      };
      
      return option;
    };
    // 更新图表
    const updateChart = () => {
      if (!chartInstance) return;
      
      chartInstance.clear();
      const option = getOption();
      chartInstance.setOption(option, true);
      
      if (option.series?.[0]?.data?.length > 20) {
        chartInstance.showLoading();
        setTimeout(() => {
          chartInstance.hideLoading();
        }, 800);
      }
    };

    // 生命周期
    onMounted(() => {
      initChart();
    });
    
    onBeforeUnmount(() => {
      if (chartInstance) {
        window.removeEventListener('resize', resizeHandler);
        chartInstance.dispose();
      }
    });

    watch(() => [props.data, props.year, selectedEventYear.value], () => {
      updateChart();
    }, { deep: true });

    return { 
      chartRef,
      filteredHistoricalEvents,
      selectedEventYear,
      handleEventClick
    };
  }
};
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
}

.event-list {
  width: 220px;
  height: 100%;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.event-list-header {
  padding: 12px 16px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
  background-color: #f0f0f0;
}

.event-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.event-item {
  padding: 12px 16px;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.event-item:hover {
  background-color: #f0f0f0;
}

.event-item.active {
  background-color: #e6f7ff;
  border-left-color: #1890ff;
}

.event-year {
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.event-name {
  font-size: 14px;
  color: #444;
  margin-bottom: 2px;
}

.event-desc {
  font-size: 12px;
  color: #666;
}

.chart-container {
  flex: 1;
  height: 100%;
}
</style>