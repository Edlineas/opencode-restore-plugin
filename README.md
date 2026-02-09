# OpenCode Restore Plugin

## 项目概述

OpenCode Restore Plugin 是一个为 OpenCode AI 编程助手开发的插件，提供类似 Trae/Kiro 的消息撤销和文件恢复功能。

## 核心功能

### 1. 消息撤销 + 文件恢复
- 点击 Restore 按钮，回退到本轮对话发送前的状态
- 撤销 AI 的回复消息
- 恢复 AI 修改的所有文件到发送前状态
- 保留用户消息，可重新编辑发送

### 2. 自动快照
- 用户发送消息前自动捕获文件状态
- 记录 AI 修改的文件列表
- 智能增量快照，节省存储空间

### 3. 多种触发方式
- 命令面板：`/restore` 或 `Restore Message`
- 快捷键：`Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` (Windows/Linux)
- UI 按钮：消息工具栏 Restore 按钮（如果 OpenCode 支持）

## 技术架构

### 依赖
- `@opencode-ai/sdk`: OpenCode 官方 SDK
- `fast-glob`: 文件搜索
- `crypto`: 文件 hash 计算

### 核心模块
1. **SnapshotManager**: 文件快照管理
2. **FileTracker**: 文件修改追踪
3. **RestoreEngine**: 恢复引擎
4. **EventListener**: 事件监听器

## 项目结构

```
opencode-restore-plugin/
├── README.md                 # 项目说明
├── REQUIREMENTS.md           # 需求文档
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
├── src/
│   ├── index.ts             # 插件入口
│   ├── snapshot.ts          # 快照管理
│   ├── tracker.ts           # 文件追踪
│   ├── restore.ts           # 恢复引擎
│   ├── events.ts            # 事件监听
│   └── types.ts             # 类型定义
├── tests/
│   ├── snapshot.test.ts     # 快照测试
│   └── restore.test.ts      # 恢复测试
└── docs/
    ├── API.md               # API 文档
    └── DEVELOPMENT.md       # 开发指南
```

## 开发计划

### 阶段 1：核心功能（1 周）
- [x] 需求文档
- [ ] 项目初始化
- [ ] 文件快照机制
- [ ] 消息撤销 + 文件恢复
- [ ] 命令面板集成

### 阶段 2：优化（3-5 天）
- [ ] 增量快照
- [ ] 性能优化
- [ ] 边界情况处理
- [ ] 单元测试

### 阶段 3：发布（2-3 天）
- [ ] 文档完善
- [ ] npm 发布
- [ ] 社区推广

## 安装使用

### 从 npm 安装（开发完成后）
```json
{
  "plugin": ["opencode-restore"]
}
```

### 本地开发
```bash
# 克隆项目
git clone <repo-url>
cd opencode-restore-plugin

# 安装依赖
npm install

# 构建
npm run build

# 链接到 OpenCode
ln -s $(pwd) ~/.config/opencode/plugins/opencode-restore
```

## 使用方法

### 命令面板
1. 打开命令面板（`Cmd+K` 或 `Ctrl+K`）
2. 输入 `Restore Message`
3. 选择要恢复的消息

### 快捷键
- 按 `Cmd+Shift+Z` (macOS) 或 `Ctrl+Shift+Z` (Windows/Linux)
- 自动恢复到上一条消息发送前状态

## 配置选项

```json
{
  "plugin": ["opencode-restore"],
  "restore": {
    "maxSnapshots": 10,
    "snapshotDir": "~/.cache/opencode/snapshots",
    "autoCleanup": true,
    "excludePatterns": ["node_modules/**", ".git/**"]
  }
}
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 相关链接

- [OpenCode 官网](https://opencode.ai)
- [OpenCode SDK 文档](https://frank.dev.opencode.ai/docs/sdk/)
- [GitHub Issue #4704](https://github.com/sst/opencode/issues/4704)
