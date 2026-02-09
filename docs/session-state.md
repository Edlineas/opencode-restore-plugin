# 会话状态

> 更新时间：2026-02-09

## 当前进度

**阶段**：需求确认完成，准备开发

## 任务清单

### 待完成

- [ ] 初始化项目结构 (package.json, tsconfig.json)
- [ ] 实现 `src/types.ts` - 类型定义
- [ ] 实现 `src/utils.ts` - 跨平台工具函数
- [ ] 实现 `src/snapshot.ts` - 快照管理器
- [ ] 实现 `src/restore.ts` - 恢复引擎
- [ ] 实现 `src/index.ts` - 插件入口（含按钮注入）
- [ ] 本地测试验证（macOS）
- [ ] 跨平台测试（Windows 路径处理）

### 已完成

- [x] 需求文档 REQUIREMENTS.md v3.0（含按钮注入方案）
- [x] 任务文档 docs/TASKS.md v2.0
- [x] 会话状态文档 docs/session-state.md
- [x] 确认 OpenCode SDK **支持**消息旁按钮注入（`experimental.chat.messages.transform`）

## 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 运行时 | Bun | OpenCode 原生支持 |
| 语言 | TypeScript | 类型安全 |
| 快照存储 | 本地文件系统 | 快速、无依赖 |
| 路径编码 | Base64 (URL-safe) | 避免路径冲突，跨平台兼容 |
| 文件操作 | `node:fs/promises` | 跨平台兼容，避免 shell 命令 |
| **交互方式** | **按钮式 `[restore]`** | 使用 `experimental.chat.messages.transform` 注入 |
| 备用交互 | 命令式 `/restore` | 兼容键盘操作 |

## 核心实现方案

### 按钮注入

```typescript
// 在每条 AI 消息旁注入 [restore] 按钮
"experimental.chat.messages.transform": async (messages) => {
  return messages.map((message) => {
    if (message.role !== "assistant") return message;
    if (!snapshotManager.hasSnapshot(message.sessionId, message.id)) return message;

    message.parts.push({
      type: "decoration",
      actions: [{
        label: "restore",
        style: "danger",
        command: "restore.to_before",
        args: { messageId: message.id, messageIndex: message.index }
      }]
    });
    return message;
  });
}
```

### 恢复流程

```
用户点击消息 3 旁的 [restore] 按钮
    ↓
弹出确认对话框（question.ask）
    ↓
用户确认
    ↓
恢复消息 3 及之后所有快照中的文件
    ↓
删除新建文件
    ↓
显示恢复结果
```

## 待确认

无
