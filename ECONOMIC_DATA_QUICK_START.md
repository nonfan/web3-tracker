# 经济数据功能快速开始

## 🎯 功能概述

本应用集成了实时经济数据展示功能，数据来源于 FRED (Federal Reserve Economic Data)，通过 GitHub Actions 自动更新。

## 📊 数据内容

- **美联储基准利率** (Federal Funds Rate)
- **CPI 通胀率** (Consumer Price Index)
- **失业率** (Unemployment Rate)
- **加密货币市场数据** (Bitcoin, Ethereum)

## 🚀 两种使用方式

### 方式 1: 使用本地数据（默认）

无需任何配置，开箱即用！

- ✅ 无需注册账号
- ✅ 无需 API Key
- ✅ 立即可用
- ⚠️ 数据需要手动更新代码

### 方式 2: 使用 GitHub Gist 自动更新（推荐）

设置后可获取每日自动更新的最新数据。

**优势：**
- ✅ 数据每天自动更新
- ✅ 完全免费
- ✅ 无需服务器
- ✅ 官方权威数据源

## ⚡ 5分钟快速设置

### 步骤 1: 获取 FRED API Key

1. 访问 https://fred.stlouisfed.org/docs/api/api_key.html
2. 注册账号（免费）
3. 申请 API Key
4. 记录你的 API Key

### 步骤 2: Fork 本项目并设置 Secrets

1. Fork 本项目到你的 GitHub 账号
2. 进入你的仓库 Settings > Secrets and variables > Actions
3. 添加以下 Secrets：
   - `FRED_API_KEY`: 你的 FRED API Key
   - `GIST_TOKEN`: GitHub Personal Access Token (需要 gist 权限)
   - `GIST_ID`: 你的 Gist ID

### 步骤 3: 创建 Gist

1. 访问 https://gist.github.com/
2. 创建新 Gist：
   - 文件名：`economic-data.json`
   - 内容：`{}`
3. 记录 Gist ID（URL 中的字符串）

### 步骤 4: 运行 GitHub Actions

1. 进入你的仓库 Actions 标签页
2. 点击 "Update Economic Data"
3. 点击 "Run workflow"
4. 等待运行完成（约30秒）

### 步骤 5: 配置前端

1. 部署你的应用到 Vercel/Netlify
2. 打开应用，进入 Economy 页面
3. 点击 "数据源配置"
4. 输入你的 GitHub 用户名和 Gist ID
5. 点击 "保存并验证"

## ✅ 完成！

现在你的应用会自动从 Gist 读取最新数据，数据每天自动更新！

## 🔧 高级配置

### 修改更新频率

编辑 `.github/workflows/update-economic-data.yml`:

```yaml
on:
  schedule:
    # 每12小时运行一次
    - cron: '0 */12 * * *'
```

### 添加更多数据系列

编辑 `scripts/update-economic-data.js`，在 `SERIES_IDS` 中添加更多 FRED 系列。

浏览所有可用数据：https://fred.stlouisfed.org/

## 📚 详细文档

查看完整设置指南：[FRED_API_SETUP.md](./FRED_API_SETUP.md)

## ❓ 常见问题

**Q: 为什么要用 Gist 而不是直接调用 API？**

A: FRED API 不支持浏览器直接调用（CORS限制），通过 GitHub Actions + Gist 可以绕过这个限制，且完全免费。

**Q: 数据多久更新一次？**

A: 默认每天更新一次。FRED 官方数据通常有1-2个月的发布延迟。

**Q: 免费额度够用吗？**

A: 完全够用！FRED API 免费账号每天120次请求，我们每天只用3次。

**Q: 可以用于商业项目吗？**

A: 可以！FRED 数据是公开的，但请遵守 FRED 的使用条款。

## 🆘 需要帮助？

- 查看 [FRED_API_SETUP.md](./FRED_API_SETUP.md) 详细文档
- 提交 Issue: https://github.com/your-repo/issues
- FRED API 文档: https://fred.stlouisfed.org/docs/api/

## 🎉 享受使用！

现在你拥有了一个自动更新的经济数据仪表板！
