export class FileTracker {
  async captureHashes(): Promise<Map<string, string>> {
    throw new Error('Not implemented')
  }

  async detectChanges(before: Map<string, string>, after: Map<string, string>): Promise<string[]> {
    throw new Error('Not implemented')
  }
}
