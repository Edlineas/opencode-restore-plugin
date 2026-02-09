# API Documentation

## OpenCodeRestorePlugin

Main plugin class for OpenCode Restore functionality.

### Constructor

```typescript
constructor(workspaceRoot: string, config?: Partial<RestoreConfig>)
```

**Parameters:**
- `workspaceRoot`: Absolute path to the workspace directory
- `config`: Optional configuration object

### Methods

#### initialize()

```typescript
async initialize(): Promise<void>
```

Initialize the plugin and register commands/shortcuts.

#### restoreMessage()

```typescript
async restoreMessage(messageId: string): Promise<void>
```

Restore files to the state before the specified message was sent.

**Parameters:**
- `messageId`: The ID of the message to restore to

**Throws:**
- Error if snapshot not found
- Error if file conflicts detected

#### cleanup()

```typescript
async cleanup(): Promise<void>
```

Clean up old snapshots based on configured limits.

---

## SnapshotManager

Manages file snapshots.

### Methods

#### create()

```typescript
async create(sessionId: string, messageId: string): Promise<Snapshot>
```

Create a snapshot of the current workspace state.

#### get()

```typescript
async get(messageId: string): Promise<Snapshot | null>
```

Retrieve a snapshot by message ID.

#### delete()

```typescript
async delete(messageId: string): Promise<void>
```

Delete a snapshot.

#### cleanup()

```typescript
async cleanup(maxSnapshots: number): Promise<void>
```

Remove old snapshots exceeding the limit.

---

## FileTracker

Tracks file changes using hash comparison.

### Methods

#### captureHashes()

```typescript
async captureHashes(): Promise<Map<string, string>>
```

Capture MD5 hashes of all workspace files.

#### detectChanges()

```typescript
async detectChanges(before: Map<string, string>, after: Map<string, string>): Promise<string[]>
```

Detect changed files by comparing hash maps.

---

## RestoreEngine

Handles file restoration.

### Methods

#### restore()

```typescript
async restore(snapshot: Snapshot): Promise<void>
```

Restore files from a snapshot.

**Throws:**
- Error if file conflicts detected

---

## Types

### Snapshot

```typescript
interface Snapshot {
  id: string
  messageId: string
  sessionId: string
  timestamp: number
  files: Record<string, FileState>
  modifiedFiles?: string[]
}
```

### FileState

```typescript
interface FileState {
  content: string
  hash: string
  exists: boolean
}
```

### RestoreConfig

```typescript
interface RestoreConfig {
  maxSnapshots: number
  snapshotDir: string
  autoCleanup: boolean
  excludePatterns: string[]
  maxSnapshotSize: number
  includeBinary: boolean
}
```

**Defaults:**
```typescript
{
  maxSnapshots: 10,
  snapshotDir: '~/.cache/opencode/snapshots',
  autoCleanup: true,
  excludePatterns: ['node_modules/**', '.git/**'],
  maxSnapshotSize: 100,
  includeBinary: false
}
```
