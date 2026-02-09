import { Snapshot } from './types'

export class RestoreEngine {
  async restore(snapshot: Snapshot): Promise<void> {
    throw new Error('Not implemented')
  }

  async revertMessage(sessionId: string, messageId: string): Promise<void> {
    throw new Error('Not implemented')
  }
}
