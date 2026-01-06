# 测试覆盖率报告

## 测试统计

- **测试文件数**: 8
- **测试用例数**: 65
- **通过率**: 100%

## 覆盖率指标

| 指标 | 覆盖率 | 目标 | 状态 |
|------|--------|------|------|
| 语句覆盖率 | 70% | 60% | ✅ 达标 |
| 分支覆盖率 | 61.45% | 60% | ✅ 达标 |
| 函数覆盖率 | 71.11% | 60% | ✅ 达标 |
| 行覆盖率 | 70.98% | 60% | ✅ 达标 |

## 组件测试覆盖率

### 高覆盖率组件 (>90%)
- ✅ **ProjectDeadline.tsx** - 93.75%
- ✅ **ProjectLogo.tsx** - 100%
- ✅ **ProjectPriority.tsx** - 100%
- ✅ **ProjectStats.tsx** - 100%
- ✅ **ProjectStatus.tsx** - 100%

### 中等覆盖率组件 (70-90%)
- ⚠️ **TokenPriceChart.tsx** - 73.83%
  - 未覆盖: 空状态处理、部分边界条件

### 低覆盖率组件 (<70%)
- ❌ **Favicon.tsx** - 0% (工具组件，暂未测试)

## 工具函数测试覆盖率

### 高覆盖率
- ✅ **mockPriceData.ts** - 100%
- ✅ **priceDataCache.ts** - 78.75%

### 低覆盖率
- ❌ **favicon.ts** - 0% (工具函数，暂未测试)

## 测试文件列表

### 组件测试
1. `src/components/__tests__/ProjectDeadline.test.tsx` - 7 tests
2. `src/components/__tests__/ProjectLogo.test.tsx` - 5 tests
3. `src/components/__tests__/ProjectPriority.test.tsx` - 7 tests
4. `src/components/__tests__/ProjectStats.test.tsx` - 8 tests
5. `src/components/__tests__/ProjectStatus.test.tsx` - 10 tests
6. `src/components/__tests__/TokenPriceChart.test.tsx` - 8 tests

### 工具函数测试
7. `src/utils/__tests__/mockPriceData.test.ts` - 7 tests
8. `src/utils/__tests__/priceDataCache.test.ts` - 13 tests

## 运行测试

### 运行所有测试
```bash
npm run test
```

### 运行测试并生成覆盖率报告
```bash
npm run test -- --coverage
```

### 查看覆盖率报告
覆盖率报告会生成在 `coverage/` 目录下：
- `coverage/index.html` - HTML 格式的详细报告
- `coverage/coverage-final.json` - JSON 格式的原始数据

## 改进建议

### 短期目标
1. 为 `Favicon.tsx` 添加单元测试
2. 为 `favicon.ts` 工具函数添加测试
3. 提高 `TokenPriceChart.tsx` 的边界条件测试

### 长期目标
1. 添加集成测试覆盖完整的用户流程
2. 添加 E2E 测试验证关键功能
3. 将覆盖率目标提升到 80%

## 测试配置

测试配置位于 `vitest.config.ts`：

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  },
}
```

## 注意事项

1. **图表组件警告**: TokenPriceChart 测试中会出现 Recharts 的宽度/高度警告，这是正常的，因为测试环境中没有实际的 DOM 尺寸
2. **缓存测试**: priceDataCache 测试会在控制台输出错误日志，这是预期行为，用于测试错误处理
3. **类型声明**: 已添加 `src/test/vitest.d.ts` 来扩展 Vitest 的类型定义

## 最后更新

- 日期: 2026-01-06
- 测试框架: Vitest 4.0.16
- 覆盖率工具: @vitest/coverage-v8
