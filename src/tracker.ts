import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import fg from 'fast-glob'
import { RestoreConfig, DEFAULT_CONFIG } from './types'

export class FileTracker {
  private config: RestoreConfig
  private workspaceRoot: string

  constructor(workspaceRoot: string, config: Partial<RestoreConfig> = {}) {
    this.workspaceRoot = workspaceRoot
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async captureHashes(): Promise<Map<string, string>> {
    const hashes = new Map<string, string>()
    const files = await fg('**/*', {
      cwd: this.workspaceRoot,
      ignore: this.config.excludePatterns,
      dot: true,
      onlyFiles: true,
      absolute: false
    })

    for (const file of files) {
      const hash = await this.calculateHash(file)
      hash && hashes.set(file, hash)
    }

    return hashes
  }

  async detectChanges(before: Map<string, string>, after: Map<string, string>): Promise<string[]> {
    const modified: string[] = []
    
    for (const [path, afterHash] of after) {
      const beforeHash = before.get(path)
      if (!beforeHash || beforeHash !== afterHash) {
        modified.push(path)
      }
    }

    for (const path of before.keys()) {
      if (!after.has(path)) {
        modified.push(path)
      }
    }

    return modified
  }

  private async calculateHash(filePath: string): Promise<string | null> {
    try {
      const fullPath = `${this.workspaceRoot}/${filePath}`
      const content = await readFile(fullPath)
      
      if (content.length > this.config.maxSnapshotSize * 1024 * 1024) {
        return null
      }

      return createHash('md5').update(content).digest('hex')
    } catch {
      return null
    }
  }
}
