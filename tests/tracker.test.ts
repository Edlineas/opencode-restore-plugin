import { FileTracker } from '../src/tracker'
import { mkdtemp, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('FileTracker', () => {
  let tempDir: string
  let tracker: FileTracker

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'test-'))
    tracker = new FileTracker(tempDir)
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('captureHashes should capture file hashes', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'hello world')
    
    const hashes = await tracker.captureHashes()
    
    expect(hashes.size).toBeGreaterThan(0)
    expect(hashes.has('test.txt')).toBe(true)
  })

  test('detectChanges should detect modified files', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'hello')
    const before = await tracker.captureHashes()
    
    await writeFile(join(tempDir, 'test.txt'), 'world')
    const after = await tracker.captureHashes()
    
    const changes = await tracker.detectChanges(before, after)
    
    expect(changes).toContain('test.txt')
  })

  test('detectChanges should detect new files', async () => {
    const before = await tracker.captureHashes()
    
    await writeFile(join(tempDir, 'new.txt'), 'new file')
    const after = await tracker.captureHashes()
    
    const changes = await tracker.detectChanges(before, after)
    
    expect(changes).toContain('new.txt')
  })

  test('detectChanges should detect deleted files', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'hello')
    const before = await tracker.captureHashes()
    
    await rm(join(tempDir, 'test.txt'))
    const after = await tracker.captureHashes()
    
    const changes = await tracker.detectChanges(before, after)
    
    expect(changes).toContain('test.txt')
  })
})
