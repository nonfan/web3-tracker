# GitHub Actions 自动更新经济数据指南

## 📋 目录

1. [前置准备](#前置准备)
2. [配置步骤](#配置步骤)
3. [验证配置](#验证配置)
4. [常见问题](#常见问题)

---

## 前置准备

### 1. 申请 FRED API Key（免费）

1. 访问 [FRED API 注册页面](https://fred.stlouisfed.org/docs/api/api_key.html)
2. 点击 "Request API Key"
3. 填写信息：
   - Email: 你的邮箱
   - Name: 你的名字
   - Organization: 个人项目
   - Purpose: Personal research/education
4. 提交后会立即收到 API Key（格式：`abcd1234efgh5678ijkl9012mnop3456`）

### 2. 创建经济数据 Gist

1. 访问 [GitHub Gist](https://gist.github.com/)
2. 点击 "+" 创建新 Gist
3. 文件名：`economic-data.json`
4. 内容：
```json
{
  "lastUpdate": "2024-01-01T00:00:00Z",
  "data": {
    "fedRate": [],
    "inflation": [],
    "unemployment": []
  }
}
```
5. 点击 "Create public gist"
6. **记录 Gist ID**（URL 中的字符串，如：`https://gist.github.com/username/abc123def456` 中的 `abc123def456`）

### 3. 创建 GitHub Personal Access Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 配置：
   - Note: `FRED Data Update`
   - Expiration: `No expiration` 或选择时长
   - Scopes: **只勾选 `gist`**
4. 点击 "Generate token"
5. **立即复制 token**（只显示一次！格式：`ghp_xxxxxxxxxxxx`）

---

## 配置步骤

### 步骤 1: 配置 GitHub Secrets

在你的 GitHub 仓库中：

1. 进入 `Settings` > `Secrets and variables` > `Actions`
2. 点击 "New repository secret"
3. 添加以下 3 个 secrets：

#### Secret 1: FRED_API_KEY
```
Name: FRED_API_KEY
Value: 你的 FRED API Key（如：abcd1234efgh5678ijkl9012mnop3456）
```

#### Secret 2: GIST_ID
```
Name: GIST_ID
Value: 你的经济数据 Gist ID（如：abc123def456）
```

#### Secret 3: GIST_TOKEN
```
Name: GIST_TOKEN
Value: 你的 GitHub Personal Access Token（如：ghp_xxxxxxxxxxxx）
```

### 步骤 2: 确认 GitHub Actions 文件

确认 `.github/workflows/update-economic-data.yml` 文件存在（已包含在项目中）。

文件内容：
```yaml
name: Update Economic Data

on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00 运行
  workflow_dispatch:      # 允许手动触发

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install node-fetch

      - name: Update economic data
        env:
          FRED_API_KEY: ${{ secrets.FRED_API_KEY }}
          GIST_ID: ${{ secrets.GIST_ID }}
          GIST_TOKEN: ${{ secrets.GIST_TOKEN }}
        run: node scripts/update-economic-data.js
```

### 步骤 3: 手动触发首次更新

1. 进入 GitHub 仓库的 `Actions` 标签
2. 在左侧选择 "Update Economic Data" workflow
3. 点击右侧的 "Run workflow" 按钮
4. 选择分支（通常是 `main`）
5. 点击绿色的 "Run workflow" 按钮
6. 等待运行完成（约 30-60 秒）

### 步骤 4: 在应用中配置 Gist

1. 打开你的应用
2. 进入 `Economy` 页面
3. 点击 "数据源配置" 标签
4. 点击 "搜索经济数据 Gist" 按钮
5. 从列表中选择你创建的 Gist
6. 填写 GitHub 用户名
7. 点击 "保存配置"
8. 刷新页面

---

## 验证配置

### 1. 检查 GitHub Actions 运行状态

1. 进入 `Actions` 标签
2. 查看最近的运行记录
3. 点击进入查看详细日志

**成功的标志：**
```
✓ Fetched Fed Rate data: 13 points
✓ Fetched Inflation data: 13 points
✓ Fetched Unemployment data: 8 points
✓ Successfully updated Gist: abc123def456
```

**失败的标志：**
```
✗ Error: Invalid FRED API key
✗ Error: Failed to update Gist
```

### 2. 检查 Gist 数据

1. 访问你的 Gist 页面
2. 查看 `economic-data.json` 文件
3. 确认数据已更新：
   - `lastUpdate` 是最新时间
   - `data.fedRate` 有数据
   - `data.inflation` 有数据
   - `data.unemployment` 有数据

### 3. 检查应用显示

1. 打开应用的 Economy 页面
2. 打开浏览器控制台（F12）
3. 刷新页面
4. 查看日志：

**成功的标志：**
```
✅ Using Gist data (updated 0 days ago)
```

**失败的标志：**
```
📊 Economic Gist not configured, using local data
```

---

## 常见问题

### Q1: Actions 运行失败，提示 "Invalid FRED API key"

**原因：** FRED API Key 配置错误

**解决：**
1. 检查 Secret `FRED_API_KEY` 是否正确
2. 确认 API Key 没有多余的空格
3. 重新申请 API Key

### Q2: Actions 运行失败，提示 "Failed to update Gist"

**原因：** GitHub Token 权限不足或 Gist ID 错误

**解决：**
1. 检查 Token 是否勾选了 `gist` 权限
2. 确认 `GIST_ID` 是正确的
3. 确认 Gist 是 public 的

### Q3: Actions 运行成功，但应用显示本地数据

**原因：** 应用中未配置 Gist

**解决：**
1. 进入 Economy 页面 → 数据源配置
2. 搜索并选择 Gist
3. 保存配置并刷新页面

### Q4: 如何修改更新频率？

编辑 `.github/workflows/update-economic-data.yml`：

```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # 每 6 小时运行一次
    # - cron: '0 0 * * *'  # 每天运行一次（默认）
    # - cron: '0 0 * * 0'  # 每周日运行一次
```

### Q5: 如何查看详细日志？

1. 进入 `Actions` 标签
2. 点击具体的运行记录
3. 点击 "Update economic data" 步骤
4. 查看完整输出

### Q6: Token 过期了怎么办？

1. 重新生成 Personal Access Token
2. 更新 Secret `GIST_TOKEN`
3. 重新运行 workflow

### Q7: 数据多久更新一次？

- **GitHub Actions**: 每天自动运行一次
- **FRED 官方数据**: 通常每月发布，有 1-2 个月延迟
- **加密货币数据**: 实时更新（CoinGecko API）

---

## 🎯 快速检查清单

配置完成后，确认以下所有项：

```
□ FRED API Key 已申请
□ 经济数据 Gist 已创建
□ GitHub Personal Access Token 已创建
□ 3 个 GitHub Secrets 已配置：
  □ FRED_API_KEY
  □ GIST_ID
  □ GIST_TOKEN
□ 手动触发 workflow 成功运行
□ Gist 数据已更新
□ 应用中已配置 Gist
□ 应用显示 Gist 数据
```

---

## 📚 相关文档

- [FRED API 文档](https://fred.stlouisfed.org/docs/api/fred/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Gist 文档](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists)
- [项目配置指南](./FRED_API_SETUP.md)
- [快速开始](./ECONOMIC_DATA_QUICK_START.md)

---

## 💡 提示

1. **保护你的 Secrets**: 永远不要在代码中硬编码 API Key 或 Token
2. **定期检查**: 每月检查一次 Actions 运行状态
3. **备份数据**: Gist 会保留历史版本，可以随时回滚
4. **监控配额**: FRED API 免费版有请求限制（通常足够使用）

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看 Actions 运行日志
2. 检查浏览器控制台日志
3. 参考常见问题部分
4. 查看相关文档

祝你配置顺利！🎉
