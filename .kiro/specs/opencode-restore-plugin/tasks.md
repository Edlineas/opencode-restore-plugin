# OpenCode Restore Plugin - 任务清单

> 目标：实现类似 Trae/Kiro 的对话撤回 + 文件恢复功能

---

## 阶段 1：项目初始化

- [x] 创建项目结构
- [x] 配置 TypeScript
- [x] 配置 package.json
- [x] 创建 Git 仓库
- [x] 安装依赖
- [x] 验证编译通过

---

## 阶段 2：核心模块实现

### 2.1 类型定义（types.ts）
- [x] 定义 Snapshot 接口
- [x] 定义 FileState 接口
- [x] 定义 RestoreConfig 接口
- [x] 定义默认配置

### 2.2 文件追踪器（tracker.ts）
- [x] 实现 captureHashes() - 捕获所有文件的 hash
- [x] 实现 detectChanges() - 对比前后 hash 找出修改的文件
- [x] 实现文件 hash 计算（MD5）
- [x] 实现文件搜索（使用 fast-glob）
- [x] 实现排除模式（node_modules、.git 等）
- [x] 单元测试

### 2.3 快照管理器（snapshot.ts）
- [x] 实现 create() - 创建快照
- [x] 实现 get() - 读取快照
- [x] 实现 delete() - 删除快照
- [x] 实现 cleanup() - 清理旧快照
- [x] 实现快照存储（JSON 文件）
- [x] 实现快照目录管理
- [x] 单元测试

### 2.4 恢复引擎（restore.ts）
- [x] 实现 restore() - 恢复文件
- [x] 实现 revertMessage() - 撤销消息
- [x] 实现文件写入
- [x] 实现文件删除（新创建的文件）
- [x] 实现冲突检测
- [x] 实现用户确认提示
- [x] 单元测试

---

## 阶段 3：OpenCode 插件集成

### 3.1 事件监听
- [x] 监听 message.sending 事件（发送前创建快照）
- [x] 监听 message.completed 事件（完成后记录修改文件）
- [x] 实现事件处理器

### 3.2 命令注册
- [x] 注册 /restore 命令
- [x] 实现命令处理逻辑
- [x] 实现消息选择（如果有多条）
- [x] 实现成功/失败通知

### 3.3 快捷键支持
- [x] 注册 Cmd+Shift+Z / Ctrl+Shift+Z
- [x] 实现快捷键处理（恢复最近一条）

### 3.4 插件入口（index.ts）
- [x] 实现插件初始化
- [x] 实现配置加载
- [x] 实现插件导出

---

## 阶段 4：测试验证

### 4.1 集成测试
- [x] 测试完整流程：发送消息 → 修改文件 → 撤回 → 验证恢复
- [x] 测试多轮对话撤回
- [x] 测试文件冲突处理
- [x] 测试大文件跳过
- [x] 测试快照清理

### 4.2 边界测试
- [x] 测试文件被手动修改后恢复
- [x] 测试新创建文件的删除
- [x] 测试文件被删除后恢复
- [x] 测试快照目录不存在
- [x] 测试磁盘空间不足

---

## 阶段 5：文档和发布

### 5.1 文档
- [x] 更新 README.md（使用说明）
- [x] 创建 CHANGELOG.md
- [x] 创建 docs/API.md
- [x] 创建 docs/DEVELOPMENT.md

### 5.2 发布准备
- [x] 验证 package.json 配置
- [x] 验证编译输出
- [x] 验证 npm 包内容
- [x] 创建 GitHub Release

### 5.3 发布
- [ ] 发布到 npm（v0.1.0）- 暂不发布
- [ ] 提交到 OpenCode 生态 - 暂不发布

---

## 当前进度

**当前阶段**：所有核心功能已完成，等待用户确认后发布

**下一步**：用户确认后发布到 npm
