# OpenCode Restore Plugin

轻量级本地文件快照插件，提供类似 Trae/Kiro 的即时撤回体验，**不依赖 Git**。

## 特性

- **即时快照**：AI 修改文件前自动备份
- **一键恢复**：`/restore` 命令恢复到修改前状态
- **无依赖**：不需要 Git，纯文件系统操作
- **高性能**：直接文件复制，无 `git write-tree` 开销

## 安装

```json
// opencode.json
{
  "plugin": ["opencode-restore"]
}
```

或本地开发：

```bash
# 将插件目录链接到 OpenCode
ln -s /path/to/opencode-restore-plugin ~/.config/opencode/plugins/opencode-restore
```

## 使用

### 恢复文件

```
/restore        # 恢复上一轮对话修改的文件
/restore 2      # 恢复到第 2 个快照点
/restore list   # 列出所有快照
/restore clean  # 清理所有快照
```

## 配置

```json
{
  "restore": {
    "maxSnapshots": 10,
    "excludePatterns": ["node_modules/**", ".git/**"]
  }
}
```

## 工作原理

1. 监听 `tool.execute.before` 事件
2. 当 AI 执行 `write`/`edit` 时，先备份原文件
3. 用户执行 `/restore` 时，从备份恢复文件

## 许可证

MIT
