import { SnapshotManager } from '../src/snapshot'
import { mkdtemp, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('SnapshotManager', () => {
  let tempDir: string
  let snapshotDir: string
  let manager: SnapshotManager

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'test-workspace-'))
    snapshotDir = await mkdtemp(join(tmpdir(), 'test-snapshots-'))
    manager = new SnapshotManager(tempDir, { snapshotDir })
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
    await rm(snapshotDir, { recursive: true, force: true })
  })

  test('create should create a snapshot', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'hello world')
    
    const snapshot = await manager.create('session1', 'msg1')
    
    expect(snapshot.sessionId).toBe('session1')
    expect(snapshot.messageId).toBe('msg1')
    expect(snapshot.files['test.txt']).toBeDefined()
    expect(snapshot.files['test.txt'].content).toBe('hello world')
  })

  test('get should retrieve a snapshot', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'hello')
    await manager.create('session1', 'msg1')
    
    const snapshot = await manager.get('msg1')
    
    expect(snapshot).not.toBeNull()
    expect(snapshot?.messageId).toBe('msg1')
  })

  test('delete should remove a snapshot', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'hello')
    await manager.create('session1', 'msg1')
    
    await manager.delete('msg1')
    const snapshot = await manager.get('msg1')
    
    expect(snapshot).toBeNull()
  })

  test('cleanup should remove old snapshots', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'hello')
    
    await manager.create('session1', 'msg1')
    await manager.create('session1', 'msg2')
    await manager.create('session1', 'msg3')
    
    await manager.cleanup(2)
    
    const snapshot1 = await manager.get('msg1')
    expect(snapshot1).toBeNull()
  })
})
