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
        command.description.length >= 100 ? command.description = `${command.description.substring(0, 90)}...` : command.description
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
    }).setToken(process.env.BOT_TOKEN);

    (async() => {
        try {
            logger.info(`Started refreshing application (/) commands.`)
            if (process.env.NODE_ENV === `production`) {
                await rest.put(
                    Routes.applicationCommands(`501461775821176832`), {
                        body: applicationCommands
                    },
                )
            } else {
                /**
                 * For Pan's local bot use only
                 */
                await rest.put(
                    Routes.applicationGuildCommands(`514688969355821077`, `577121315480272908`), {
                        body: applicationCommands
                    },
                ) 
                
                /**
                 * For Annie's local bot use only
                 */
                /* await rest.put(
                    Routes.applicationGuildCommands(`501461775821176832`, `577121315480272908`), {
                        body: applicationCommands
                    },
                ) */
                
                /**
                 * For Naph's local bot use only
                 */
                /* await rest.put(
                    Routes.applicationGuildCommands(`**NAPH PUT BOT CLIENT ID HERE**`, `577121315480272908`), {
                        body: applicationCommands
                    },
                )  */
            }
            logger.info(`Successfully reloaded application (/) commands. ${applicationCommands.size} Commands`)
        } catch (error) {
            logger.error(error)
        }
    })()
}