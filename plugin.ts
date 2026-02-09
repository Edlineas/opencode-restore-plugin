/**
 * OpenCode Restore Plugin
 * 
 * Provides Trae/Kiro-like message undo and file restore functionality
 */

import { OpenCodeRestorePlugin } from './src/index'
import { join } from 'path'
import { homedir } from 'os'

export const RestorePlugin = async ({ app, client, $ }: any) => {
  console.log('[OpenCodeRestore] Initializing plugin...')

  // Get workspace root
  const pathInfo = await client.path.get()
  const workspaceRoot = pathInfo.data.path

  // Initialize plugin
  const plugin = new OpenCodeRestorePlugin(workspaceRoot, {
    maxSnapshots: 10,
    snapshotDir: join(homedir(), '.cache/opencode/snapshots'),
    autoCleanup: true,
    excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
  })

  await plugin.initialize(client)

  console.log('[OpenCodeRestore] Plugin initialized successfully')

  return {
    // Hook into events
    event: async ({ event }: any) => {
      const eventListener = plugin.getEventListener()

      // Handle message sending
      if (event.type === 'message.sending' || event.type === 'prompt.submit') {
        const { sessionId, messageId } = event.properties || {}
        if (sessionId && messageId) {
          await eventListener.onMessageSending(sessionId, messageId)
          console.log(`[OpenCodeRestore] Snapshot created for message: ${messageId}`)
        }
      }

      // Handle message completed
      if (event.type === 'message.completed' || event.type === 'assistant.response') {
        const { sessionId, messageId } = event.properties || {}
        if (sessionId && messageId) {
          await eventListener.onMessageCompleted(sessionId, messageId)
          console.log(`[OpenCodeRestore] Tracked changes for message: ${messageId}`)
        }
      }

      // Handle session idle (cleanup)
      if (event.type === 'session.idle') {
        await plugin.cleanup()
        console.log('[OpenCodeRestore] Cleaned up old snapshots')
      }
    },

    // Hook into commands
    command: {
      execute: {
        before: async (input: any, output: any) => {
          // Intercept /restore command
          if (input.command === 'restore' || input.command === '/restore') {
            const { messageId, sessionId, force } = input.args || {}
            
            if (!messageId) {
              await client.tui.showToast({
                body: {
                  message: 'Usage: /restore <messageId> [sessionId] [--force]',
                  variant: 'info'
                }
              })
              return
            }

            try {
              await plugin.restoreMessage(messageId, sessionId, force)
            } catch (error) {
              console.error('[OpenCodeRestore] Restore failed:', error)
            }
          }
        }
      }
    }
  }
}

// Export as default for OpenCode to load
export default RestorePlugin
