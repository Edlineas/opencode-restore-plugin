import { Snapshot, FileState, RestoreConfig, DEFAULT_CONFIG } from './types'
import { readFile, writeFile, mkdir, unlink, readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { createHash } from 'crypto'

export class SnapshotManager {
  private config: RestoreConfig
  private workspaceRoot: string
  private snapshotDir: string

  constructor(workspaceRoot: string, config: Partial<RestoreConfig> = {}) {
    this.workspaceRoot = workspaceRoot
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.snapshotDir = this.config.snapshotDir.replace('~', homedir())
  }

  async create(sessionId: string, messageId: string): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: this.generateId(),
      messageId,
      sessionId,
      timestamp: Date.now(),
      files: {}
    }

    const files = await this.getWorkspaceFiles()
    
    for (const filePath of files) {
      const fileState = await this.captureFileState(filePath)
      fileState && (snapshot.files[filePath] = fileState)
    }

    await this.saveSnapshot(sessionId, messageId, snapshot)
    return snapshot
  }

  async get(messageId: string): Promise<Snapshot | null> {
    try {
      const sessions = await readdir(this.snapshotDir)
      
      for (const sessionId of sessions) {
        const snapshotPath = join(this.snapshotDir, sessionId, `${messageId}.json`)
        try {
          const content = await readFile(snapshotPath, 'utf-8')
          return JSON.parse(content)
        } catch {
          continue
        }
      }
      
      return null
    } catch {
      return null
    }
  }

  async delete(messageId: string): Promise<void> {
    try {
      const sessions = await readdir(this.snapshotDir)
      
      for (const sessionId of sessions) {
        const snapshotPath = join(this.snapshotDir, sessionId, `${messageId}.json`)
        try {
          await unlink(snapshotPath)
        } catch {
          continue
        }
      }
    } catch {
      // Ignore errors
    }
  }

  async cleanup(maxSnapshots: number): Promise<void> {
    try {
      const sessions = await readdir(this.snapshotDir)
      
      for (const sessionId of sessions) {
        const sessionDir = join(this.snapshotDir, sessionId)
        const files = await readdir(sessionDir)
        
        if (files.length <= maxSnapshots) continue

        const snapshots = await Promise.all(
          files.map(async (file) => {
            const filePath = join(sessionDir, file)
            const stats = await stat(filePath)
            return { file, mtime: stats.mtime.getTime() }
          })
        )

        snapshots.sort((a, b) => b.mtime - a.mtime)
        const toDelete = snapshots.slice(maxSnapshots)

        for (const { file } of toDelete) {
          await unlink(join(sessionDir, file))
        }
      }
    } catch {
      // Ignore errors
    }
  }

  private async getWorkspaceFiles(): Promise<string[]> {
    const fg = (await import('fast-glob')).default
    return fg('**/*', {
      cwd: this.workspaceRoot,
      ignore: this.config.excludePatterns,
      dot: true,
      onlyFiles: true,
      absolute: false
    })
  }

  private async captureFileState(filePath: string): Promise<FileState | null> {
    try {
      const fullPath = join(this.workspaceRoot, filePath)
      const content = await readFile(fullPath)
      
      if (content.length > this.config.maxSnapshotSize * 1024 * 1024) {
        return null
      }

      const hash = createHash('md5').update(content).digest('hex')
      
      return {
        content: content.toString('utf-8'),
        hash,
        exists: true
      }
    } catch {
      return null
    }
  }

  private async saveSnapshot(sessionId: string, messageId: string, snapshot: Snapshot): Promise<void> {
    const sessionDir = join(this.snapshotDir, sessionId)
    await mkdir(sessionDir, { recursive: true })
    
    const snapshotPath = join(sessionDir, `${messageId}.json`)
    await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2))
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
