export { SnapshotManager } from './snapshot'
export { FileTracker } from './tracker'
export { RestoreEngine } from './restore'
export { EventListener } from './events'
export * from './types'

import { SnapshotManager } from './snapshot'
import { RestoreEngine } from './restore'
import { EventListener } from './events'
import { RestoreConfig } from './types'

export interface OpenCodeClient {
  session: {
    revert: (params: { path: { id: string }, body: { messageId: string } }) => Promise<any>
  }
  tui: {
    showToast: (params: { body: { message: string, variant: 'success' | 'error' | 'info' } }) => Promise<boolean>
    executeCommand: (params: { body: { command: string, args?: any } }) => Promise<boolean>
  }
  event: {
    subscribe: () => Promise<{ stream: AsyncIterable<any> }>
  }
}

export class OpenCodeRestorePlugin {
  private snapshotManager: SnapshotManager
  private restoreEngine: RestoreEngine
  private eventListener: EventListener
  private workspaceRoot: string
  private client: OpenCodeClient | null = null

  constructor(workspaceRoot: string, config: Partial<RestoreConfig> = {}) {
    this.workspaceRoot = workspaceRoot
    this.snapshotManager = new SnapshotManager(workspaceRoot, config)
    this.restoreEngine = new RestoreEngine(workspaceRoot)
    this.eventListener = new EventListener(workspaceRoot, config)
  }

  async initialize(client: OpenCodeClient): Promise<void> {
    this.client = client

    await this.registerCommands()
    await this.subscribeToEvents()
  }

  private async registerCommands(): Promise<void> {
    if (!this.client) return

    // Register /restore command
    // Note: Command registration depends on OpenCode plugin system
    // This is a placeholder for the actual implementation
  }

  private async subscribeToEvents(): Promise<void> {
    if (!this.client) return

    try {
      const events = await this.client.event.subscribe()
      
      for await (const event of events.stream) {
        await this.handleEvent(event)
      }
    } catch (error) {
      console.error('[OpenCodeRestore] Failed to subscribe to events:', error)
    }
  }

  private async handleEvent(event: any): Promise<void> {
    const { type, properties } = event

    // Handle message sending event
    if (type === 'message.sending' || type === 'prompt.submit') {
      const { sessionId, messageId } = properties
      await this.eventListener.onMessageSending(sessionId, messageId)
    }

    // Handle message completed event
    if (type === 'message.completed' || type === 'assistant.response') {
      const { sessionId, messageId } = properties
      await this.eventListener.onMessageCompleted(sessionId, messageId)
    }
  }

  async restoreMessage(messageId: string, sessionId?: string, force: boolean = false): Promise<void> {
    if (!this.client) {
      throw new Error('Plugin not initialized')
    }

    try {
      const snapshot = await this.snapshotManager.get(messageId)
      
      if (!snapshot) {
        await this.client.tui.showToast({
          body: {
            message: `Snapshot not found for message: ${messageId}`,
            variant: 'error'
          }
        })
        throw new Error(`Snapshot not found for message: ${messageId}`)
      }

      await this.restoreEngine.restore(snapshot, force)

      if (sessionId) {
        await this.client.session.revert({
          path: { id: sessionId },
          body: { messageId }
        })
      }

      await this.client.tui.showToast({
        body: {
          message: 'Files restored successfully',
          variant: 'success'
        }
      })
    } catch (error: any) {
      if (error.message.includes('conflicts') && !force) {
        await this.client.tui.showToast({
          body: {
            message: 'File conflicts detected. Use force=true to overwrite.',
            variant: 'error'
          }
        })
      } else {
        await this.client.tui.showToast({
          body: {
            message: `Restore failed: ${error.message}`,
            variant: 'error'
          }
        })
      }
      throw error
    }
  }

  async cleanup(): Promise<void> {
    await this.snapshotManager.cleanup(10)
  }

  getEventListener(): EventListener {
    return this.eventListener
  }
}

export default OpenCodeRestorePlugin

