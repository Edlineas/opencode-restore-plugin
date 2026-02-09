import { RestoreEngine } from '../src/restore'
import { Snapshot } from '../src/types'
import { mkdtemp, writeFile, rm, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('RestoreEngine', () => {
  let tempDir: string
  let engine: RestoreEngine

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'test-'))
    engine = new RestoreEngine(tempDir)
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('restore should restore files', async () => {
    await writeFile(join(tempDir, 'test.txt'), 'original content')
    
    const snapshot: Snapshot = {
      id: '1',
      messageId: 'msg1',
      sessionId: 'session1',
      timestamp: Date.now(),
      files: {
        'test.txt': {
          content: 'original content',
          hash: '5e2a8b6c7d3f4e1a9b0c8d7e6f5a4b3c',
          exists: true
        }
      }
    }

    await writeFile(join(tempDir, 'test.txt'), 'modified content')
    
    try {
      await engine.restore(snapshot)
      fail('Should throw conflict error')
    } catch (error: any) {
      expect(error.message).toContain('File conflicts detected')
    }
  })

  test('restore should delete new files', async () => {
    const snapshot: Snapshot = {
      id: '1',
      messageId: 'msg1',
      sessionId: 'session1',
      timestamp: Date.now(),
      files: {},
      modifiedFiles: ['new.txt']
    }

    await writeFile(join(tempDir, 'new.txt'), 'new file')
    
    await engine.restore(snapshot)
    
    try {
      await readFile(join(tempDir, 'new.txt'))
      fail('File should have been deleted')
    } catch (error: any) {
      expect(error.code).toBe('ENOENT')
    }
  })
})
