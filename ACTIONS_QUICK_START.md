# GitHub Actions 快速开始（5分钟配置）

## 🚀 三步配置自动更新

### 第一步：获取必要的凭证（3分钟）

#### 1. FRED API Key
- 访问：https://fred.stlouisfed.org/docs/api/api_key.html
- 点击 "Request API Key"
- 填写信息并提交
- 复制 API Key（格式：`abcd1234...`）

#### 2. 创建 Gist
- 访问：https://gist.github.com/
- 文件名：`economic-data.json`
- 内容：
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
- 创建后复制 Gist ID（URL 中的字符串）

#### 3. GitHub Token
- 访问：https://github.com/settings/tokens
- "Generate new token (classic)"
- 只勾选 `gist` 权限
- 复制 Token（格式：`ghp_xxxx...`）

---

### 第二步：配置 GitHub Secrets（1分钟）

在你的 GitHub 仓库：

1. `Settings` > `Secrets and variables` > `Actions`
2. 添加 3 个 secrets：

```
FRED_API_KEY = 你的 FRED API Key
GIST_ID = 你的 Gist ID  
GIST_TOKEN = 你的 GitHub Token
```

**⚠️ 重要提示**:
- 直接从 FRED 网站复制 API Key
- 不要从文本编辑器复制（可能包含隐藏字符）
- 粘贴后不要按回车键，直接点击 "Add secret"

**🧪 可选：本地测试 API Key**
```bash
# Windows
set FRED_API_KEY=your_key && node scripts/test-fred-api.js

# Linux/Mac
FRED_API_KEY=your_key node scripts/test-fred-api.js
```

---

### 第三步：运行并验证（1分钟）

#### 手动触发更新

1. 进入仓库的 `Actions` 标签
2. 选择 "Update Economic Data"
3. 点击 "Run workflow"
4. 等待完成（约 30 秒）

#### 在应用中配置

1. 打开应用 → Economy 页面
2. 数据源配置 → 搜索经济数据 Gist
3. 选择你的 Gist → 保存
4. 刷新页面

---

## ✅ 验证成功

### Actions 日志显示：
```
✓ Fetched Fed Rate data: 13 points
✓ Fetched Inflation data: 13 points  
✓ Fetched Unemployment data: 8 points
✓ Successfully updated Gist
```

### 应用控制台显示：
```
✅ Using Gist data (updated 0 days ago)
```

---

## 🔄 自动更新

配置完成后，系统会：
- ✅ 每天自动运行一次
- ✅ 自动获取最新经济数据
- ✅ 自动更新到 Gist
- ✅ 应用自动读取最新数据

---

## ❌ 常见错误

### "FRED API error: 400"
**最常见原因**: API Key 格式错误或无效

**解决方案**:
1. 确保 API Key 是 32 位十六进制字符串
2. 检查复制时是否有多余空格或换行符
3. 删除并重新添加 `FRED_API_KEY` Secret
4. 等待 5-10 分钟让新 API Key 激活

**快速测试**:
```bash
# 在浏览器中测试（替换 YOUR_API_KEY）
https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=YOUR_API_KEY&file_type=json&limit=1
```

详细排查: [FRED_API_TROUBLESHOOTING.md](./FRED_API_TROUBLESHOOTING.md)

### "Invalid FRED API key"
→ 检查 `FRED_API_KEY` Secret 是否正确

### "Failed to update Gist"  
→ 检查 Token 是否有 `gist` 权限

### 应用显示本地数据
→ 在应用中配置 Gist ID

---

## 📖 详细文档

需要更多帮助？查看：
- [完整配置指南](./GITHUB_ACTIONS_GUIDE.md)
- [FRED API 排查指南](./FRED_API_TROUBLESHOOTING.md) ⭐ 400 错误必看
- [FRED API 设置](./FRED_API_SETUP.md)
- [数据准确性说明](./DATA_ACCURACY_NOTICE.md)

---

就这么简单！🎉


---

## 💡 数据说明

### 通胀率计算

FRED 返回的是 CPI 指数值（如 325.031），脚本会自动计算同比通胀率：

```
通胀率 = ((当前CPI - 12个月前CPI) / 12个月前CPI) × 100%
```

例如：2025年11月的 CPI 325.031 相比 2024年11月的 316.45，通胀率约为 2.71%。

### 数据更新

- 每天自动运行一次
- 获取最近 5 年的历史数据
- 自动计算通胀率并保存到 Gist
