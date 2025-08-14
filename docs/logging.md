# Enhanced Logging System

This document describes the enhanced logging system implemented for Annie Discord Bot to support production-grade logging with file streaming and standardized JSON format.

## Environment Variables

Add the following environment variables to your `.env` file:

### LOGS_LEVEL
Controls the logging level. Supports Pino's standard levels:
- `fatal` (60) - Highest level
- `error` (50)
- `warn` (40)
- `info` (30)
- `debug` (20)
- `trace` (10) - Lowest level

**Default values:**
- Development: `debug`
- Production: `info`

**Example:**
```bash
LOGS_LEVEL=debug    # Show all logs including debug
LOGS_LEVEL=info     # Show info, warn, error, fatal only
```

### STREAM_LOGS_TO_FILES
Boolean flag to enable/disable file streaming to `.logs` directory:
- `1` - Enable file streaming
- `0` - Disable file streaming (console only)

**Example:**
```bash
STREAM_LOGS_TO_FILES=1    # Enable file logging
STREAM_LOGS_TO_FILES=0    # Console logging only
```

## Standardized Log Format

### Required Fields
- `requestId` - UUID v4 for tracking request flows
- `action` - Action being performed (snake_case recommended)
- `timestamp` - ISO timestamp (automatically added by Pino)

### Optional Fields
- `userId` - Discord user ID
- `guildId` - Discord guild (server) ID
- `channelId` - Discord channel ID
- `shardId` - Shard identifier (e.g., "SHARD_ID:0/CAKE")
- `context` - Additional context data, legacy logs

### Example Log Entry
```json
{
  "level": "info",
  "time": "2025-08-14T11:07:00.567Z",
  "name": "MASTER_SHARD",
  "requestId": "9e391342-d73c-4123-ac4b-30e6aeb15cbf",
  "action": "master_startup",
  "context": "Testing master logger with file streaming"
}
```

## Usage Examples

### Basic Standardized Logging
```javascript
const { createStandardLog } = require('./utils/standardLogger')
const { masterLogger } = require('../pino.config.js')

// Basic log with action
logger.info(createStandardLog('user_login_successful'))

// Log with additional context
logger.warn(createStandardLog('database_connection_slow', {
  userId: '123456789',
  context: 'Connection took 5.2 seconds'
}))

// Log with all optional fields
logger.error(createStandardLog('command_execution_failed', {
  requestId: 'custom-request-id',
  userId: '123456789',
  guildId: '987654321',
  channelId: '555666777',
  context: {
    command: '/profile',
    error: 'Database timeout',
    duration_ms: 30000
  }
}))
```

### Shard Logger (Recommended)
```javascript
const { createShardLogger } = require('./utils/standardLogger')
const { shardLogger } = require('../pino.config.js')

// Create enhanced logger for a shard
const logger = createShardLogger(shardLogger('SHARD_ID:0/CAKE'), 'SHARD_ID:0/CAKE')

// Shard ID is automatically included
logger.info('shard_ready')
logger.error('command_failed', {
  userId: '123456789',
  context: 'Permission denied'
})

// Access original logger if needed
logger._original.debug('Raw debug message')
```

### Migrating Legacy Logs
```javascript
// Old format (preserve as context)
logger.error('[GUILD_SETUP] Failed to configure guild settings')

// New format
logger.error(createStandardLog('guild_setup_failed', {
  guildId: guildId,
  context: 'Failed to configure guild settings'
}))

// Complex legacy logs
const legacyLogData = {
  message: '[COMPLEX] Multiple data points',
  data: { key1: 'value1', key2: 'value2' },
  timestamp: new Date()
}

logger.warn(createStandardLog('complex_operation_warning', {
  context: legacyLogData
}))
```

## File Organization

When `STREAM_LOGS_TO_FILES=1`:
- Log files are stored in `.logs/` directory
- Separate files per logger: `master_shard.log`, `database.log`, `localizer.log`
- Files are automatically created when first log is written
- Files contain newline-delimited JSON (NDJSON) format

## Log Rotation and Cleanup

### Automatic Cleanup
- Runs daily at 2:00 AM (configurable)
- Removes log files older than 7 days
- Only processes `.log` files in the `.logs` directory
- Cleanup status is logged to the system

### Manual Cleanup
```javascript
const { cleanupOldLogs } = require('./utils/logCleanup')

// Clean logs older than 7 days
const result = await cleanupOldLogs()
console.log(result.message)
console.log('Removed files:', result.removedFiles)

// Custom directory and age
const customResult = await cleanupOldLogs('/custom/logs', 14) // 14 days
```

## Debugging and Development

### Development Environment
```bash
NODE_ENV=development
STREAM_LOGS_TO_FILES=1
LOGS_LEVEL=debug
```
- Shows all log levels including debug and trace
- Optionally pipe to `pino-pretty` for readable output: `npm run dev`

### Production Environment
```bash
NODE_ENV=production
STREAM_LOGS_TO_FILES=1
LOGS_LEVEL=info
```
- Shows info, warn, error, fatal levels only
- Raw JSON format optimized for log analysis tools
- Files automatically rotated and cleaned up

### Troubleshooting

**No log files being created:**
- Check `STREAM_LOGS_TO_FILES=1` is set
- Verify `.logs` directory permissions
- Check console for "Failed to create file destination" errors

**Log files too large:**
- Files automatically rotate at 100MB
- Adjust rotation in `pino.config.js` if needed

**Missing logs:**
- Check `LOGS_LEVEL` setting
- Verify log level of missing messages
- Use `LOGS_LEVEL=debug` temporarily for investigation

## Integration with External Tools

The standardized JSON format works well with:
- **lnav** - Advanced log file navigator
- **jq** - Command-line JSON processor
- **ELK Stack** - Elasticsearch, Logstash, Kibana
- **Splunk** - Enterprise log analysis
- **Grafana Loki** - Log aggregation system

### Example lnav usage:
```bash
lnav .logs/*.log
```

### Example jq filtering:
```bash
# Show all errors from today
cat .logs/master_shard.log | jq 'select(.level=="error")'

# Show logs for specific user
cat .logs/*.log | jq 'select(.userId=="123456789")'

# Count actions by type
cat .logs/*.log | jq -r '.action' | sort | uniq -c
```