# 测试文档

## 安装测试依赖

首先需要安装测试相关的依赖包：

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

## 更新 package.json

在 `package.json` 的 `scripts` 部分添加测试命令：

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行测试并查看 UI
```bash
npm run test:ui
```

### 运行测试覆盖率
```bash
npm run test:coverage
```

### 监听模式（自动重新运行）
```bash
npm test -- --watch
```

### 运行特定测试文件
```bash
npm test -- ProjectLogo.test.tsx
```

## 组件优化说明

### 提炼的组件

我们将大型的 `ProjectCard` 组件拆分为以下小组件：

#### 1. ProjectLogo
- **职责**: 显示项目/代币的 Logo
- **支持**: 自定义图片 URL、SVG 代码、Favicon
- **测试覆盖**: 
  - 空状态渲染
  - 图片 URL 渲染
  - SVG 代码渲染
  - 自定义尺寸
  - 错误处理

#### 2. ProjectStatus
- **职责**: 显示项目/代币状态标签
- **支持**: 项目模式和代币模式的不同文案
- **测试覆盖**:
  - 所有状态类型（active, completed, launched, dead, archived）
  - 项目模式和代币模式的文案差异
  - CSS 样式应用

#### 3. ProjectPriority
- **职责**: 显示优先级标签
- **支持**: 高、中、低三个级别
- **测试覆盖**:
  - 所有优先级类型
  - CSS 样式应用
  - 图标渲染

#### 4. ProjectDeadline
- **职责**: 显示截止日期信息
- **支持**: 智能格式化（已过期、今天、明天、X天后）
- **测试覆盖**:
  - 各种时间格式
  - 紧急状态样式
  - 图标渲染

#### 5. ProjectStats
- **职责**: 显示投资和收益统计
- **支持**: 数字格式化、正负值样式
- **测试覆盖**:
  - 空状态
  - 仅投资/仅收益/两者都有
  - 正负值样式
  - 数字格式化

### 组件设计原则

1. **单一职责**: 每个组件只负责一个明确的功能
2. **可复用性**: 组件可以在不同场景下使用
3. **可测试性**: 组件逻辑简单，易于编写测试
4. **类型安全**: 使用 TypeScript 确保类型安全
5. **无副作用**: 组件为纯展示组件，不包含业务逻辑

### 使用示例

```tsx
import { ProjectLogo } from './components/ProjectLogo'
import { ProjectStatus } from './components/ProjectStatus'
import { ProjectPriority } from './components/ProjectPriority'
import { ProjectDeadline } from './components/ProjectDeadline'
import { ProjectStats } from './components/ProjectStats'

function MyComponent() {
  return (
    <div>
      <ProjectLogo 
        logoUrl="https://example.com/logo.png"
        name="My Project"
        size={48}
      />
      
      <ProjectStatus status="active" isToken={false} />
      
      <ProjectPriority priority="high" />
      
      <ProjectDeadline timestamp={Date.now() + 86400000} />
      
      <ProjectStats 
        totalInvestment={10000}
        totalProfit={2500}
      />
    </div>
  )
}
```

## 测试最佳实践

1. **测试用户行为而非实现细节**: 测试组件的输出和交互，而不是内部状态
2. **使用语义化查询**: 优先使用 `getByRole`, `getByLabelText` 等语义化查询
3. **避免快照测试**: 快照测试容易过时，优先使用断言
4. **测试边界情况**: 测试空值、极端值、错误情况
5. **保持测试独立**: 每个测试应该独立运行，不依赖其他测试

## 下一步

1. 继续拆分 `ProjectCard` 组件的其他部分（任务列表、交易面板等）
2. 为现有的大组件添加集成测试
3. 提高测试覆盖率到 80% 以上
4. 添加 E2E 测试（使用 Playwright 或 Cypress）
