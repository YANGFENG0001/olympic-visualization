<template>
    <div ref="chartRef" style="width: 100%; height: 100%;"></div>
  </template>
  
  <script>
  import { ref, onMounted, watch } from 'vue';
  import * as echarts from 'echarts';
  
  export default {
    props: {
      year: Number,
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
        // 时间轴使用的历史事件数据 (historicalEvents)
        const historicalEvents = [
          { year: 1896, name: '第一届现代奥运会', impact: '希腊雅典举办' },
          { year: 1905, name: '挪威独立', impact: '瑞典-挪威联盟解体' },
          { year: 1912, name: '巴尔干战争', impact: '奥斯曼帝国在欧洲的领土变更' },
          { year: 1914, name: '第一次世界大战', impact: '1916年奥运会取消' },
          { year: 1918, name: '奥匈帝国解体', impact: '中欧国家重组' },
          { year: 1922, name: '苏联成立', impact: '俄罗斯帝国转变为苏维埃社会主义共和国联盟' },
          { year: 1936, name: '柏林奥运会', impact: '纳粹德国利用奥运会宣传' },
          { year: 1939, name: '第二次世界大战', impact: '1940、1944年奥运会取消' },
          { year: 1945, name: '德国分裂', impact: '形成东德和西德' },
          { year: 1947, name: '印巴分治', impact: '印度和巴基斯坦独立' },
          { year: 1948, name: '以色列建国', impact: '中东政治格局变化' },
          { year: 1956, name: '苏伊士危机', impact: '多国抵制墨尔本奥运会' },
          { year: 1958, name: '阿联成立', impact: '埃及和叙利亚合并' },
          { year: 1961, name: '叙利亚退出阿联', impact: '阿拉伯联合共和国解体' },
          { year: 1965, name: '新加坡独立', impact: '脱离马来西亚' },
          { year: 1971, name: '孟加拉独立', impact: '东巴基斯坦独立' },
          { year: 1980, name: '苏联入侵阿富汗', impact: '美国等国家抵制莫斯科奥运会' },
          { year: 1984, name: '冷战对峙', impact: '苏联等国家抵制洛杉矶奥运会' },
          { year: 1990, name: '两德统一', impact: '东德和西德合并' },
          { year: 1991, name: '苏联解体', impact: '独联体国家参赛' },
          { year: 1993, name: '捷克斯洛伐克分裂', impact: '形成捷克和斯洛伐克' },
          { year: 2006, name: '塞黑分离', impact: '塞尔维亚和黑山成为独立国家' },
          { year: 2008, name: '北京奥运会', impact: '中国金牌榜第一' },
          { year: 2011, name: '南苏丹独立', impact: '非洲最新国家成立' },
          { year: 2016, name: '里约奥运会', impact: '南美首次举办奥运会' }
        ];
        
        // 过滤出当前年份附近的事件
        const filteredEvents = historicalEvents.filter(event => 
          Math.abs(event.year - props.year) <= 12
        );
        
        return {
          title: {
            text: '历史事件时间轴',
            left: 'center',
            top: 10
          },
          tooltip: {
            trigger: 'item',
            formatter: params => {
              const { name, year, impact } = params.data;
              return `<strong>${year}年: ${name}</strong><br/>${impact}`;
            }
          },
          xAxis: {
            type: 'value',
            min: props.year - 12,
            max: props.year + 12,
            axisLabel: {
              formatter: value => `${value}年`
            }
          },
          yAxis: {
            type: 'value',
            show: false
          },
          series: [
            {
              type: 'line',
              symbol: 'circle',
              symbolSize: 12,
              data: filteredEvents.map(event => ({
                ...event,
                value: [event.year, 0],
                itemStyle: {
                  color: '#e74c3c'
                }
              })),
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: {
                  color: '#e74c3c',
                  width: 2
                },
                data: [
                  {
                    xAxis: props.year,
                    lineStyle: {
                      type: 'dashed'
                    }
                  }
                ]
              },
              label: {
                show: true,
                position: 'top',
                formatter: params => params.data.name
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
      watch(() => props.year, updateChart);
      
      return {
        chartRef
      };
    }
  };
  </script>