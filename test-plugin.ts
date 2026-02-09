#!/usr/bin/env ts-node
/**
 * Test script for OpenCode Restore Plugin
 * Tests the plugin functionality without requiring full OpenCode integration
 */

import { SnapshotManager } from './src/snapshot'
import { FileTracker } from './src/tracker'
import { RestoreEngine } from './src/restore'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'

async function test() {
  console.log('🧪 Testing OpenCode Restore Plugin\n')

  const testDir = join(process.cwd(), 'test-workspace')
  
  try {
    // Setup test workspace
    console.log('📁 Setting up test workspace...')
    await mkdir(testDir, { recursive: true })

    const snapshotManager = new SnapshotManager(testDir, {
      snapshotDir: join(testDir, '.snapshots')
    })
    const fileTracker = new FileTracker(testDir)
    const restoreEngine = new RestoreEngine(testDir)

    // Test 1: Create test file
    console.log('\n✅ Test 1: Create test file')
    const testFile = join(testDir, 'test.txt')
    await writeFile(testFile, 'Original content')
    console.log('   Created: test.txt with "Original content"')

    // Test 2: Capture initial state
    console.log('\n✅ Test 2: Capture file hashes')
    const beforeHashes = await fileTracker.captureHashes()
    console.log(`   Captured ${beforeHashes.size} file(s)`)

    // Test 3: Create snapshot
    console.log('\n✅ Test 3: Create snapshot')
    const snapshot = await snapshotManager.create('test-session', 'test-msg-1')
    console.log(`   Snapshot ID: ${snapshot.id}`)
    console.log(`   Files in snapshot: ${Object.keys(snapshot.files).length}`)

    // Test 4: Modify file
    console.log('\n✅ Test 4: Modify file')
    await writeFile(testFile, 'Modified content')
    console.log('   Modified: test.txt to "Modified content"')

    // Test 5: Detect changes
    console.log('\n✅ Test 5: Detect changes')
    const afterHashes = await fileTracker.captureHashes()
    const changes = await fileTracker.detectChanges(beforeHashes, afterHashes)
    console.log(`   Detected ${changes.length} change(s): ${changes.join(', ')}`)

    // Test 6: Verify modified content
    console.log('\n✅ Test 6: Verify modified content')
    const modifiedContent = await readFile(testFile, 'utf-8')
    console.log(`   Current content: "${modifiedContent}"`)

    // Test 7: Restore from snapshot
    console.log('\n✅ Test 7: Restore from snapshot')
    await restoreEngine.restore(snapshot, true) // force = true for testing
    console.log('   Restored files from snapshot')

    // Test 8: Verify restored content
    console.log('\n✅ Test 8: Verify restored content')
    const restoredContent = await readFile(testFile, 'utf-8')
    console.log(`   Restored content: "${restoredContent}"`)

    if (restoredContent === 'Original content') {
      console.log('   ✅ Content matches original!')
    } else {
      console.log('   ❌ Content does not match!')
      throw new Error('Restore failed')
    }

    // Test 9: Retrieve snapshot
    console.log('\n✅ Test 9: Retrieve snapshot')
    const retrieved = await snapshotManager.get('test-msg-1')
    console.log(`   Retrieved snapshot: ${retrieved?.id}`)

    // Test 10: Cleanup
    console.log('\n✅ Test 10: Cleanup old snapshots')
    await snapshotManager.cleanup(5)
    console.log('   Cleanup completed')

    console.log('\n🎉 All tests passed!\n')

    // Cleanup test workspace
    console.log('🧹 Cleaning up test workspace...')
    await unlink(testFile)
    console.log('✅ Test completed successfully\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

test()
