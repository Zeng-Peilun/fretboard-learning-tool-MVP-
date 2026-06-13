# Node.js 虚拟环境设置指南

## 📋 虚拟环境创建完成

项目现在已配置为使用 **项目级虚拟环境**。所有依赖都隔离在项目目录中。

## 🔧 环境信息

- **Node.js 版本**: v26.3.0
- **npm 版本**: 11.16.0
- **虚拟环境位置**: `/Users/apple/Desktop/有品弦乐乐理/node_modules`
- **Package Lock**: `package-lock.json`（已生成）
- **配置文件**: `.npmrc`
- **版本锁定**: `.nvmrc`

## 📦 已安装依赖

| 类别 | 依赖 | 版本 |
|------|------|------|
| 运行时 | react | ^19.0.0 |
| 运行时 | react-dom | ^19.0.0 |
| 开发 | typescript | ^5.8.0 |
| 开发 | vite | ^7.0.0 |
| 开发 | vitest | ^3.0.0 |
| 开发 | @vitejs/plugin-react | ^5.0.0 |
| 测试 | @testing-library/react | ^16.1.0 |
| 测试 | @testing-library/jest-dom | ^6.6.3 |

**总计**: 159 个包已安装，无安全漏洞

## 🚀 使用虚拟环境

### 运行开发服务器
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

### 运行测试
```bash
npm test
```

### 预览生产构建
```bash
npm run preview
```

## 🔒 虚拟环境隔离特性

本项目使用以下机制实现完全的依赖隔离：

1. **本地 node_modules**: 所有依赖安装在 `./node_modules` 中，不会污染全局环境
2. **package-lock.json**: 锁定所有依赖版本，确保环境一致性
3. **.npmrc 配置**: 
   - 自定义 npm 缓存路径
   - 配置网络重试策略以提高可靠性
4. **.nvmrc 配置**: 指定项目使用的 Node.js 版本 (v26.3.0)

## 📂 虚拟环境目录结构

```
有品弦乐乐理/
├── node_modules/          ← 虚拟环境依赖目录（隔离）
├── package.json           ← 项目依赖声明
├── package-lock.json      ← 依赖版本锁定
├── .npmrc                 ← npm 虚拟环境配置
├── .nvmrc                 ← Node.js 版本指定
└── src/                   ← 源代码目录
```

## 🔄 更新或添加依赖

### 安装新依赖
```bash
npm install package-name --save          # 生产依赖
npm install package-name --save-dev      # 开发依赖
```

### 更新现有依赖
```bash
npm update
```

### 清理虚拟环境（需重新安装）
```bash
rm -rf node_modules package-lock.json
npm install
```

## 💡 最佳实践

1. **不要提交 node_modules**: 使用 `.gitignore` 排除 `node_modules/`
2. **始终提交 package-lock.json**: 确保团队环境一致
3. **定期更新依赖**: 使用 `npm update` 获取安全补丁
4. **检查安全漏洞**: 使用 `npm audit` 检查漏洞

## 🔧 配置文件说明

### .npmrc (npm 配置)
```ini
registry=https://registry.npmjs.org/      ; 使用官方 npm 仓库
fetch-timeout=120000                      ; 网络超时时间
fetch-retries=5                           ; 网络重试次数
cache=.npm-cache                          ; 本地缓存目录
```

### .nvmrc (Node.js 版本)
```
26.3.0
```
指定项目使用的 Node.js 版本

## 🎯 总结

✅ 虚拟环境已成功创建
✅ 所有依赖已隔离安装
✅ package-lock.json 已锁定版本
✅ 项目级 npm 配置已启用
✅ 无安全漏洞

你现在可以安全地在该虚拟环境中进行开发和构建！
