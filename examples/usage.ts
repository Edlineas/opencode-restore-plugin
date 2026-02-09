/**
 * OpenCode Restore Plugin Usage Example
 * 
 * This example shows how to integrate the plugin with OpenCode
 */

import { createOpencodeClient } from '@opencode-ai/sdk'
import OpenCodeRestorePlugin from '../src/index'

async function main() {
  // 1. Create OpenCode client
  const client = createOpencodeClient({
    baseUrl: 'http://localhost:4096'
  })

  // 2. Get current project path
  const pathInfo = await client.path.get()
  const workspaceRoot = pathInfo.data.path

  // 3. Initialize plugin
  const plugin = new OpenCodeRestorePlugin(workspaceRoot, {
    maxSnapshots: 10,
    snapshotDir: '~/.cache/opencode/snapshots',
    autoCleanup: true,
    excludePatterns: ['node_modules/**', '.git/**', 'dist/**']
  })

  // 4. Initialize with OpenCode client
  await plugin.initialize(client as any)

  console.log('✅ OpenCode Restore Plugin initialized')

  // 5. Plugin will now automatically:
  //    - Create snapshots before each message
  //    - Track file changes after AI responses
  //    - Listen for restore commands

  // Example: Manually restore a message
  // await plugin.restoreMessage('message-id-123', 'session-id-456')

  // Example: Cleanup old snapshots
  // await plugin.cleanup()
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export default main
