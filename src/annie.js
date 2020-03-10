const Discord = require(`discord.js`)
const config = require(`./config/global`)
const ascii = require(`./config/startupAscii`)
const CommandsLoader = require(`./struct/commands/loader`)
const Database = require(`./struct/database`)
const logger = require(`./struct/logger`)
const Keyv = require(`keyv`)
const Express = require(`express`)
const locale = require(`./locales/default`)
const getBenchmark = require(`./utils/getBenchmark`)
const { Client } = require(`klasa`)


logger.debug(ascii.default)
logger.info(`Initializing ${process.env.NODE_ENV} server...`)

process.on(`unhandledRejection`, err => {
	logger.error(`Promise Rejection > ${err.stack}`)
})

const client = new Client({
    fetchAllMembers: false,
    prefix: config.prefix,
    commandEditing: true,
    typing: true,
    readyMessage: (client) => `Successfully initialized. Ready to serve ${client.guilds.size} guilds.`
})

logger.debug(`finish`)

