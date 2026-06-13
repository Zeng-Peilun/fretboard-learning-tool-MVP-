# Contributing

感谢你愿意参与这个项目。这个工具本身来自作者对有品弦乐乐理、指板几何、调式与和弦生成关系的一套阶段性理解，因此有一定乐理门槛，也一定存在局限。欢迎提出修正、补充、反例、使用体验建议和代码贡献，尤其欢迎能说明音乐场景与理论依据的反馈。

## 1. 行为准则 (Code of Conduct)

请保持尊重、耐心和清晰。讨论可以严谨，观点可以不同，但请围绕问题本身表达，避免人身攻击、嘲讽、歧视性表达或无意义争吵。这个项目涉及乐理理解与实现取舍，欢迎建设性分歧。

## 2. 如何反馈问题 (Reporting Bugs)

提交 Issue 前，请先搜索现有 Issues，确认相同问题是否已经被报告。如果已有相关 Issue，请优先在原 Issue 下补充信息。

反馈 Bug 时，建议使用以下模板：

```markdown
## 问题描述
简要说明发生了什么。

## 复现步骤
1. 打开页面/选择某个乐器或调弦
2. 选择某个调式/和弦/Box 范围
3. 执行某个操作
4. 看到错误结果

## 期望结果
说明你认为正确的显示或计算结果是什么。

## 实际结果
说明当前实际显示或计算结果是什么。

## 环境信息
- 操作系统：
- 浏览器及版本：
- Node.js 版本：
- npm 版本：

## 错误日志或截图
粘贴终端日志、浏览器控制台错误、截图或录屏。

## 相关乐理上下文
如果问题涉及调式、和弦、转位、把位、调弦或音程命名，请补充你的理论依据。
```

## 3. 如何提交功能建议 (Feature Requests)

提交功能建议前，也请先搜索现有 Issues，避免重复讨论。

建议描述时请尽量包含：

- 使用场景：你是在练习、教学、作曲、编配、即兴、还是调弦探索中需要它？
- 期望效果：界面应该显示什么，交互应该如何发生？
- 乐理依据：这个功能依赖什么调式、和弦、把位系统或指板逻辑？
- 可接受的取舍：如果完整实现较复杂，最小可用版本是什么？

## 4. 开发环境搭建 (Development Setup)

从 `main` 分支克隆代码：

```bash
git clone <repository-url>
cd 有品弦乐乐理
```

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

运行测试：

```bash
npm run test
```

验证生产构建：

```bash
npm run build
```

## 5. 代码风格规范 (Coding Standards)

- 使用 TypeScript + React 的现有项目风格。
- 缩进使用 2 个空格。
- 变量、函数使用 `camelCase`。
- React 组件和类型名使用 `PascalCase`。
- 常量集合可使用 `UPPER_SNAKE_CASE` 或遵循所在文件已有风格。
- 乐理、音程、调式、和弦、MIDI、Pitch Class 等领域概念要命名清楚，避免为了缩写牺牲可读性。
- 新增或修改核心计算逻辑时，应补充或更新 `src/domain/` 下的测试。

提交前必须至少通过：

```bash
npm run lint
npm run test:coverage
npm run build
```

也可以一次性运行：

```bash
npm run verify
```

`test:coverage` 会对核心 domain 模型强制执行 95% 的 statements、branches、functions 和 lines 覆盖率门槛。

## 6. Pull Request (PR) 流程

请从最新的 `main` 分支拉取代码并创建功能分支：

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

PR 说明中请尽量包含：

- 这次改动解决了什么问题。
- 涉及哪些乐理或数学模型假设。
- 是否改变了已有 UI、数据结构或计算结果。
- 如何验证这次改动。

提交 PR 前请确认：

- [ ] 分支基于最新 `main`。
- [ ] 已运行 `npm run lint` 并通过。
- [ ] 已运行 `npm run test:coverage` 并通过。
- [ ] 已运行 `npm run build` 并通过。
- [ ] 如果修改了核心乐理或指板计算，已补充或更新单元测试。
- [ ] 如果修改了用户可见行为，已更新 `README.md` 或 `README-CN.md`。
- [ ] 没有提交 `node_modules/`、`dist/`、`.npm-cache/`、本地日志或 Excel 临时文件。
- [ ] PR 描述中说明了相关乐理依据、应用场景和可能局限。

对于纯文档、错别字或说明性改动，可以不新增测试，但仍请说明修改范围。
