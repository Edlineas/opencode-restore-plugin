import { Snapshot } from './types'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'

export class RestoreEngine {
  private workspaceRoot: string

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot
  }

  async restore(snapshot: Snapshot): Promise<void> {
    const conflicts: string[] = []

    for (const [path, state] of Object.entries(snapshot.files)) {
      const fullPath = join(this.workspaceRoot, path)
      
      const hasConflict = await this.detectConflict(fullPath, state.hash)
      if (hasConflict) {
        conflicts.push(path)
      }
    }

    if (conflicts.length > 0) {
      throw new Error(`File conflicts detected: ${conflicts.join(', ')}. Please confirm to overwrite.`)
    }

    for (const [path, state] of Object.entries(snapshot.files)) {
      await this.restoreFile(path, state)
    }

    if (snapshot.modifiedFiles) {
      for (const path of snapshot.modifiedFiles) {
        if (!snapshot.files[path]) {
          await this.deleteFile(path)
        }
      }
    }
  }

  async revertMessage(sessionId: string, messageId: string): Promise<void> {
    throw new Error('Not implemented - requires OpenCode SDK integration')
  }

  private async restoreFile(path: string, state: { content: string; hash: string; exists: boolean }): Promise<void> {
    const fullPath = join(this.workspaceRoot, path)

    if (state.exists) {
      await mkdir(dirname(fullPath), { recursive: true })
      await writeFile(fullPath, state.content, 'utf-8')
    } else {
      await this.deleteFile(path)
    }
  }

  private async deleteFile(path: string): Promise<void> {
    try {
      const fullPath = join(this.workspaceRoot, path)
      await unlink(fullPath)
    } catch {
      // File already deleted or doesn't exist
    }
  }

  private async detectConflict(fullPath: string, expectedHash: string): Promise<boolean> {
    try {
      const content = await readFile(fullPath)
      const currentHash = createHash('md5').update(content).digest('hex')
      return currentHash !== expectedHash
    } catch {
      return false
    }
  }
}
