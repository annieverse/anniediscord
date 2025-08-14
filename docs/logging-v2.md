# v2 Logger Structure Documentation

## Overview

The v2 logger structure provides a standardized JSON format for all logging operations while maintaining backward compatibility with existing log calls.

## Environment Variables

Add these variables to your `.env` file:

```env
# Log level control (debug, info, warn, error)
LOGS_LEVEL=info

# Enable/disable file streaming (1 to enable, 0 to disable)
STREAM_LOGS_TO_FILES=1
```

## Configuration Behavior

### Development Environment (`NODE_ENV=development`)
- **Pretty printed logs** to console (human-readable format)
- **All log levels** shown (including debug and trace)
- **Optional file streaming** if `STREAM_LOGS_TO_FILES=1`

### Production Environment (`NODE_ENV=production`)
- **Raw JSON format** for optimal processing
- **Limited log levels** (info, warn, error only)
- **File streaming** controlled by `STREAM_LOGS_TO_FILES`

## Log Structure

All logs now follow this standardized JSON format:

```javascript
{
  "requestId": "uuid-v4-string",      // Required: Unique identifier for this log entry
  "action": "action_name_snake_case", // Required: Action being performed
  "timestamp": "2024-01-01T00:00:00.000Z", // Required: ISO timestamp
  
  // Optional contextual data (only included when available)
  "userId": "discord-user-id",
  "guildId": "discord-guild-id", 
  "channelId": "discord-channel-id",
  "shardId": "SHARD_ID:0/CAKE",
  "context": "additional data or legacy log messages"
}
```

## Usage Examples

### Creating Structured Logs

```javascript
const { createStructuredLog } = require('./src/utils/structuredLogger')

// Basic structured log
const logEntry = createStructuredLog({
  action: 'user_command_executed',
  userId: '123456789',
  guildId: '987654321',
  context: { command: 'profile', duration: '150ms' }
})

logger.info(logEntry)
```

### Wrapping Legacy Logs

```javascript
const { wrapLegacyLog } = require('./src/utils/structuredLogger')

// Convert existing log messages
const legacyMessage = 'Database connection established'
const wrapped = wrapLegacyLog('database_connection_success', legacyMessage)

logger.info(wrapped)
```

### Migration Strategy

Existing log calls can be gradually migrated:

```javascript
// Before (legacy)
logger.error(`Failed to process command: ${error.message}`)

// After (structured, preserving legacy)
logger.error(wrapLegacyLog(
  'command_processing_failed', 
  `Failed to process command: ${error.message}`,
  { userId, guildId, error: error.stack }
))
```

## File Streaming

When `STREAM_LOGS_TO_FILES=1`:

- Logs are written to `.logs/` directory
- Each logger creates its own JSON file:
  - `master_shard.json`
  - `database.json` 
  - `localizer.json`
  - `shard_id_x_name.json`
- Files are automatically cleaned up after 7 days
- JSON format allows for easy parsing with tools like `jq`, `lnav`, etc.

## Action Naming Convention

Use snake_case for action names to maintain consistency:

- ✅ `user_command_executed`
- ✅ `database_query_successful`
- ✅ `shard_connection_lost`
- ❌ `userCommandExecuted`
- ❌ `database-query-successful`

## Best Practices

1. **Always include action**: Every log should have a descriptive action name
2. **Preserve context**: Use the `context` field to maintain debugging information
3. **Include relevant IDs**: Add userId, guildId, etc. when available
4. **Gradual migration**: Wrap existing logs rather than rewriting everything at once
5. **Use appropriate log levels**: Info for normal operations, warn for issues, error for failures

## Backward Compatibility

- All existing logger calls continue to work unchanged
- Legacy log messages are automatically preserved in the `context` field
- No breaking changes to existing functionality
- Migration can be done incrementally across the codebase