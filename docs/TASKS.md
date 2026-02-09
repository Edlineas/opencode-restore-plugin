# OpenCode Restore Plugin - 开发任务清单

> 版本：2.0
> 更新时间：2026-02-09

## 任务总览

| # | 任务 | 状态 | 依赖 |
|---|------|------|------|
| 1 | 项目初始化 | 待开始 | 无 |
| 2 | 类型定义 | 待开始 | 1 |
| 3 | 工具函数 | 待开始 | 2 |
| 4 | 快照管理器 | 待开始 | 3 |
| 5 | 恢复引擎 | 待开始 | 4 |
| 6 | 插件入口（含按钮注入） | 待开始 | 5 |
| 7 | 测试验证 | 待开始 | 6 |

---

## 任务 1：项目初始化

### 1.1 创建 package.json

```json
{
  "name": "opencode-restore-plugin",
  "version": "0.1.0",
  "description": "轻量级本地文件快照恢复插件",
  "main": "src/index.ts",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^0.15.18",
    "@opencode-ai/sdk": "^0.15.18",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.4.0"
  }
}
```

### 1.2 创建 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.3 创建目录结构

```
opencode-restore-plugin/
├── src/
│   ├── index.ts      # 插件入口
│   ├── types.ts      # 类型定义
│   ├── utils.ts      # 工具函数（路径编码、跨平台）
│   ├── snapshot.ts   # 快照管理器
│   └── restore.ts    # 恢复引擎
├── package.json
├── tsconfig.json
├── REQUIREMENTS.md
└── docs/
    ├── session-state.md
    └── TASKS.md
```

### 验收标准

- [ ] `bun install` 成功
- [ ] `bun run typecheck` 无错误

---

## 任务 2：类型定义 (src/types.ts)

### 2.1 核心类型

```typescript
// 快照文件信息
export interface SnapshotFile {
  originalPath: string;      // 原始文件路径（统一使用 /）
  encodedPath: string;       // Base64 编码后的路径
  size: number;              // 文件大小（字节）
  isNew: boolean;            // 是否为新建文件（恢复时需删除）
}

// 快照元信息
export interface SnapshotManifest {
  sessionId: string;
  messageId: string;
  messageIndex: number;      // 消息序号，用于显示
  timestamp: string;         // ISO 格式时间戳
  files: Record<string, SnapshotFile>;  // key: 原始路径
}

// 全局索引条目
export interface SnapshotIndexEntry {
  sessionId: string;
  messageId: string;
  messageIndex: number;
  timestamp: string;
  files: string[];           // 快照的文件路径列表
  newFiles: string[];        // 新建文件列表
}

// 全局索引
export interface SnapshotIndex {
  version: number;
  snapshots: SnapshotIndexEntry[];
}

// 配置
export interface RestoreConfig {
  maxSnapshots: number;
  snapshotDir: string;
  excludePatterns: string[];
  maxFileSize: number;
  cleanOnSessionEnd: boolean;
}

// 恢复结果
export interface RestoreResult {
  success: boolean;
  restoredFiles: string[];
  deletedFiles: string[];
  failedFiles: Array<{ path: string; error: string }>;
  message: string;
}
```

### 验收标准

- [ ] 所有类型导出正确
- [ ] `bun run typecheck` 无错误

---

## 任务 3：工具函数 (src/utils.ts)

### 3.1 路径编码/解码

```typescript
/**
 * Base64 URL-safe 编码文件路径
 * 用于将文件路径转换为安全的文件名
 */
export function encodePath(filePath: string): string;

/**
 * Base64 URL-safe 解码文件路径
 */
export function decodePath(encoded: string): string;
```

### 3.2 跨平台路径处理

```typescript
/**
 * 统一路径分隔符为 /（Windows 兼容）
 */
export function normalizeFilePath(filePath: string): string;

/**
 * 获取快照目录绝对路径
 */
export function getSnapshotDir(config: RestoreConfig): string;

/**
 * 获取快照文件完整路径
 */
export function getSnapshotFilePath(
  config: RestoreConfig,
  sessionId: string,
  messageId: string,
  encodedPath: string
): string;
```

### 3.3 文件检测

```typescript
/**
 * 检测文件是否为二进制文件
 * 通过检查文件头部字节判断
 */
export async function isBinaryFile(filePath: string): Promise<boolean>;

/**
 * 检测文件是否应该被排除
 */
export function shouldExclude(
  filePath: string,
  excludePatterns: string[]
): boolean;
```

### 3.4 默认配置

```typescript
export const DEFAULT_CONFIG: RestoreConfig = {
  maxSnapshots: 20,
  snapshotDir: ".opencode/snapshots",
  excludePatterns: ["node_modules/**", ".git/**", "*.log", "dist/**"],
  maxFileSize: 1048576, // 1MB
  cleanOnSessionEnd: true,
};
```

### 验收标准

- [ ] 路径编码/解码可逆
- [ ] Windows 路径 `C:\foo\bar.ts` 正确转换为 `C:/foo/bar.ts`
- [ ] 二进制文件检测正确（PNG、JPEG、可执行文件）
- [ ] 排除模式匹配正确

---

## 任务 4：快照管理器 (src/snapshot.ts)

### 4.1 类结构

```typescript
export class SnapshotManager {
  private config: RestoreConfig;
  private index: SnapshotIndex;
  private capturedInMessage: Map<string, Set<string>>; // messageId -> Set<filePath>

  constructor(config?: Partial<RestoreConfig>);

  /**
   * 初始化：加载或创建索引
   */
  async init(): Promise<void>;

  /**
   * 捕获文件快照（在 AI 修改文件前调用）
   */
  async captureFile(
    sessionId: string,
    messageId: string,
    messageIndex: number,
    filePath: string
  ): Promise<boolean>;

  /**
   * 获取指定消息的快照
   */
  async getSnapshot(
    sessionId: string,
    messageId: string
  ): Promise<SnapshotManifest | null>;

  /**
   * 获取当前会话的所有快照（用于 /restore list）
   */
  async listSnapshots(sessionId: string): Promise<SnapshotIndexEntry[]>;

  /**
   * 获取需要恢复的快照列表（指定消息及之后的所有快照）
   */
  async getSnapshotsToRestore(
    sessionId: string,
    fromMessageIndex: number
  ): Promise<SnapshotManifest[]>;

  /**
   * 删除快照
   */
  async deleteSnapshot(sessionId: string, messageId: string): Promise<void>;

  /**
   * 清理旧快照（超过 maxSnapshots）
   */
  async pruneOldSnapshots(): Promise<void>;

  /**
   * 清理会话的所有快照
   */
  async cleanSession(sessionId: string): Promise<void>;

  /**
   * 清理所有快照
   */
  async cleanAll(): Promise<void>;

  /**
   * 保存索引到磁盘
   */
  private async saveIndex(): Promise<void>;

  /**
   * 加载索引
   */
  private async loadIndex(): Promise<void>;
}
```

### 4.2 关键实现细节

**捕获快照流程**：
1. 检查文件是否已在当前消息中被捕获（避免重复）
2. 检查文件是否应被排除（匹配 excludePatterns）
3. 检查文件大小是否超过限制
4. 检查文件是否为二进制文件
5. 检查文件是否存在（不存在则标记为新建文件）
6. 复制文件内容到快照目录
7. 更新 manifest.json 和 index.json

**跨平台注意**：
- 所有文件操作使用 `node:fs/promises`
- 目录创建使用 `mkdir({ recursive: true })`
- 路径统一使用 `/` 分隔符

### 验收标准

- [ ] 快照正确创建在 `.opencode/snapshots/` 目录
- [ ] 同一消息多次修改同一文件只保留首次快照
- [ ] 新建文件正确标记 `isNew: true`
- [ ] 大文件和二进制文件被跳过
- [ ] 索引文件正确更新

---

## 任务 5：恢复引擎 (src/restore.ts)

### 5.1 类结构

```typescript
export class RestoreEngine {
  private snapshotManager: SnapshotManager;

  constructor(snapshotManager: SnapshotManager);

  /**
   * 恢复到指定消息之前的状态
   * @param sessionId 会话ID
   * @param fromMessageIndex 从哪条消息开始恢复（包含该消息）
   * @returns 恢复结果
   */
  async restoreToMessage(
    sessionId: string,
    fromMessageIndex: number
  ): Promise<RestoreResult>;

  /**
   * 恢复上一条消息的修改
   */
  async restoreLast(sessionId: string): Promise<RestoreResult>;

  /**
   * 预览恢复（不实际执行）
   */
  async previewRestore(
    sessionId: string,
    fromMessageIndex: number
  ): Promise<{
    filesToRestore: string[];
    filesToDelete: string[];
  }>;
}
```

### 5.2 恢复流程

```
1. 获取需要恢复的快照列表（fromMessageIndex 及之后的所有快照）
2. 合并所有快照的文件（同一文件可能在多个快照中出现）
   - 保留最早的快照版本（即修改前的状态）
3. 遍历合并后的文件列表：
   - isNew = true: 删除文件
   - isNew = false: 从快照恢复文件内容
4. 删除已恢复的快照
5. 返回恢复结果
```

### 5.3 文件合并逻辑

```typescript
// 示例：合并快照
// 快照 3: a.ts (原始), c.ts (新建)
// 快照 4: a.ts (修改后), d.ts (新建)
// 快照 5: a.ts (再次修改), e.ts (新建)

// 合并结果：
// a.ts -> 使用快照 3 的版本（最早）
// c.ts -> 删除（新建）
// d.ts -> 删除（新建）
// e.ts -> 删除（新建）
```

### 验收标准

- [ ] 恢复后文件内容正确
- [ ] 新建文件被正确删除
- [ ] 同一文件多次修改恢复到最早版本
- [ ] 恢复后快照被清理
- [ ] 预览功能不修改文件

---

## 任务 6：插件入口 (src/index.ts)

### 6.1 插件结构（含按钮注入）

```typescript
import { tool, type Plugin } from "@opencode-ai/plugin";
import { z } from "zod";
import { SnapshotManager } from "./snapshot";
import { RestoreEngine } from "./restore";

export const RestorePlugin: Plugin = async ({ client }) => {
  const snapshotManager = new SnapshotManager();
  await snapshotManager.init();
  
  const restoreEngine = new RestoreEngine(snapshotManager);

  // 跟踪消息序号
  let messageCounter = 0;

  return {
    // 监听文件修改前，创建快照
    "tool.execute.before": async (input) => {
      if (input.tool === "write" || input.tool === "edit") {
        const filePath = input.args.filePath || input.args.file_path;
        if (filePath) {
          await snapshotManager.captureFile(
            input.sessionID,
            input.messageID,
            messageCounter,
            filePath
          );
        }
      }
    },

    // 监听消息完成，更新计数器
    "message.complete": async (input) => {
      if (input.role === "assistant") {
        messageCounter++;
      }
    },

    // ★ 核心：在每条 AI 消息旁注入 [restore] 按钮
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

    // 注册 tools
    tools: {
      // 按钮触发的恢复命令（主要交互方式）
      "restore.to_before": tool({
        description: "内部命令：恢复到指定消息之前",
        args: {
          messageId: z.string(),
          messageIndex: z.number(),
        },
        async execute({ messageId, messageIndex }, context) {
          const sessionId = context.sessionID;
          const preview = await restoreEngine.previewRestore(sessionId, messageIndex);
          
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

          const result = await restoreEngine.restoreToMessage(sessionId, messageIndex);
          return result.message;
        },
      }),

      // 命令行备用方式
      restore: tool({
        description: "恢复文件到指定消息之前的状态。用法: /restore list, /restore 3, /restore clean",
        args: {
          subcommand: z.string().optional().describe("子命令: list, clean, 或消息编号"),
        },
        async execute({ subcommand }, context) {
          const sessionId = context.sessionID;

          // /restore clean
          if (subcommand === "clean") {
            await snapshotManager.cleanAll();
            return "已清理所有快照";
          }

          // /restore list
          if (subcommand === "list") {
            const snapshots = await snapshotManager.listSnapshots(sessionId);
            if (snapshots.length === 0) {
              return "没有可恢复的快照";
            }
            let output = "可恢复的快照:\n";
            for (const s of snapshots) {
              output += `  #${s.messageIndex}: ${s.files.length} 个文件 (${s.timestamp})\n`;
            }
            output += "\n使用 /restore <编号> 恢复到指定消息之前";
            return output;
          }

          // /restore <number>
          if (subcommand && /^\d+$/.test(subcommand)) {
            const messageIndex = parseInt(subcommand, 10);
            const preview = await restoreEngine.previewRestore(sessionId, messageIndex);
            
            const response = await client.question.ask({
              body: {
                question: `即将回滚到消息 #${messageIndex} 之前:\n- 恢复 ${preview.filesToRestore.length} 个文件\n- 删除 ${preview.filesToDelete.length} 个新建文件\n\n确认恢复?`,
                options: ["确认恢复", "取消"]
              }
            });

            if (response.selected !== "确认恢复") {
              return "已取消恢复";
            }

            const result = await restoreEngine.restoreToMessage(sessionId, messageIndex);
            return result.message;
          }

          // /restore (无参数)
          return "用法: /restore list | /restore <编号> | /restore clean";
        },
      }),
    },
  };
};

export default RestorePlugin;
```

### 6.2 安装位置

将插件复制到 `.opencode/plugins/restore.ts`：
```bash
cp -r src/* ~/.config/opencode/plugins/restore/
# 或项目级
cp -r src/* .opencode/plugins/restore/
```

### 验收标准

- [ ] 插件加载无错误
- [ ] **每条 AI 消息旁边显示 `[restore]` 按钮**
- [ ] **点击按钮触发恢复确认对话框**
- [ ] `/restore list` 正确显示快照列表（备用）
- [ ] `/restore 3` 正确恢复（备用）
- [ ] `/restore clean` 正确清理快照

---

## 任务 7：测试验证

### 7.1 功能测试用例

| # | 测试场景 | 预期结果 |
|---|----------|----------|
| 1 | AI 修改一个文件 | 快照创建成功，消息旁显示 `[restore]` 按钮 |
| 2 | AI 同一消息修改同一文件两次 | 只保留第一次快照 |
| 3 | AI 新建一个文件 | 标记为 isNew，恢复时删除 |
| 4 | **点击 `[restore]` 按钮** | **弹出确认对话框** |
| 5 | **确认恢复** | **文件恢复成功，新建文件删除** |
| 6 | `/restore list` | 显示快照列表（备用） |
| 7 | `/restore 3` | 恢复到消息 3 之前（备用） |
| 8 | `/restore clean` | 清理所有快照 |
| 9 | 大文件（>1MB） | 跳过，输出警告 |
| 10 | 二进制文件（PNG） | 跳过 |

### 7.2 跨平台测试

| 平台 | 测试项 | 预期结果 |
|------|--------|----------|
| macOS | 基本功能 + 按钮显示 | 正常 |
| Linux | 基本功能 + 按钮显示 | 正常 |
| Windows | 路径 `C:\foo\bar.ts` | 正确转换为 `C:/foo/bar.ts` |
| Windows | 快照存储 | 路径编码正确 |
| Windows | 恢复文件 | 正确恢复 |
| Windows | 按钮显示 | 正常显示 |

### 7.3 边界测试

| 场景 | 预期结果 |
|------|----------|
| 快照目录不存在 | 自动创建 |
| 索引文件损坏 | 重新初始化 |
| 恢复时原文件已删除 | 正常创建 |
| 恢复时原文件已手动修改 | 覆盖恢复 |
| 快照数超过 maxSnapshots | 自动清理最旧快照 |
| 消息无快照 | 不显示 `[restore]` 按钮 |

### 验收标准

- [ ] **每条有快照的消息旁边显示 `[restore]` 按钮**
- [ ] **点击按钮正确触发恢复流程**
- [ ] 所有功能测试通过
- [ ] macOS 测试通过
- [ ] Windows 路径处理测试通过（如有条件）
- [ ] 边界情况处理正确

---

## 开发顺序

```
1. 项目初始化 (package.json, tsconfig.json)
        ↓
2. 类型定义 (src/types.ts)
        ↓
3. 工具函数 (src/utils.ts)
        ↓
4. 快照管理器 (src/snapshot.ts)
        ↓
5. 恢复引擎 (src/restore.ts)
        ↓
6. 插件入口 (src/index.ts)
        ↓
7. 测试验证
```

---

## 风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| OpenCode SDK API 变更 | 插件无法加载 | 锁定 SDK 版本，关注更新日志 |
| 大量文件修改导致快照过大 | 磁盘空间不足 | 严格限制 maxFileSize，及时清理 |
| Windows 路径编码问题 | 恢复失败 | 统一使用 `/` 分隔符，充分测试 |
| 并发修改冲突 | 快照不完整 | 使用 Map 跟踪已捕获文件 |
