<template>
  <div class="app-container">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">数据加载中...</div>
    </div>
    <header class="app-header">
      <h1>国家体育实力对比：地理与政治视角</h1>
      <p>探索120年奥运历史中的地缘政治与体育竞技格局</p>
    </header>

    <div class="dashboard">
      <div class="control-panel">
        <div class="time-control">
          <label for="yearRange">时间范围: {{ yearRange[0] }} - {{ yearRange[1] }}</label>
          <input 
            type="range" 
            id="yearRange" 
            v-model="currentYear" 
            :min="yearRange[0]" 
            :max="yearRange[1]" 
            :step="4"
            @input="updateVisualizations"
          >
          <div class="year-display">{{ currentYear }}</div>
        </div>
        
        <div class="country-selector">
          <label for="countrySelect">对比国家(Ctrl+点击 多选):</label>
          <select 
            id="countrySelect" 
            v-model="selectedCountries" 
            multiple
            @change="updateVisualizations"
          >
            <option v-for="country in countries" :key="country" :value="country">
              {{ country }}
            </option>
          </select>
        </div>
        
        <div class="view-buttons">
          <button 
            v-for="view in views" 
            :key="view.id" 
            :class="{ active: currentView === view.id }"
            @click="currentView = view.id"
          >
            {{ view.name }}
          </button>
        </div>
      </div>

      <div class="visualization-area">
        <div v-show="currentView === 'geo'" class="visualization-container">
          <GeoMap 
            :year="currentYear" 
            :data="processedData.medalDataByYear[currentYear] || {}"
            :selectedCountries="selectedCountries"
            @country-selected="handleCountrySelection"
          />
        </div>
        
        <div v-show="currentView === 'sankey'" class="visualization-container">
          <SankeyChart 
            :year="currentYear" 
            :data="processedData"
            :selectedCountries="selectedCountries"
          />
        </div>
        
        <div v-show="currentView === 'radar'" class="visualization-container">
          <RadarChart 
            :year="currentYear" 
            :data="processedData"
            :selectedCountries="selectedCountries"
          />
        </div>
        
        <div class="secondary-visualizations">
          <div class="medal-bar-container">
            <MedalBar 
              :year="currentYear" 
              :data="processedData.medalDataByYear[currentYear] || {}"
              :selectedCountries="selectedCountries"
            />
          </div>
          
          <div class="timeline-container">
            <TimeLine 
              :year="currentYear" 
              :selectedCountries="selectedCountries"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';
import { processOlympicData } from './utils/dataProcessor';
import GeoMap from './components/GeoMap.vue';
import SankeyChart from './components/SankeyChart.vue';
import RadarChart from './components/RadarChart.vue';
import TimeLine from './components/TimeLine.vue';
import MedalBar from './components/MedalBar.vue';

export default {
  components: {
    GeoMap,
    SankeyChart,
    RadarChart,
    TimeLine,
    MedalBar
  },
  setup() {
    console.log('🔧 App组件setup执行'); 
    const currentYear = ref(2000);
    const yearRange = ref([1896, 2016]);
    const selectedCountries = ref(['United States', 'China', 'Russia']);
    const currentView = ref('geo');
    const processedData = ref({
      medalDataByYear: {}, // 确保这个对象存在
      totalMedals: {},
      sportStats: {},
      historicalChanges: {},
      countries: []}
    );
    const countries = ref([]);
    
    const isLoading = ref(true);
    
    // 过滤掉战争年份
    const validOlympicYears = Array.from({length: (2016-1896)/4 + 1}, (_, i) => 1896 + i*4)
      .filter(year => ![1916, 1940, 1944].includes(year));
    const views = [
      { id: 'geo', name: '地理视图' },
      { id: 'sankey', name: '国家变迁' },
      { id: 'radar', name: '优势项目' }
    ];

    // 加载数据
    const loadData = async () => {
      try {
        isLoading.value = true;
        console.log('开始加载数据...');
        
        const [athleteRes, regionRes] = await Promise.all([
          axios.get('./data/athlete_events.json').catch(e => {
            console.error('运动员数据加载失败:', e);
            return { data: [] };
          }),
          axios.get('./data/noc_regions.json').catch(e => {
            console.error('地区数据加载失败:', e);
            return { data: [] };
          })
        ]);

        console.log('运动员数据长度:', athleteRes.data.length);
        console.log('地区数据长度:', regionRes.data.length);

        if (!athleteRes.data.length || !regionRes.data.length) {
          throw new Error('数据为空');
        }

        processedData.value = processOlympicData(athleteRes.data, regionRes.data);
        countries.value = processedData.value.countries;

        console.log('处理后的数据:', {
          years: Object.keys(processedData.value.medalDataByYear),
          countries: countries.value,
          sampleData: processedData.value.medalDataByYear[2000]
        });

        // 设置默认国家
        updateDefaultCountries();
        
      } catch (error) {
        console.error('数据加载失败:', error);
        // 设置回退数据
        processedData.value = {
          medalDataByYear: { 
            2000: { 
              'United States': { Gold: 10, Silver: 5, Bronze: 3 },
              'China': { Gold: 8, Silver: 6, Bronze: 4 }
            } 
          },
          countries: ['United States', 'China']
        };
        countries.value = processedData.value.countries;
      } finally {
        isLoading.value = false;
      }
    };

    const updateDefaultCountries = () => {
      const currentYearData = processedData.value.medalDataByYear[currentYear.value] || {};
      const topCountries = Object.entries(currentYearData)
        .sort((a, b) => (b[1].Gold * 3 + b[1].Silver * 2 + b[1].Bronze) - 
                      (a[1].Gold * 3 + a[1].Silver * 2 + a[1].Bronze))
        .slice(0, 3)
        .map(item => item[0]);
      
      selectedCountries.value = topCountries.length > 0 ? topCountries : ['United States', 'China'];
    };

    // 更新所有可视化
    const updateVisualizations = () => {
      // 确保年份是数字类型
      currentYear.value = Number(currentYear.value);
      
      // 确保年份是有效的奥运年份
      if(!validOlympicYears.includes(currentYear.value)) {
        // 找到最接近的有效年份
        const closestYear = validOlympicYears.reduce((prev, curr) => 
          Math.abs(curr - currentYear.value) < Math.abs(prev - currentYear.value) ? curr : prev
        );
        currentYear.value = closestYear;
      }
      
      // 限制最多选择5个国家
      if(selectedCountries.value.length > 5) {
        selectedCountries.value = selectedCountries.value.slice(0, 5);
      }
      
      // 如果当前没有选中国家，选择奖牌前三的国家
      if(selectedCountries.value.length === 0) {
        const currentYearData = processedData.value.medalDataByYear[currentYear.value] || {};
        const topCountries = Object.entries(currentYearData)
          .sort((a, b) => (b[1].Gold * 3 + b[1].Silver * 2 + b[1].Bronze) - 
                         (a[1].Gold * 3 + a[1].Silver * 2 + a[1].Bronze))
          .slice(0, 3)
          .map(item => item[0]);
        
        if(topCountries.length > 0) {
          selectedCountries.value = topCountries;
        }
      }
    };


    // 处理国家选择
    const handleCountrySelection = (country) => {
      console.log('国家选择:', country);
      
      // 如果国家已经在选中列表中，则不做任何操作
      if (selectedCountries.value.includes(country)) {
        return;
      }
      
      // 如果选中国家数量未达到上限(5个)，直接添加
      if (selectedCountries.value.length < 5) {
        selectedCountries.value = [...selectedCountries.value, country];
      } 
      // 如果已经达到上限，替换最后一个国家
      else {
        selectedCountries.value = [...selectedCountries.value.slice(1), country];
      }
      
      updateVisualizations();
    };
    onMounted(() => {
      console.log('🚀 App组件已挂载');
      loadData();
    });

    return {
      currentYear,
      yearRange,
      selectedCountries,
      currentView,
      processedData,
      countries,
      views,
      isLoading,
      updateVisualizations,
      handleCountrySelection
    };
  }
};
</script>

<style>
/* 全局样式 */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --accent-color: #e74c3c;
  --background-color: #f5f7fa;
  --text-color: #2c3e50;
  --border-color: #dfe6e9;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.app-header h1 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
}

.control-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.visualization-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.visualization-container {
  height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.secondary-visualizations {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.medal-bar-container, .timeline-container {
  height: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.time-control {
  margin-bottom: 20px;
}

.time-control input[type="range"] {
  width: 100%;
  margin-top: 10px;
}

.year-display {
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 5px;
  color: var(--primary-color);
}

.country-selector {
  margin-bottom: 20px;
}

.country-selector select {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.view-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.view-buttons button {
  padding: 10px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-buttons button:hover {
  background: var(--primary-color);
  color: white;
}

.view-buttons button.active {
  background: var(--primary-color);
  color: white;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  gap: 15px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1.2em;
  color: var(--text-color);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>