# OpenCode Restore Plugin - 需求文档

> 版本：3.0
> 更新时间：2026-02-09

## 一、项目背景

### 1.1 问题描述

OpenCode 内置的 `/undo` 命令依赖 Git：
- 必须在 Git 仓库中才能使用
- 恢复速度慢（需要 `git checkout`）
- Windows 平台存在已知的文件同步问题

### 1.2 目标

开发一个**轻量级本地文件快照插件**，实现：
- **消息级回滚**：在每条 AI 消息旁边显示 `[restore]` 按钮，点击回滚到该消息之前的状态
- **不依赖 Git**：纯本地文件快照
- **跨平台兼容**：macOS、Linux、Windows

---

## 二、功能需求

### 2.1 核心功能：消息级回滚

**用户场景**：
```
消息 1: AI 修改了 a.ts       ← 正确        [restore]
消息 2: AI 修改了 b.ts       ← 正确        [restore]
消息 3: AI 修改了 c.ts, d.ts ← 问题开始    [restore] ← 点击这里
消息 4: AI 修改了 e.ts       ← 问题        [restore]
消息 5: AI 修改了 f.ts       ← 问题        [restore]
消息 6: AI 修改了 g.ts       ← 当前        [restore]

用户点击消息 3 旁边的 [restore] 按钮
→ 恢复 c.ts, d.ts, e.ts, f.ts, g.ts 到消息 3 之前的状态
→ 消息 3, 4, 5, 6 被删除或标记为已回滚
→ 回到消息 2 结束后的状态
```

**触发方式**：

| 方式 | 操作 | 说明 |
|------|------|------|
| **按钮（主要）** | 点击消息旁的 `[restore]` | 回滚到该消息之前的状态 |
| 命令（备用） | `/restore list` | 显示可回滚的消息列表（带编号） |
| 命令（备用） | `/restore 3` | 回滚到第 3 条消息之前 |
| 命令（备用） | `/restore clean` | 清理所有快照 |

**按钮实现**：
> 使用 `experimental.chat.messages.transform` 钩子，在每条 AI 消息后面注入 `[restore]` 按钮。
> 按钮点击后触发自定义 tool 执行回滚逻辑。

### 2.2 自动快照

**触发时机**：AI 执行 `write`/`edit` 工具**之前**

**快照内容**：
- 即将被修改的文件原始内容
- 快照元信息（时间戳、会话ID、消息ID、文件列表）

**关键逻辑**：
```
同一条消息内多次修改同一文件 → 只保留第一次快照
新建文件（原本不存在）       → 记录"需删除"标记，恢复时删除该文件
```

### 2.3 恢复机制

**恢复流程**：
1. 用户点击消息 3 旁边的 `[restore]` 按钮
2. 插件弹出确认对话框（使用 `question.ask` API）
3. 用户确认后：
   - 恢复消息 3 及之后所有快照中的文件
   - 删除后续消息（可选）
   - 显示恢复结果（成功/失败文件列表）

**确认对话框示例**：
```
即将回滚到消息 3 之前的状态：
- 恢复 4 个文件: c.ts, d.ts, e.ts, f.ts
- 删除 1 个新建文件: g.ts

[确认回滚] [取消]
```

### 2.4 清理策略

| 策略 | 默认值 | 说明 |
|------|--------|------|
| 最大快照数 | 20 | 超过后自动清理最旧的快照 |
| 会话结束清理 | 是 | 会话关闭时清理当前会话的快照 |
| 手动清理 | `/restore clean` | 清理所有快照 |

---

## 三、技术规格

### 3.1 存储结构

```
.opencode/snapshots/
├── index.json                    # 全局索引
└── {session-id}/
    ├── {message-id}/
    │   ├── manifest.json         # 快照元信息
    │   └── files/
    │       ├── {encoded-path-1}  # 原始文件备份
    │       └── {encoded-path-2}
    └── {message-id}/
        └── ...
```

**index.json 结构**：
```json
{
  "version": 1,
  "snapshots": [
    {
      "sessionId": "ses_xxx",
      "messageId": "msg_001",
      "messageIndex": 1,
      "timestamp": "2026-02-09T15:00:00Z",
      "files": ["src/a.ts", "src/b.ts"],
      "newFiles": ["src/c.ts"]
    }
  ]
}
```

**manifest.json 结构**：
```json
{
  "sessionId": "ses_xxx",
  "messageId": "msg_001",
  "messageIndex": 1,
  "timestamp": "2026-02-09T15:00:00Z",
  "files": {
    "src/a.ts": {
      "encodedPath": "c3JjL2EudHM=",
      "size": 1234,
      "isNew": false
    },
    "src/c.ts": {
      "encodedPath": "c3JjL2MudHM=",
      "size": 0,
      "isNew": true
    }
  }
}
```

### 3.2 路径编码

**问题**：文件路径可能包含特殊字符，不适合直接作为文件名

**方案**：Base64 编码（URL-safe 变体）
```typescript
// 编码
function encodePath(filePath: string): string {
  return Buffer.from(filePath, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// 解码
function decodePath(encoded: string): string {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  base64 += "=".repeat(padding);
  return Buffer.from(base64, "base64").toString("utf-8");
}
```

### 3.3 跨平台兼容

| 平台 | 路径分隔符 | 注意事项 |
|------|-----------|----------|
| macOS | `/` | 无特殊处理 |
| Linux | `/` | 无特殊处理 |
| Windows | `\` | **必须统一转换为 `/`** |

**实现要点**：
```typescript
import { normalize } from "node:path";
import { platform } from "node:os";

function normalizeFilePath(filePath: string): string {
  // 统一使用 / 作为分隔符
  return normalize(filePath).replace(/\\/g, "/");
}

function getSnapshotDir(): string {
  // 使用 process.cwd() 获取工作目录，跨平台兼容
  return `${process.cwd()}/.opencode/snapshots`;
}
```

**Windows 特殊处理**：
1. 文件路径统一使用 `/`（存储和恢复时）
2. 使用 `node:fs/promises` 而非 shell 命令
3. 避免使用 `cp`、`rm` 等 Unix 命令

### 3.4 插件 API 使用

**消息按钮注入（核心）**：
```typescript
import { tool, type Plugin } from "@opencode-ai/plugin";
import { z } from "zod";

export const RestorePlugin: Plugin = async ({ client }) => {
  const snapshotManager = new SnapshotManager();
  const restoreEngine = new RestoreEngine(snapshotManager);

  return {
    // 监听文件修改前，创建快照
    "tool.execute.before": async (input) => {
      if (input.tool === "write" || input.tool === "edit") {
        const filePath = input.args.filePath || input.args.file_path;
        await snapshotManager.captureFile(
          input.sessionID,
          input.messageID,
          filePath
        );
      }
    },

    // 在每条 AI 消息旁注入 [restore] 按钮
    "experimental.chat.messages.transform": async (messages) => {
      return messages.map((message) => {
        // 只给 AI 消息添加按钮
        if (message.role !== "assistant") return message;
        
        // 检查该消息是否有快照
        const hasSnapshot = snapshotManager.hasSnapshot(message.sessionId, message.id);
        if (!hasSnapshot) return message;

        // 注入 restore 按钮
        message.parts.push({
          type: "decoration",
          actions: [
            {
              label: "restore",
              style: "danger",  // 红色按钮
              command: "restore.to_before",
              args: { messageId: message.id, messageIndex: message.index }
            }
          ]
        });
        return message;
      });
    },

    // 注册 /restore 命令（备用）
    tools: {
      restore: tool({
        description: "恢复文件到指定消息之前的状态",
        args: {
          subcommand: z.string().optional().describe("子命令: list, clean, 或消息编号"),
        },
        async execute({ subcommand }, context) {
          // 实现恢复逻辑
        },
      }),

      // 按钮触发的恢复命令
      "restore.to_before": tool({
        description: "内部命令：恢复到指定消息之前",
        args: {
          messageId: z.string(),
          messageIndex: z.number(),
        },
        async execute({ messageId, messageIndex }, context) {
          const preview = await restoreEngine.previewRestore(context.sessionID, messageIndex);
          
          // 确认对话框
          const response = await client.question.ask({
            body: {
              question: `即将回滚到消息 #${messageIndex} 之前:\n- 恢复 ${preview.filesToRestore.length} 个文件\n- 删除 ${preview.filesToDelete.length} 个新建文件\n\n确认恢复?`,
              options: ["确认恢复", "取消"]
            }
          });

          if (response.selected !== "确认恢复") {
            return "已取消恢复";
          }

          const result = await restoreEngine.restoreToMessage(context.sessionID, messageIndex);
          return result.message;
        },
      }),
    },
  };
};
```

---

## 四、边界情况处理

| 场景 | 处理方式 |
|------|----------|
| 文件原本不存在（新建） | 记录 `isNew: true`，恢复时删除该文件 |
| 大文件（>1MB） | 跳过快照，输出警告日志 |
| 二进制文件 | 检测文件头，跳过快照 |
| 同一消息多次修改同一文件 | 只保留第一次快照 |
| 快照目录不存在 | 自动创建 |
| 恢复时原文件已被删除 | 正常恢复（重新创建） |
| 恢复时原文件已被手动修改 | 覆盖恢复，输出警告 |

---

## 五、配置项

```typescript
interface RestoreConfig {
  // 最大快照数量
  maxSnapshots: number;  // 默认: 20
  
  // 快照存储目录（相对于工作目录）
  snapshotDir: string;   // 默认: ".opencode/snapshots"
  
  // 排除的文件模式
  excludePatterns: string[];  // 默认: ["node_modules/**", ".git/**", "*.log", "dist/**"]
  
  // 大文件阈值（字节）
  maxFileSize: number;   // 默认: 1048576 (1MB)
  
  // 会话结束时自动清理
  cleanOnSessionEnd: boolean;  // 默认: true
}
```

---

## 六、不在范围内

| 功能 | 原因 |
|------|------|
| 跨会话恢复 | 会话隔离，避免数据混乱 |
| 云端同步 | 超出插件能力范围 |
| 自动调用 `session.revert` 删除消息 | 依赖 Git，与本插件目标冲突 |

---

## 七、与 OpenCode 内置方案对比

| 特性 | OpenCode 内置 `/undo` | 本插件 `[restore]` |
|------|----------------------|-------------------|
| 依赖 | Git 仓库 | **无依赖** |
| 机制 | `git write-tree` + `git checkout` | 文件直接复制 |
| 速度 | 慢 | **快** |
| 粒度 | 消息级（但需 Git） | **消息级** |
| 交互 | 命令式 `/undo` | **按钮式 [restore]** |
| 跨平台 | Windows 有已知 bug | **统一处理** |
| 新建文件处理 | 依赖 Git 状态 | **显式记录并删除** |

---

## 八、验收标准

1. ✅ 每条 AI 消息旁边显示 `[restore]` 按钮
2. ✅ 点击 `[restore]` 按钮正确恢复到该消息之前的状态
3. ✅ `/restore list` 显示可回滚的消息列表（备用）
4. ✅ `/restore 3` 正确恢复到消息 3 之前的状态（备用）
5. ✅ 新建文件在回滚时被正确删除
6. ✅ 同一消息内多次修改同一文件，只恢复到第一次修改前
7. ✅ macOS、Linux、Windows 均可正常使用
8. ✅ 大文件和二进制文件被正确跳过
9. ✅ `/restore clean` 正确清理所有快照
