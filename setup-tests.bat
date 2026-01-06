@echo off
echo 🚀 开始安装测试依赖...

npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui

echo.
echo ✅ 测试依赖安装完成！
echo.
echo 📝 可用的测试命令：
echo   npm test              - 运行所有测试
echo   npm run test:ui       - 运行测试 UI
echo   npm run test:coverage - 运行测试覆盖率
echo.
echo 📚 查看 TESTING.md 了解更多信息
