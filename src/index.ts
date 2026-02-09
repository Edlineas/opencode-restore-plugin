export { SnapshotManager } from './snapshot'
export { FileTracker } from './tracker'
export { RestoreEngine } from './restore'
export { EventListener } from './events'
export * from './types'

import { SnapshotManager } from './snapshot'
import { RestoreEngine } from './restore'
import { EventListener } from './events'
import { RestoreConfig } from './types'

export class OpenCodeRestorePlugin {
  private snapshotManager: SnapshotManager
  private restoreEngine: RestoreEngine
  private eventListener: EventListener
  private workspaceRoot: string

  constructor(workspaceRoot: string, config: Partial<RestoreConfig> = {}) {
    this.workspaceRoot = workspaceRoot
    this.snapshotManager = new SnapshotManager(workspaceRoot, config)
    this.restoreEngine = new RestoreEngine(workspaceRoot)
    this.eventListener = new EventListener(workspaceRoot, config)
  }

  async initialize(): Promise<void> {
    // Plugin initialization logic
    // Register commands, shortcuts, etc.
  }

  async restoreMessage(messageId: string): Promise<void> {
    const snapshot = await this.snapshotManager.get(messageId)
    
    if (!snapshot) {
      throw new Error(`Snapshot not found for message: ${messageId}`)
    }

    await this.restoreEngine.restore(snapshot)
  }

  async cleanup(): Promise<void> {
    await this.snapshotManager.cleanup(10)
  }

  getEventListener(): EventListener {
    return this.eventListener
  }
}

export default OpenCodeRestorePlugin

