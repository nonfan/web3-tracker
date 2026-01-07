# FRED API 400 错误排查指南

## 问题描述
GitHub Actions 运行 `update-economic-data.js` 时，所有 FRED API 请求返回 400 错误。

**✅ 已确认**: 你的 API Key 是有效的（手动测试成功），问题出在 GitHub Secrets 配置上。

## 解决方案（按优先级排序）

### 🔥 方案 1: 重新配置 GitHub Secret（最可能解决）

**问题**: GitHub Secrets 中的 API Key 可能包含隐藏的空格、换行符或其他不可见字符。

**步骤**:
1. 进入仓库 `Settings` → `Secrets and variables` → `Actions`
2. 找到 `FRED_API_KEY`，点击删除
3. 点击 `New repository secret`
4. Name: `FRED_API_KEY`
5. Secret: **直接从 FRED 网站复制 API Key**
   - ⚠️ 不要从文本编辑器复制
   - ⚠️ 确保没有选中多余的空格
   - ⚠️ 粘贴后不要按回车键
6. 点击 `Add secret`
7. 立即重新运行 Actions

### 🔧 方案 2: 使用更新后的脚本

**改进**: 脚本现在会自动清理环境变量中的空格和换行符

```javascript
// 已更新
const FRED_API_KEY = process.env.FRED_API_KEY?.trim()
```

**操作**: 
- 提交最新的 `scripts/update-economic-data.js`
- 重新运行 Actions

### 📋 方案 3: 验证 Secret 内容

在 GitHub Actions 中添加调试步骤（临时使用）:

```yaml
- name: Debug API Key
  run: |
    echo "API Key length: ${#FRED_API_KEY}"
    echo "First 4 chars: ${FRED_API_KEY:0:4}"
    echo "Last 4 chars: ${FRED_API_KEY: -4}"
  env:
    FRED_API_KEY: ${{ secrets.FRED_API_KEY }}
```

⚠️ 运行后立即删除此步骤，不要暴露 API Key 的任何部分。

## 常见原因和解决方案

### 1. GitHub Secret 配置问题 ⭐ 最常见（已确认你的情况）

**症状**: API Key 手动测试有效，但在 Actions 中返回 400 错误

**原因**: 
- GitHub Secret 中包含隐藏的空格、换行符或特殊字符
- 复制粘贴时意外包含了额外字符
- 从文本编辑器复制时带入了格式字符

**解决方案**:
1. **删除现有的 Secret**
   - Settings → Secrets and variables → Actions
   - 删除 `FRED_API_KEY`

2. **重新添加 Secret**
   - 直接从 FRED 网站复制 API Key
   - 不要从文本编辑器或其他地方复制
   - 粘贴到 Secret 输入框后，不要按回车
   - 立即点击 "Add secret"

3. **使用更新后的脚本**
   - 新脚本会自动清理空格和换行符
   - 提交并推送最新代码
   - 重新运行 Actions

### 2. API Key 格式错误

**症状**: 所有请求都返回 400 错误

**原因**: 
- FRED API Key 必须是 **32 位十六进制字符串**
- 格式示例: `abcdef1234567890abcdef1234567890`
- 不能包含空格、换行符或其他特殊字符

**检查方法**:
```bash
# 在 GitHub Actions 中添加调试步骤
- name: Check API Key Format
  run: |
    echo "API Key length: ${#FRED_API_KEY}"
    echo "First 4 chars: ${FRED_API_KEY:0:4}"
    echo "Last 4 chars: ${FRED_API_KEY: -4}"
```

**解决方案**:
1. 登录 FRED 网站: https://fred.stlouisfed.org/
2. 进入 API Keys 页面: https://fred.stlouisfed.org/docs/api/api_key.html
3. 复制完整的 32 位 API Key（不要包含空格）
4. 在 GitHub 仓库设置中更新 `FRED_API_KEY` Secret
5. 确保粘贴时没有多余的空格或换行符

### 2. API Key 未激活或已过期

**症状**: 400 或 403 错误

**原因**: 
- 新申请的 API Key 需要几分钟才能激活
- API Key 可能已被撤销或过期

**解决方案**:
1. 访问 FRED API Keys 管理页面
2. 检查 API Key 状态是否为 "Active"
3. 如果已过期，生成新的 API Key
4. 等待 5-10 分钟后再次尝试

### 3. 请求参数错误

**症状**: 特定系列返回 400 错误

**原因**: 
- 系列 ID 不存在或拼写错误
- 日期范围无效

**当前使用的系列 ID**:
- `FEDFUNDS` - 联邦基金利率
- `CPIAUCSL` - 消费者物价指数
- `UNRATE` - 失业率

**验证方法**:
在浏览器中测试 API（替换 YOUR_API_KEY）:
```
https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=YOUR_API_KEY&file_type=json
```

### 4. 网络或防火墙问题

**症状**: 间歇性 400 或超时错误

**原因**: 
- GitHub Actions 网络限制
- FRED API 服务器临时不可用

**解决方案**:
添加重试机制（已在脚本中实现）

## 调试步骤

### 步骤 1: 验证 API Key

在本地测试（不要提交真实的 API Key）:

```bash
# Windows (PowerShell)
$env:FRED_API_KEY="your_api_key_here"
$env:GIST_TOKEN="your_token_here"
$env:GIST_ID="your_gist_id_here"
node scripts/update-economic-data.js

# Linux/Mac
export FRED_API_KEY="your_api_key_here"
export GIST_TOKEN="your_token_here"
export GIST_ID="your_gist_id_here"
node scripts/update-economic-data.js
```

### 步骤 2: 查看详细错误信息

更新后的脚本会显示:
- 完整的请求 URL（隐藏 API Key）
- HTTP 响应状态码
- FRED API 错误消息（如果有）

### 步骤 3: 手动测试 API

使用 curl 或浏览器测试:

```bash
# 测试 API Key 是否有效
curl "https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=YOUR_API_KEY&file_type=json&limit=1"
```

预期响应:
```json
{
  "realtime_start": "2026-01-07",
  "realtime_end": "2026-01-07",
  "observations": [...]
}
```

错误响应示例:
```json
{
  "error_code": 400,
  "error_message": "Bad Request. The value for variable api_key is not registered."
}
```

## 更新后的脚本改进

新版本 `update-economic-data.js` 包含:

1. **详细的错误日志**
   - 显示请求 URL（隐藏 API Key）
   - 显示 HTTP 状态码
   - 显示 FRED API 错误消息

2. **API Key 格式验证**
   - 检查长度是否为 32 位
   - 检查是否为十六进制字符串
   - 显示警告信息

3. **更好的错误处理**
   - 捕获并显示完整的错误响应
   - 区分不同类型的错误

## 下一步操作

1. **检查 GitHub Secrets**
   - 进入仓库 Settings → Secrets and variables → Actions
   - 确认 `FRED_API_KEY` 已正确设置
   - 删除并重新添加 Secret（确保没有多余空格）

2. **手动触发 Actions**
   - 进入 Actions 标签页
   - 选择 "Update Economic Data" workflow
   - 点击 "Run workflow"
   - 查看详细日志

3. **查看日志输出**
   - 检查 API Key 长度警告
   - 查看完整的错误响应
   - 确认请求 URL 格式正确

## 参考资源

- [FRED API 文档](https://fred.stlouisfed.org/docs/api/fred/)
- [申请 API Key](https://fred.stlouisfed.org/docs/api/api_key.html)
- [API 使用限制](https://fred.stlouisfed.org/docs/api/fred/rate_limits.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## 常见问题

**Q: API Key 在本地可以用，但在 GitHub Actions 中失败？**

A: 检查 GitHub Secret 是否正确设置，确保没有多余的空格或换行符。

**Q: 错误信息显示 "api_key is not registered"？**

A: API Key 无效或未激活，需要重新申请或等待激活。

**Q: 所有系列都返回 400 错误？**

A: 99% 是 API Key 问题，检查格式和有效性。

**Q: 只有某个系列返回错误？**

A: 检查系列 ID 是否正确，或该系列是否已停止更新。
