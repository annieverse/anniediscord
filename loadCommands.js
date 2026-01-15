require(`dotenv`).config()
const commandsLoader = require(`./src/commands/loader.js`)
const createLogger = require(`./pino.config.js`)
const logger = createLogger.child({ action: `LOAD_APPLICATION_COMMANDS` })
const { APPLICATION_COMMANDS, GUILDONLY_COMMANDS } = commandsLoader({ logger: logger })
const applicationCommandLoader = require(`./src/commands/applicationCommandsLoader.js`)
// IF you want to test server specific commands you will need to edit this to stop the overrides.
applicationCommandLoader({ logger: logger, commands: APPLICATION_COMMANDS, guildOnly: false })
applicationCommandLoader({ logger: logger, commands: GUILDONLY_COMMANDS, guildOnly: true })