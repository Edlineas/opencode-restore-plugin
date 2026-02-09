import { SnapshotManager } from './snapshot'
import { FileTracker } from './tracker'
import { RestoreConfig } from './types'

export class EventListener {
  private snapshotManager: SnapshotManager
  private fileTracker: FileTracker
  private beforeHashes: Map<string, string> | null = null
  private currentSessionId: string | null = null
  private currentMessageId: string | null = null

  constructor(workspaceRoot: string, config: Partial<RestoreConfig> = {}) {
    this.snapshotManager = new SnapshotManager(workspaceRoot, config)
    this.fileTracker = new FileTracker(workspaceRoot, config)
  }

  async onMessageSending(sessionId: string, messageId: string): Promise<void> {
    this.currentSessionId = sessionId
    this.currentMessageId = messageId
    
    this.beforeHashes = await this.fileTracker.captureHashes()
    
    await this.snapshotManager.create(sessionId, messageId)
  }

  async onMessageCompleted(sessionId: string, messageId: string): Promise<void> {
    if (!this.beforeHashes) return

    const afterHashes = await this.fileTracker.captureHashes()
    const modifiedFiles = await this.fileTracker.detectChanges(this.beforeHashes, afterHashes)

    if (modifiedFiles.length > 0) {
      const snapshot = await this.snapshotManager.get(messageId)
      if (snapshot) {
        snapshot.modifiedFiles = modifiedFiles
        // Update snapshot with modified files list
      }
    }

    this.beforeHashes = null
  }
}
