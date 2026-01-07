# FRED API 自动数据更新设置指南

本项目使用 GitHub Actions 自动从 FRED (Federal Reserve Economic Data) 获取经济数据并存储到 GitHub Gist。

## 📋 前置要求

1. GitHub 账号
2. FRED API Key（免费）
3. GitHub Personal Access Token

## 🔑 步骤 1: 获取 FRED API Key

1. 访问 [FRED API Key 申请页面](https://fred.stlouisfed.org/docs/api/api_key.html)
2. 点击 "Request API Key"
3. 填写申请表单（需要 FRED 账号，免费注册）
4. 获得 API Key（格式类似：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`）

**API 限制：**
- 免费账号：每天 120 次请求
- 对于每天一次的自动更新完全足够

## 📝 步骤 2: 创建 GitHub Gist

1. 访问 [GitHub Gist](https://gist.github.com/)
2. 创建新 Gist：
   - 文件名：`economic-data.json`
   - 内容：`{}`
   - 选择 "Create public gist" 或 "Create secret gist"
3. 记录 Gist ID（URL 中的字符串）
   - 例如：`https://gist.github.com/username/abc123def456` 
   - Gist ID 就是：`abc123def456`

## 🔐 步骤 3: 创建 GitHub Personal Access Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 设置：
   - Note: `Gist Update Token`
   - Expiration: 选择有效期
   - Scopes: 勾选 `gist`
4. 生成并复制 Token（只显示一次！）

## ⚙️ 步骤 4: 配置 GitHub Secrets

在你的 GitHub 仓库中：

1. 进入 `Settings` > `Secrets and variables` > `Actions`
2. 点击 "New repository secret"
3. 添加以下三个 secrets：

| Name | Value | 说明 |
|------|-------|------|
| `FRED_API_KEY` | 你的 FRED API Key | 从步骤1获取 |
| `GIST_ID` | 你的 Gist ID | 从步骤2获取 |
| `GIST_TOKEN` | 你的 GitHub Token | 从步骤3获取 |

## 🚀 步骤 5: 启用 GitHub Actions

1. 确保仓库中有以下文件：
   - `.github/workflows/update-economic-data.yml`
   - `scripts/update-economic-data.js`

2. 推送代码到 GitHub

3. 进入仓库的 `Actions` 标签页

4. 首次运行：
   - 点击 "Update Economic Data" workflow
   - 点击 "Run workflow"
   - 选择分支并运行

## 📊 数据说明

脚本会自动获取以下数据：

| 数据类型 | FRED Series ID | 说明 |
|---------|----------------|------|
| 联邦基金利率 | FEDFUNDS | 美联储基准利率 |
| CPI 通胀率 | CPIAUCSL | 消费者物价指数 |
| 失业率 | UNRATE | 美国失业率 |

**数据范围：** 最近5年的月度数据

**更新频率：** 每天 UTC 00:00（北京时间 08:00）

## 🔍 验证运行

1. 查看 GitHub Actions 运行日志
2. 检查 Gist 是否更新
3. Gist 数据格式：

```json
{
  "lastUpdate": "2026-01-07T12:00:00.000Z",
  "data": {
    "fedRate": [
      { "date": "2021-01", "value": 0.09 },
      { "date": "2021-02", "value": 0.08 }
    ],
    "inflation": [...],
    "unemployment": [...]
  }
}
```

## 🌐 在前端使用数据

在你的应用中读取 Gist 数据：

```typescript
// src/utils/economicDataApi.ts
const GIST_ID = 'your-gist-id'
const GIST_FILE = 'economic-data.json'

export async function fetchEconomicDataFromGist() {
  try {
    const response = await fetch(
      `https://gist.githubusercontent.com/username/${GIST_ID}/raw/${GIST_FILE}`
    )
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Failed to fetch from Gist:', error)
    return null
  }
}
```

## 🐛 故障排查

### Actions 运行失败

1. 检查 Secrets 是否正确配置
2. 查看 Actions 日志中的错误信息
3. 验证 FRED API Key 是否有效
4. 确认 Gist Token 权限是否正确

### API 限制

如果遇到 FRED API 限制：
- 免费账号每天 120 次请求
- 每次运行使用 3 次请求（3个数据系列）
- 每天运行一次完全足够

### 手动触发

如果需要立即更新数据：
1. 进入 Actions 标签页
2. 选择 "Update Economic Data"
3. 点击 "Run workflow"

## 📚 相关资源

- [FRED API 文档](https://fred.stlouisfed.org/docs/api/fred/)
- [FRED 数据系列搜索](https://fred.stlouisfed.org/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Gist API](https://docs.github.com/en/rest/gists)

## 💡 高级配置

### 修改运行频率

编辑 `.github/workflows/update-economic-data.yml`：

```yaml
on:
  schedule:
    # 每12小时运行一次
    - cron: '0 */12 * * *'
    # 每周一运行
    - cron: '0 0 * * 1'
```

### 添加更多数据系列

编辑 `scripts/update-economic-data.js`，在 `SERIES_IDS` 中添加：

```javascript
const SERIES_IDS = {
  fedRate: 'FEDFUNDS',
  inflation: 'CPIAUCSL',
  unemployment: 'UNRATE',
  gdp: 'GDP',              // GDP
  sp500: 'SP500',          // S&P 500
  treasury10y: 'DGS10'     // 10年期国债收益率
}
```

## ✅ 完成

设置完成后，系统会自动：
1. 每天从 FRED 获取最新经济数据
2. 更新到你的 GitHub Gist
3. 你的网页应用可以直接读取 Gist 数据
4. 无需服务器，完全免费！
