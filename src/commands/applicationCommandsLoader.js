"use strict"
const {
    REST
} = require(`@discordjs/rest`)
const {
    Routes
} = require(`discord.js`)

module.exports = function applicationCommandLoader({
    logger,
    commands
}) {
    function formatDescriptions(command) {
        if (command.type === 3) return command.description = null
        return command.description.length >= 100 ? command.description = `${command.description.substring(0, 90)}...` : command.description
    }

    function isApplicationCommand(command) {
        return command.applicationCommand
    }
    let applicationCommands = commands.filter(isApplicationCommand)

    applicationCommands.forEach(item => {
        formatDescriptions(item)
    })

    const rest = new REST({
        version: `10`
    }).setToken(process.env.BOT_TOKEN)

    const NODE_ENVIRONMENT_CLIENT_ID = process.env.NODE_ENV === `production` ? `501461775821176832` : process.env.NODE_ENV === `production_beta` ? `788001359349547039` : null

    if (!NODE_ENVIRONMENT_CLIENT_ID && process.env.NODE_ENV !== `development`) { return process.exit(9) }

    (async () => {
        try {
            logger.info(`Started refreshing application (/) commands.`)
            if (process.env.NODE_ENV === `production` || process.env.NODE_ENV === `production_beta`) {
                logger.info(`UPLOADING COMMANDS`)
                await rest.put(
                    Routes.applicationCommands(NODE_ENVIRONMENT_CLIENT_ID), {
                    body: applicationCommands
                },
                )
            } else {
                if (process.env.NODE_DEV_CLIENT === `PAN`) {
                    /**
                     * For Pan's local bot use only
                     */
                    // Annie support server
                    await rest.put(
                        Routes.applicationGuildCommands(`514688969355821077`, `577121315480272908`), {
                        body: applicationCommands
                    },
                    )
                    // Pan's test server
                    await rest.put(
                        Routes.applicationGuildCommands(`514688969355821077`, `597171669550759936`), {
                        body: applicationCommands
                    },
                    )
                } else if (process.env.NODE_DEV_CLIENT === `NAPH`) {
                    /**
                     * For Naph's local bot use only
                     */
                    await rest.put(
                        Routes.applicationGuildCommands(`581546189925646350`, `577121315480272908`), {
                        body: applicationCommands
                    },
                    )
                }
            }
            logger.info(`Successfully reloaded application (/) commands. ${applicationCommands.size} Commands`)
        } catch (error) {
            logger.error(error)
        }
    })()
}
