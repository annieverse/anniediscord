# GitHub Copilot Instructions

## Project Overview
This is a Discord bot named "Annie" built using the Discord.js as the core framework.

## Technology Stack

- Framework: Discord.js v14+
- Runtime: Node.js
- Language: JavaScript/TypeScript
- Database: PostgreSQL as primary db and Redis as cache db.
- Additional Libraries: 
    "@discordjs/rest": "^2.4.0",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/commit-analyzer": "^13.0.0",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/npm": "^12.0.1",
    "@semantic-release/release-notes-generator": "^14.0.0",
    "@top-gg/sdk": "^3.1.5",
    "axios": "^1.7.7",
    "bfd-api-redux": "^1.2.4-beta",
    "buffer-image-size": "^0.6.4",
    "canvas": "^3.1.2",
    "canvas-constructor": "^7.0.2",
    "color": "^4.1.0",
    "contrast-color": "^1.0.1",
    "cron-job-manager": "^2.1.4",
    "cross-env": "^7.0.3",
    "csv-stringify": "^6.5.1",
    "discord.js": "^14.16.3",
    "eslint": "^9.11.1",
    "express": "^5.1.0",
    "fs-nextra": "^0.5.1",
    "knex": "^3.1.0",
    "node-cmd": "^5.0.0",
    "pg": "^8.12.0",
    "pg-copy-streams": "^6.0.6",
    "pino": "^9.4.0",
    "pixiv-api-client": "^0.24.0",
    "pixiv-img": "^1.0.0",
    "redis": "^4.7.0",
    "string-similarity": "^4.0.2",
    "superagent": "^10.2.3",
    "uuid": "^11.1.0
    "chai": "^5.1.1",
    "dotenv": "^16.4.5",
    "mocha": "^11.7.1",
    "nodemon": "^3.1.7",
    "pino-pretty": "^13.0.0",
    "sinon": "^19.0.2"

## Coding Standards & Conventions
### General Guidelines

Use modern JavaScript/TypeScript features (ES6+, primarily async/await)
Follow consistent naming conventions (camelCase for variables/functions, PascalCase for classes, and UPPER_CASE for static variables)
Write descriptive variable and function names
Add JSDoc comments for functions and classes whenever possible
Handle errors gracefully with try-catch blocks
Use the pino's wrapper (client.logger) instead of console.log
Prioritize Discord.js v14+ syntax and patterns
Always include proper error handling in suggestions
Suggest modern JavaScript/TypeScript features
Consider Discord API rate limits in implementations
Provide complete, working code examples
Include relevant imports and dependencies


### Error Handling

Always wrap Discord API calls in try-catch blocks
Provide user-friendly error messages
Log errors for debugging purposes
Use ephemeral replies for error messages when possible

### Performance

Use efficient database queries
Implement caching where appropriate
Avoid unnecessary API calls
Use bulk operations for multiple database operations

### Security

Validate all user inputs
Use environment variables for sensitive data

### Database Operations

Use async/await for database operations
Implement proper connection handling
Use transactions for multiple related operations
Handle connection errors gracefully

### Middleware/Guards

Always use permission checks
Take care of cooldown systems
Validate command prerequisites

### Testing Guidelines

Write unit tests for utility functions
Test command responses and error handling
Mock Discord.js objects for testing
Test database operations with test databases


### Common Issues to Avoid

Don't use message.channel.send() in slash command responses
Always handle Promise rejections
Don't store sensitive data in code
Avoid hardcoding server/channel IDs
Don't exceed Discord API rate limit