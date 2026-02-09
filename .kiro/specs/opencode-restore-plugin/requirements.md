# OpenCode Restore Plugin - 需求文档

## 1. 项目背景

### 1.1 问题描述
OpenCode 当前的 `/undo` 命令只能撤销消息，无法恢复 AI 修改的文件。这导致用户在 AI 修改错误时，无法快速回退到修改前的状态。

**参考 Issue**: [GitHub #4704](https://github.com/sst/opencode/issues/4704)

### 1.2 竞品分析
- **Trae**: 提供 "回退到本轮消息发送前" 功能，包括文件恢复
- **Kiro**: 提供 Checkpoint 和 Restore 功能
- **OpenCode**: 仅支持消息撤销，不支持文件恢复 ❌

### 1.3 目标用户
- OpenCode 用户
- 需要频繁试错的开发者
- 对 AI 修改不确定的用户

---

## 2. 功能需求

### 2.1 核心功能

#### F1: 自动快照
**优先级**: P0（必须）

**描述**: 用户发送消息前，自动捕获工作区文件状态

**触发时机**:
- 用户按下 Enter 发送消息时
- 监听 `message.sending` 事件

**快照内容**:
```typescript
interface Snapshot {
  id: string                    // 快照 ID
  messageId: string             // 关联的消息 ID
  sessionId: string             // 会话 ID
  timestamp: number             // 时间戳
  files: {
    [path: string]: {
      content: string           // 文件内容
      hash: string              // 文件 hash (MD5)
      exists: boolean           // 文件是否存在
    }
  }
  modifiedFiles?: string[]      // AI 修改的文件列表（AI 回复后填充）
}
```

**性能要求**:
- 快照创建时间 < 500ms（小型项目）
- 快照创建时间 < 2s（大型项目）
- 使用增量快照减少存储

**存储位置**:
- `~/.cache/opencode/snapshots/{sessionId}/{messageId}.json`

---

#### F2: 文件修改追踪
**优先级**: P0（必须）

**描述**: 追踪 AI 修改了哪些文件

**实现方案**:

**方案 A: 文件 Hash 对比**（推荐）
```typescript
// 消息发送前
const beforeHashes = await captureFileHashes()

// AI 回复后
const afterHashes = await captureFileHashes()

// 对比差异
const modifiedFiles = diff(beforeHashes, afterHashes)
```

**方案 B: 监听文件系统**
```typescript
// 使用 chokidar 监听文件变化
const watcher = chokidar.watch(projectRoot)
watcher.on('change', (path) => {
  recordModifiedFile(path)
})
```

**选择**: 方案 A（更可靠，不依赖文件系统事件）

---

#### F3: 消息撤销 + 文件恢复
**优先级**: P0（必须）

**描述**: 撤销 AI 消息并恢复文件到快照状态

**执行流程**:
```
1. 用户触发 Restore（命令/快捷键/按钮）
2. 获取目标消息的快照
3. 调用 session.revert() 撤销消息
4. 恢复快照中的文件
5. 显示成功通知
```

**文件恢复逻辑**:
```typescript
async function restoreFiles(snapshot: Snapshot) {
  for (const [path, state] of Object.entries(snapshot.files)) {
    if (state.exists) {
      // 恢复文件内容
      await writeFile(path, state.content)
    } else {
      // 删除新创建的文件
      await deleteFile(path)
    }
  }
}
```

**冲突处理**:
- 用户在 AI 修改后又手动修改了文件 → 提示用户确认
- 文件被删除 → 重新创建
- 新文件 → 删除

---

### 2.2 触发方式

#### T1: 命令面板
**优先级**: P0（必须）

**命令名称**: `Restore Message` 或 `/restore`

**实现**:
```typescript
await client.tui.executeCommand({
  body: {
    command: "restore-message",
    args: { messageId }
  }
})
```

---

#### T2: 快捷键
**优先级**: P1（重要）

**快捷键**:
- macOS: `Cmd+Shift+Z`
- Windows/Linux: `Ctrl+Shift+Z`

**行为**: 恢复到上一条消息发送前状态

---

#### T3: UI 按钮
**优先级**: P2（可选）

**位置**: 每条 AI 消息旁边

**样式**: `[↶ Restore]` 按钮

**依赖**: OpenCode 插件 API 是否支持 UI 扩展（待验证）

---

### 2.3 配置选项

```typescript
interface RestoreConfig {
  // 最大快照数量
  maxSnapshots: number          // 默认: 10
  
  // 快照存储目录
  snapshotDir: string           // 默认: ~/.cache/opencode/snapshots
  
  // 自动清理旧快照
  autoCleanup: boolean          // 默认: true
  
  // 排除文件模式
  excludePatterns: string[]     // 默认: ['node_modules/**', '.git/**']
  
  // 快照大小限制（MB）
  maxSnapshotSize: number       // 默认: 100
  
  // 是否快照二进制文件
  includeBinary: boolean        // 默认: false
}
```

---

## 3. 非功能需求

### 3.1 性能要求
- 快照创建: < 2s（大型项目）
- 文件恢复: < 1s
- 内存占用: < 100MB

### 3.2 存储要求
- 单个快照: < 100MB
- 总存储: < 1GB（自动清理）

### 3.3 兼容性
- OpenCode 版本: >= 1.0.0
- Node.js: >= 18.0.0
- 操作系统: macOS, Linux, Windows

### 3.4 可靠性
- 快照失败不影响正常使用
- 恢复失败提示用户
- 支持部分恢复

---

## 4. 边界情况

### 4.1 文件冲突
**场景**: 用户在 AI 修改后又手动修改了文件

**处理**:
```
1. 检测文件 hash 与快照不一致
2. 提示用户: "文件已被手动修改，是否覆盖？"
3. 用户确认后恢复
```

### 4.2 大文件
**场景**: 文件 > 10MB

**处理**:
- 跳过快照，记录文件路径
- 恢复时提示: "大文件未快照，无法恢复"

### 4.3 二进制文件
**场景**: 图片、视频等二进制文件

**处理**:
- 默认不快照（配置可开启）
- 只记录文件路径和 hash

### 4.4 Git 冲突
**场景**: 恢复文件后与 Git 状态不一致

**处理**:
- 提示用户: "文件已恢复，请检查 Git 状态"
- 建议用户运行 `git status`

### 4.5 并发修改
**场景**: AI 执行过程中用户修改文件

**处理**:
- 快照只记录发送前状态
- 恢复时覆盖所有修改（提示用户）

---

## 5. 技术方案

### 5.1 技术栈
- **语言**: TypeScript
- **SDK**: @opencode-ai/sdk
- **文件操作**: Node.js fs/promises
- **文件搜索**: fast-glob
- **Hash 计算**: crypto (MD5)

### 5.2 核心模块

#### SnapshotManager
```typescript
class SnapshotManager {
  async create(sessionId: string, messageId: string): Promise<Snapshot>
  async get(messageId: string): Promise<Snapshot | null>
  async delete(messageId: string): Promise<void>
  async cleanup(maxSnapshots: number): Promise<void>
}
```

#### FileTracker
```typescript
class FileTracker {
  async captureHashes(): Promise<Map<string, string>>
  async detectChanges(before: Map, after: Map): Promise<string[]>
}
```

#### RestoreEngine
```typescript
class RestoreEngine {
  async restore(snapshot: Snapshot): Promise<void>
  async revertMessage(sessionId: string, messageId: string): Promise<void>
}
```

---

## 6. 测试计划

### 6.1 单元测试
- SnapshotManager 创建/读取/删除
- FileTracker hash 计算和对比
- RestoreEngine 文件恢复逻辑

### 6.2 集成测试
- 完整的快照 → 修改 → 恢复流程
- 多轮对话的快照管理
- 边界情况处理

### 6.3 性能测试
- 1000 个文件的快照时间
- 100MB 快照的恢复时间
- 内存占用测试

---

## 7. 发布计划

### 7.1 版本规划

**v0.1.0 (MVP)**
- 基础快照和恢复功能
- 命令面板触发
- 基础配置选项

**v0.2.0**
- 快捷键支持
- 增量快照优化
- 性能优化

**v0.3.0**
- UI 按钮（如果 API 支持）
- 高级配置选项
- 完整文档

**v1.0.0**
- 稳定版本
- 完整测试覆盖
- 社区反馈优化

### 7.2 发布渠道
- npm: `opencode-restore`
- GitHub: 开源仓库
- OpenCode 生态: 提交到 awesome-opencode

---

## 8. 风险评估

### 8.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| OpenCode API 不支持 UI 扩展 | 高 | 中 | 使用命令面板和快捷键替代 |
| 大型项目快照慢 | 中 | 高 | 增量快照 + 排除模式 |
| 文件恢复冲突 | 中 | 中 | 提示用户确认 |
| 存储空间占用大 | 低 | 中 | 自动清理 + 大小限制 |

### 8.2 用户体验风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 快照创建影响性能 | 中 | 高 | 异步快照 + 进度提示 |
| 恢复失败用户困惑 | 中 | 高 | 清晰的错误提示 |
| 配置复杂 | 低 | 中 | 合理的默认值 |

---

## 9. 成功指标

### 9.1 功能指标
- 快照成功率 > 99%
- 恢复成功率 > 95%
- 快照创建时间 < 2s（大型项目）

### 9.2 用户指标
- npm 下载量 > 1000/月（6 个月内）
- GitHub Stars > 100（6 个月内）
- 用户反馈评分 > 4.5/5

### 9.3 社区指标
- 提交到 awesome-opencode
- 被 OpenCode 官方推荐
- 社区贡献者 > 3

---

## 10. 参考资料

- [OpenCode SDK 文档](https://frank.dev.opencode.ai/docs/sdk/)
- [OpenCode 插件文档](https://opencode.ai/docs/plugins/)
- [GitHub Issue #4704](https://github.com/sst/opencode/issues/4704)
- [Trae 功能演示](https://trae.ai)
- [Kiro Checkpoint 功能](https://kiro.ai)
