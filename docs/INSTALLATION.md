# Installation Guide

## Prerequisites

- Node.js >= 18.0.0
- OpenCode installed and running
- npm or yarn

## Installation Methods

### Method 1: Local Development (Recommended for Testing)

```bash
# 1. Clone and build the plugin
cd /path/to/opencode-restore-plugin
npm install
npm run build

# 2. Create global npm link
npm link

# 3. Link to OpenCode plugins directory
mkdir -p ~/.config/opencode/plugins
cd ~/.config/opencode/plugins
npm link opencode-restore-plugin
```

### Method 2: Direct Symlink

```bash
# 1. Build the plugin
cd /path/to/opencode-restore-plugin
npm install
npm run build

# 2. Create symlink
mkdir -p ~/.config/opencode/plugins
ln -s /path/to/opencode-restore-plugin ~/.config/opencode/plugins/opencode-restore-plugin
```

### Method 3: From npm (After Publishing)

```bash
# Install globally
npm install -g opencode-restore-plugin

# Or add to OpenCode config
# Edit ~/.config/opencode/config.json
{
  "plugins": ["opencode-restore-plugin"]
}
```

## Configuration

Create or edit `~/.config/opencode/plugins/opencode-restore-plugin/config.json`:

```json
{
  "maxSnapshots": 10,
  "snapshotDir": "~/.cache/opencode/snapshots",
  "autoCleanup": true,
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "*.log"
  ],
  "maxSnapshotSize": 100,
  "includeBinary": false
}
```

## Verification

### 1. Check Plugin is Loaded

Start OpenCode and check the logs:

```bash
opencode
# Look for: "OpenCode Restore Plugin initialized"
```

### 2. Test Commands

In OpenCode, try:

```bash
# Command palette
/restore

# Or use keyboard shortcut
Cmd+Shift+Z (macOS)
Ctrl+Shift+Z (Windows/Linux)
```

### 3. Test Functionality

```bash
# 1. Make some changes with AI
# 2. Press Cmd+Shift+Z to restore
# 3. Files should revert to pre-change state
```

## Troubleshooting

### Plugin Not Loading

**Check plugin directory:**
```bash
ls -la ~/.config/opencode/plugins/
```

**Check OpenCode logs:**
```bash
tail -f ~/.config/opencode/logs/opencode.log
```

### Build Errors

```bash
# Clean and rebuild
cd /path/to/opencode-restore-plugin
rm -rf dist node_modules
npm install
npm run build
```

### Permission Errors

```bash
# Fix permissions
chmod -R 755 ~/.config/opencode/plugins/opencode-restore-plugin
```

### Snapshot Directory Issues

```bash
# Create snapshot directory manually
mkdir -p ~/.cache/opencode/snapshots
chmod 755 ~/.cache/opencode/snapshots
```

## Uninstallation

### Method 1: Remove Link

```bash
cd ~/.config/opencode/plugins
npm unlink opencode-restore-plugin
# or
rm opencode-restore-plugin
```

### Method 2: Remove Global Package

```bash
npm uninstall -g opencode-restore-plugin
```

### Clean Up Snapshots

```bash
rm -rf ~/.cache/opencode/snapshots
```

## Development Mode

For plugin development:

```bash
# 1. Watch mode for TypeScript
npm run dev

# 2. Run tests
npm test

# 3. Test standalone (without OpenCode)
npm run example:standalone
```

## Next Steps

- Read [Usage Guide](./USAGE.md) for detailed usage instructions
- Check [API Documentation](./API.md) for programmatic usage
- See [Development Guide](./DEVELOPMENT.md) for contributing
