const {
    REST
} = require(`@discordjs/rest`)
const {
    Routes
} = require(`discord-api-types/v9`)
    /**
     * Agreggate all the available commands into unified object.
     * @param {object} logger object
     * @param {array} array of commands from commands loader
     * @return {void}
     */
module.exports = function applicationCommandLoader({
    logger,
    commands
}) {

    function formatDescriptions(command) {
        command.description.length > 100 ? `${command.description.substring(0, 95)}...` : command.description
    }

    function isApplicationCommand(command) {
        return command.applicationCommand
    }
    let applicationCommands = commands.filter(isApplicationCommand)

    applicationCommands.forEach(item => {
        formatDescriptions(item)
    })

    const rest = new REST({
        version: `9`
    }).setToken(process.env.BOT_TOKEN);

    (async() => {
        try {
            logger.info(`Started refreshing application (/) commands.`)
            if (process.env.ENV === `production`) {
                await rest.put(
                    Routes.applicationCommands(`501461775821176832`), {
                        body: applicationCommands
                    },
                )
            } else {
                await rest.put(
                    Routes.applicationGuildCommands(`514688969355821077`, `577121315480272908`), {
                        body: applicationCommands
                    },
                )
            }
            logger.info(`Successfully reloaded application (/) commands. ${applicationCommands.size} Commands`)
        } catch (error) {
            logger.error(error)
        }
    })()
}