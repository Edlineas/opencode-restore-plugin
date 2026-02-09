/**
 * Standalone Usage Example (without OpenCode SDK)
 * 
 * This shows how to use the core functionality independently
 */

import { SnapshotManager } from '../src/snapshot'
import { FileTracker } from '../src/tracker'
import { RestoreEngine } from '../src/restore'

async function main() {
  const workspaceRoot = process.cwd()

  // 1. Create snapshot manager
  const snapshotManager = new SnapshotManager(workspaceRoot)

  // 2. Create file tracker
  const fileTracker = new FileTracker(workspaceRoot)

  // 3. Capture initial state
  console.log('📸 Capturing initial file state...')
  const beforeHashes = await fileTracker.captureHashes()
  console.log(`Found ${beforeHashes.size} files`)

  // 4. Create snapshot
  console.log('💾 Creating snapshot...')
  const snapshot = await snapshotManager.create('session-1', 'msg-1')
  console.log(`Snapshot created: ${snapshot.id}`)

  // 5. Simulate file changes
  console.log('\n✏️  Make some file changes now...')
  console.log('Press Enter when done')
  await new Promise(resolve => process.stdin.once('data', resolve))

  // 6. Detect changes
  console.log('\n🔍 Detecting changes...')
  const afterHashes = await fileTracker.captureHashes()
  const changes = await fileTracker.detectChanges(beforeHashes, afterHashes)
  console.log(`Modified files: ${changes.length}`)
  changes.forEach(file => console.log(`  - ${file}`))

  // 7. Restore files
  console.log('\n♻️  Restoring files...')
  const restoreEngine = new RestoreEngine(workspaceRoot)
  
  try {
    await restoreEngine.restore(snapshot)
    console.log('✅ Files restored successfully')
  } catch (error: any) {
    if (error.message.includes('conflicts')) {
      console.log('⚠️  File conflicts detected')
      console.log('Files were modified after snapshot. Restore aborted.')
    } else {
      throw error
    }
  }

  // 8. Cleanup
  console.log('\n🧹 Cleaning up old snapshots...')
  await snapshotManager.cleanup(5)
  console.log('✅ Cleanup complete')
}

main().catch(console.error)
