const https = require('https');

// 环境变量
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ECONOMIC_GIST_ID = process.env.ECONOMIC_GIST_ID;

if (!GITHUB_TOKEN || !ECONOMIC_GIST_ID) {
  console.error('缺少必要的环境变量: GITHUB_TOKEN 或 ECONOMIC_GIST_ID');
  process.exit(1);
}

/**
 * 发起 HTTPS 请求
 */
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve(jsonData);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 获取中国经济数据
 * 
 * ⚠️ 重要提示：当前使用模拟数据！
 * 
 * 真实数据源建议：
 * - M2 货币供应量：中国人民银行官网 API
 * - DR007 利率：中国货币网 API
 * - 社会融资规模：央行统计数据
 * - USD/CNY 汇率：外汇管理局或金融数据提供商
 * 
 * 需要替换为真实数据源的 API 调用
 */
async function fetchChinaEconomicData() {
  console.log('⚠️ 警告：正在使用模拟数据，非真实经济数据！');
  console.log('获取中国经济数据...');
  
  // 🚨 这里是模拟数据，需要替换为真实数据源
  const now = new Date();
  const data = {
    m2: [],
    dr007: [],
    socialFinancing: [],
    usdCny: [],
    lastUpdated: now.toISOString(),
    dataSource: 'MOCK_DATA', // 标记为模拟数据
    warning: '当前使用模拟数据，请接入真实数据源'
  };

  // 生成过去12个月的模拟数据
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dateStr = date.toISOString().split('T')[0];
    
    // M2 货币供应量 (万亿元)
    data.m2.push({
      date: dateStr,
      value: 250 + Math.random() * 20 - 10 // 240-260 万亿元范围
    });
    
    // DR007 利率 (%)
    data.dr007.push({
      date: dateStr,
      value: 2.0 + Math.random() * 0.5 - 0.25 // 1.75-2.25% 范围
    });
    
    // 社会融资规模 (万亿元)
    data.socialFinancing.push({
      date: dateStr,
      value: 320 + Math.random() * 30 - 15 // 305-335 万亿元范围
    });
    
    // USD/CNY 汇率
    data.usdCny.push({
      date: dateStr,
      value: 7.2 + Math.random() * 0.4 - 0.2 // 7.0-7.4 范围
    });
  }

  return data;
}

/**
 * 更新 Gist 中的中国经济数据
 */
async function updateChinaEconomicDataGist(data) {
  console.log('更新中国经济数据到 Gist...');
  
  const options = {
    hostname: 'api.github.com',
    path: `/gists/${ECONOMIC_GIST_ID}`,
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'China-Economic-Data-Updater',
      'Content-Type': 'application/json'
    }
  };

  const gistData = {
    files: {
      'china-economic-data.json': {
        content: JSON.stringify(data, null, 2)
      }
    }
  };

  try {
    const result = await httpsRequest(options, gistData);
    console.log('中国经济数据更新成功');
    return result;
  } catch (error) {
    console.error('更新中国经济数据失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始更新中国经济数据...');
    
    // 获取中国经济数据
    const data = await fetchChinaEconomicData();
    
    // 更新到 Gist
    await updateChinaEconomicDataGist(data);
    
    console.log('中国经济数据更新完成');
    console.log('🚨 重要提醒：当前使用的是模拟数据！');
    console.log('📋 需要接入以下真实数据源：');
    console.log('   - M2 货币供应量：中国人民银行');
    console.log('   - DR007 利率：中国货币网');
    console.log('   - 社会融资规模：央行统计');
    console.log('   - USD/CNY 汇率：外汇管理局');
  } catch (error) {
    console.error('更新中国经济数据时出错:', error);
    process.exit(1);
  }
}

// 运行主函数
main();