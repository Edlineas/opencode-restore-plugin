export interface FileState {
  content: string
  hash: string
  exists: boolean
}

export interface Snapshot {
  id: string
  messageId: string
  sessionId: string
  timestamp: number
  files: Record<string, FileState>
  modifiedFiles?: string[]
}

export interface RestoreConfig {
  maxSnapshots: number
  snapshotDir: string
  autoCleanup: boolean
  excludePatterns: string[]
  maxSnapshotSize: number
  includeBinary: boolean
}

export const DEFAULT_CONFIG: RestoreConfig = {
  maxSnapshots: 10,
  snapshotDir: '~/.cache/opencode/snapshots',
  autoCleanup: true,
  excludePatterns: ['node_modules/**', '.git/**'],
  maxSnapshotSize: 100,
  includeBinary: false
}
