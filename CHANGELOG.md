# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-02-09

### Added
- Initial release
- Core snapshot and restore functionality
- File tracking with MD5 hash
- Automatic snapshot creation before message sending
- File conflict detection
- Snapshot cleanup mechanism
- Command panel integration (`/restore`)
- Keyboard shortcut support (Cmd+Shift+Z / Ctrl+Shift+Z)
- Comprehensive unit tests

### Features
- Restore messages and files to pre-send state
- Track AI-modified files
- Configurable exclude patterns
- Configurable snapshot limits
- Support for large file handling

### Technical
- TypeScript implementation
- Jest testing framework
- fast-glob for file searching
- MD5 hash for file integrity
