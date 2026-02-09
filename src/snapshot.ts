import { Snapshot } from './types'

export class SnapshotManager {
  async create(sessionId: string, messageId: string): Promise<Snapshot> {
    throw new Error('Not implemented')
  }

  async get(messageId: string): Promise<Snapshot | null> {
    throw new Error('Not implemented')
  }

  async delete(messageId: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async cleanup(maxSnapshots: number): Promise<void> {
    throw new Error('Not implemented')
  }
}
