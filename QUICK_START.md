# 快速开始 - 组件优化和测试

## 🎯 目标

本次优化将大型组件拆分为小型、可复用的原子组件，并添加完整的单元测试。

## 📦 安装测试环境

### Windows 用户
```bash
setup-tests.bat
```

### Mac/Linux 用户
```bash
chmod +x setup-tests.sh
./setup-tests.sh
```

### 手动安装
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 运行测试 UI（推荐）
npm run test:ui

# 运行测试覆盖率
npm run test:coverage

# 监听模式
npm test -- --watch
```

## 📁 项目结构

```
src/
├── components/
│   ├── __tests__/              # 测试文件
│   │   ├── ProjectLogo.test.tsx
│   │   ├── ProjectStatus.test.tsx
│   │   ├── ProjectPriority.test.tsx
│   │   ├── ProjectDeadline.test.tsx
│   │   └── ProjectStats.test.tsx
│   ├── atoms/                  # 原子组件导出
│   │   └── index.ts
│   ├── ProjectLogo.tsx         # Logo 组件
│   ├── ProjectStatus.tsx       # 状态组件
│   ├── ProjectPriority.tsx     # 优先级组件
│   ├── ProjectDeadline.tsx     # 截止日期组件
│   └── ProjectStats.tsx        # 统计组件
└── test/
    └── setup.ts                # 测试环境配置
```

## 🎨 使用新组件

### 导入方式

```tsx
// 单独导入
import { ProjectLogo } from '@/components/ProjectLogo'
import { ProjectStatus } from '@/components/ProjectStatus'

// 批量导入（推荐）
import { 
  ProjectLogo, 
  ProjectStatus, 
  ProjectPriority,
  ProjectDeadline,
  ProjectStats 
} from '@/components/atoms'
```

### 基础示例

```tsx
function MyComponent() {
  return (
    <div>
      {/* Logo */}
      <ProjectLogo 
        logoUrl="https://example.com/logo.png"
        name="My Project"
        size={48}
      />
      
      {/* 状态 */}
      <ProjectStatus status="active" isToken={false} />
      
      {/* 优先级 */}
      <ProjectPriority priority="high" />
      
      {/* 截止日期 */}
      <ProjectDeadline timestamp={Date.now() + 86400000} />
      
      {/* 统计 */}
      <ProjectStats 
        totalInvestment={10000}
        totalProfit={2500}
      />
    </div>
  )
}
```

## 📊 测试覆盖

| 组件 | 测试用例 | 覆盖场景 |
|------|---------|---------|
| ProjectLogo | 6 | 空状态、图片、SVG、尺寸、错误 |
| ProjectStatus | 11 | 所有状态、项目/代币模式 |
| ProjectPriority | 7 | 所有优先级、样式、图标 |
| ProjectDeadline | 7 | 时间格式、紧急状态、图标 |
| ProjectStats | 8 | 空状态、投资/收益、格式化 |

**总计**: 39+ 测试用例

## 🔍 查看测试结果

### 命令行输出
```bash
npm test
```

### 可视化 UI（推荐）
```bash
npm run test:ui
```
然后在浏览器中打开 http://localhost:51204/__vitest__/

### 测试覆盖率报告
```bash
npm run test:coverage
```
查看 `coverage/index.html` 文件

## 📚 文档

- [TESTING.md](./TESTING.md) - 详细的测试文档
- [COMPONENT_OPTIMIZATION.md](./COMPONENT_OPTIMIZATION.md) - 组件优化总结

## ✨ 组件特性

### ProjectLogo
- ✅ 支持图片 URL
- ✅ 支持 SVG 代码
- ✅ 支持 Favicon 后备
- ✅ 自定义尺寸
- ✅ 错误处理

### ProjectStatus
- ✅ 5 种状态类型
- ✅ 项目/代币模式
- ✅ 颜色编码
- ✅ 状态指示点

### ProjectPriority
- ✅ 3 个优先级
- ✅ 颜色编码
- ✅ 旗帜图标

### ProjectDeadline
- ✅ 智能时间格式化
- ✅ 紧急状态高亮
- ✅ 时钟图标

### ProjectStats
- ✅ 投资/收益显示
- ✅ 数字格式化
- ✅ 正负值样式
- ✅ 图标显示

## 🚀 下一步

1. 运行测试确保一切正常
2. 在 ProjectCard 中使用新组件
3. 继续拆分其他大组件
4. 提高测试覆盖率

## 💡 提示

- 使用 `npm run test:ui` 可以获得最佳的测试体验
- 测试文件与组件文件保持同步
- 每次修改组件后运行测试
- 保持测试简单和独立

## 🐛 常见问题

### Q: 测试运行失败？
A: 确保已安装所有依赖：`npm install`

### Q: 找不到测试文件？
A: 测试文件应该在 `src/components/__tests__/` 目录下

### Q: 如何调试测试？
A: 使用 `npm run test:ui` 打开可视化界面

### Q: 如何只运行特定测试？
A: `npm test -- ProjectLogo.test.tsx`

## 📞 获取帮助

如有问题，请查看：
- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [TESTING.md](./TESTING.md)
