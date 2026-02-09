# 知识库

## 项目信息

- **项目名称**: opencode-restore-plugin
- **npm 用户名**: weinuoer
- **Git 仓库**: https://github.com/Edlineas/opencode-restore-plugin.git
- **核心功能**: 类似 Trae/Kiro 的对话撤回 + 文件恢复

## 技术要点

### TypeScript 配置
- target: ES2020
- module: commonjs
- 输出目录: dist/
- 源码目录: src/

### 依赖包
- @opencode-ai/sdk: OpenCode 官方 SDK（peerDependencies）
- fast-glob: 文件搜索
- crypto: 文件 hash 计算（Node.js 内置）
- jest: 测试框架
- ts-node: TypeScript 执行器

### OpenCode SDK 集成
- 使用 event.subscribe() 监听事件
- 使用 session.revert() 撤销消息
- 使用 tui.showToast() 显示通知
- 事件类型：message.sending, message.completed

### 插件安装
- 位置：~/.config/opencode/plugins/opencode-restore-plugin
- 方式：符号链接到项目目录
- 命令：ln -s /path/to/project ~/.config/opencode/plugins/opencode-restore-plugin

## 环境踩坑

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| npm link 不创建符号链接 | npm link 在某些环境下不工作 | 使用 ln -s 直接创建符号链接 |
| 恢复时冲突检测过严 | 修改后的文件总是检测为冲突 | 添加 force 参数允许强制恢复 |
| 测试时快照包含自身 | 快照目录在工作区内 | 测试时使用独立的快照目录 |

