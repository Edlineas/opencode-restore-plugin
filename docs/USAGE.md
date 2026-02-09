# Usage Guide

## Basic Usage

### Restore Last Message

The quickest way to restore files:

**Keyboard Shortcut:**
- macOS: `Cmd+Shift+Z`
- Windows/Linux: `Ctrl+Shift+Z`

This will:
1. Revert the last AI message
2. Restore all modified files to their pre-message state

### Restore Specific Message

**Command Palette:**
1. Open command palette (`Cmd+K` or `Ctrl+K`)
2. Type `/restore` or `Restore Message`
3. Select the message to restore

## How It Works

### 1. Automatic Snapshots

Before you send each message, the plugin automatically:
- Captures the current state of all workspace files
- Calculates MD5 hashes for integrity
- Stores the snapshot in `~/.cache/opencode/snapshots/`

### 2. Change Tracking

After AI responds, the plugin:
- Compares file hashes before and after
- Records which files were modified
- Updates the snapshot with modification list

### 3. Restoration

When you trigger restore:
- Retrieves the snapshot for that message
- Checks for file conflicts (manual edits after AI)
- Restores files to snapshot state
- Reverts the AI message in OpenCode

## Common Scenarios

### Scenario 1: AI Made Wrong Changes

```
1. AI modifies files incorrectly
2. Press Cmd+Shift+Z
3. Files restored, message reverted
4. Edit your prompt and try again
```

### Scenario 2: Restore Multiple Messages Back

```
1. Open command palette
2. Type /restore
3. Select an earlier message
4. All changes since that message are reverted
```

### Scenario 3: File Conflicts

If you manually edited files after AI:

```
⚠️  File conflicts detected: src/index.ts
Files were modified after snapshot. 
Restore aborted to prevent data loss.
```

**Resolution:**
- Commit or stash your manual changes
- Then retry restore

## Configuration

### Exclude Patterns

Add patterns to skip certain files:

```json
{
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "*.log",
    "tmp/**"
  ]
}
```

### Snapshot Limits

Control snapshot storage:

```json
{
  "maxSnapshots": 10,        // Keep last 10 snapshots per session
  "maxSnapshotSize": 100,    // Skip files > 100MB
  "autoCleanup": true        // Auto-delete old snapshots
}
```

### Binary Files

Include/exclude binary files:

```json
{
  "includeBinary": false     // Skip images, videos, etc.
}
```

## Advanced Usage

### Programmatic Usage

```typescript
import OpenCodeRestorePlugin from 'opencode-restore-plugin'
import { createOpencodeClient } from '@opencode-ai/sdk'

const client = createOpencodeClient()
const plugin = new OpenCodeRestorePlugin('/path/to/workspace')

await plugin.initialize(client)
await plugin.restoreMessage('message-id', 'session-id')
```

### Standalone Usage (Without OpenCode)

```typescript
import { SnapshotManager, RestoreEngine } from 'opencode-restore-plugin'

const manager = new SnapshotManager('/path/to/workspace')
const engine = new RestoreEngine('/path/to/workspace')

// Create snapshot
const snapshot = await manager.create('session-1', 'msg-1')

// Restore later
await engine.restore(snapshot)
```

## Best Practices

### 1. Regular Cleanup

Snapshots can accumulate. Clean up periodically:

```bash
# Manual cleanup
rm -rf ~/.cache/opencode/snapshots/old-session-*

# Or enable auto-cleanup in config
{
  "autoCleanup": true,
  "maxSnapshots": 10
}
```

### 2. Exclude Large Directories

Always exclude:
- `node_modules/`
- `.git/`
- Build outputs (`dist/`, `build/`)
- Log files

### 3. Commit Before Major Changes

Before asking AI to make major refactors:
```bash
git commit -am "Before AI refactor"
```

This gives you an additional safety net.

### 4. Review Before Restore

Check what will be restored:
- Look at the message timestamp
- Verify it's the right restore point
- Consider if you made manual edits since

## Limitations

### What Gets Restored
✅ File content
✅ New files (deleted on restore)
✅ Deleted files (recreated on restore)

### What Doesn't Get Restored
❌ Git commits
❌ Running processes
❌ Database changes
❌ External API calls
❌ Files outside workspace

### File Size Limits
- Files > 100MB are skipped by default
- Binary files are skipped by default
- Adjust in config if needed

## Troubleshooting

### "Snapshot not found"

**Cause:** Snapshot was deleted or session is too old

**Solution:**
- Check `~/.cache/opencode/snapshots/`
- Increase `maxSnapshots` in config
- Can't restore if snapshot is gone

### "File conflicts detected"

**Cause:** You edited files after AI

**Solution:**
```bash
# Option 1: Commit your changes
git add .
git commit -m "My changes"

# Option 2: Stash your changes
git stash

# Then retry restore
```

### Restore is Slow

**Cause:** Large workspace or many files

**Solution:**
- Add more exclude patterns
- Increase `maxSnapshotSize` limit
- Use SSD for snapshot directory

## FAQ

**Q: Can I restore after closing OpenCode?**
A: Yes, snapshots persist in `~/.cache/opencode/snapshots/`

**Q: How much disk space do snapshots use?**
A: Depends on project size. Typically 10-100MB per snapshot.

**Q: Can I restore across different machines?**
A: No, snapshots are local to the machine.

**Q: Does restore affect Git history?**
A: No, it only modifies file content, not Git commits.

**Q: Can I disable auto-snapshots?**
A: Not currently. Snapshots are core to the plugin.

## Support

- GitHub Issues: https://github.com/Edlineas/opencode-restore-plugin/issues
- Documentation: https://github.com/Edlineas/opencode-restore-plugin/docs
