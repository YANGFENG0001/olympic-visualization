export function processOlympicData(athleteData = [], regionData = []) {
  // 1. 合并国家地区数据
  const nocMap = new Map();
  (regionData || []).forEach(item => {
    if (item && item.NOC && item.region) {
      nocMap.set(item.NOC, item.region);
    }
  });

  // 2. 按年份和国家统计奖牌
  const yearRange = [1896, 2016];
  const medalDataByYear = {};
  const sportPerformanceByYear = {}; // 新增：存储每年每项目的实力得分
  
  // 确保有有效数据
  const validAthleteData = (athleteData || []).filter(item => 
    item && item.Year && item.Medal && item.Medal !== 'NA'
  );

  for (let year = yearRange[0]; year <= yearRange[1]; year += 4) {
    if (year === 1916 || year === 1940 || year === 1944) continue;
    
    const yearData = validAthleteData.filter(item => 
      parseInt(item.Year) === year
    );
    
    const medalCount = {};
    const sportPerformance = {}; // 新增：存储当前年份的项目实力
    
    yearData.forEach(athlete => {
      const country = nocMap.get(athlete.NOC) || athlete.Team;
      const sport = athlete.Sport;
      const event = athlete.Event;
      if (!country || !sport || !event) return;
      
      // 统计国家奖牌
      if (!medalCount[country]) {
        medalCount[country] = { Gold: 0, Silver: 0, Bronze: 0 };
      }
      medalCount[country][athlete.Medal]++;
      
      // 新增：统计项目实力
      if (!sportPerformance[country]) {
        sportPerformance[country] = {};
      }
      if (!sportPerformance[country][sport]) {
        sportPerformance[country][sport] = { Gold: 0, Silver: 0, Bronze: 0, Score: 0 };
      }
      sportPerformance[country][sport][athlete.Medal]++;
    });
    
    if (Object.keys(medalCount).length > 0) {
      medalDataByYear[year] = medalCount;
    }
    
    // 新增：计算项目实力得分
    Object.keys(sportPerformance).forEach(country => {
      Object.keys(sportPerformance[country]).forEach(sport => {
        const medals = sportPerformance[country][sport];
        // 计算得分规则：金牌3分，银牌2分，铜牌1分
        medals.Score = medals.Gold * 3 + medals.Silver * 2 + medals.Bronze * 1;
      });
    });
    
    sportPerformanceByYear[year] = sportPerformance;
  }

  // 3. 计算国家总奖牌数
  const totalMedals = {};
  validAthleteData.forEach(athlete => {
    const country = nocMap.get(athlete.NOC) || athlete.Team;
    if (!country) return;
    
    if (!totalMedals[country]) {
      totalMedals[country] = { Gold: 0, Silver: 0, Bronze: 0, Total: 0 };
    }
    totalMedals[country][athlete.Medal]++;
    totalMedals[country].Total++;
  });

  // 4. 按运动项目统计
  const sportStats = {};
  validAthleteData.forEach(athlete => {
    const sport = athlete.Sport;
    if (!sport) return;
    
    if (!sportStats[sport]) {
      sportStats[sport] = { Gold: 0, Silver: 0, Bronze: 0, Countries: new Set() };
    }
    sportStats[sport][athlete.Medal]++;
    sportStats[sport].Countries.add(nocMap.get(athlete.NOC) || athlete.Team);
  });

  // 5. 处理国家变迁数据
  const historicalChanges = {
    'Soviet Union': ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Uzbekistan', 'Georgia', 'Azerbaijan', 'Lithuania', 'Moldova', 'Latvia', 'Kyrgyzstan', 'Armenia', 'Turkmenistan', 'Estonia', 'Tajikistan'],
    'Yugoslavia': ['Serbia', 'Croatia', 'Slovenia', 'Bosnia and Herzegovina', 'North Macedonia', 'Montenegro'],
    'Czechoslovakia': ['Czech Republic', 'Slovakia']
  };

  // 获取所有国家列表
  const countries = Array.from(
    new Set([
      ...validAthleteData.map(item => nocMap.get(item.NOC) || item.Team),
      ...Object.keys(totalMedals)
    ])
  ).filter(Boolean).sort();

  return {
    medalDataByYear,
    totalMedals,
    sportStats,
    historicalChanges,
    countries,
    sportPerformanceByYear, // 新增：返回项目实力得分数据
    // 新增：计算国家在各项目的总实力得分
    countrySportPerformance: calculateCountrySportPerformance(sportPerformanceByYear)
  };
}

// 新增辅助函数：计算国家在各项目的总实力得分
function calculateCountrySportPerformance(sportPerformanceByYear) {
  const result = {};
  
  Object.values(sportPerformanceByYear).forEach(yearData => {
    Object.entries(yearData).forEach(([country, sports]) => {
      if (!result[country]) {
        result[country] = {};
      }
      
      Object.entries(sports).forEach(([sport, performance]) => {
        if (!result[country][sport]) {
          result[country][sport] = {
            Gold: 0,
            Silver: 0,
            Bronze: 0,
            Score: 0,
            ParticipationYears: 0
          };
        }
        
        result[country][sport].Gold += performance.Gold;
        result[country][sport].Silver += performance.Silver;
        result[country][sport].Bronze += performance.Bronze;
        result[country][sport].Score += performance.Score;
        result[country][sport].ParticipationYears += 1;
      });
    });
  });
  
  // 计算平均得分
  Object.values(result).forEach(country => {
    Object.values(country).forEach(sport => {
      sport.AverageScore = sport.ParticipationYears > 0 
        ? sport.Score / sport.ParticipationYears 
        : 0;
    });
  });
  
  return result;
}