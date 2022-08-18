const fetch = require(`node-fetch`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Switch your profile theme to Light or Dark.
 * @author Andrew
 */
module.exports = {
    name: `test`,
    aliases: [],
    description: `Switch your profile theme to Light or Dark.`,
    usage: `test`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: false,
    options: [{
        name: `attachment`,
        description: `text file`,
        type: ApplicationCommandOptionType.Attachment,
        required: true
    }],
    type: ApplicationCommandType.ChatInput,
    async Iexecute(client, reply, interaction, options, locale) {
        let file = options.getAttachment(`attachment`)
        try {
            console.log(`fetching`)
            // fetch the file from the external URL
            const response = await fetch(file.url)

            // if there was an error send a message with the status
            if (!response.ok)
                return console.log(`error with getting response`)

            // take the response stream and read it to completion
            const text = await response.text()

            if (text) {
                interaction.channel.send(`${text.substring(0, 2000)}`)
            }
        } catch (error) {
            console.log(error)
        }
    },
}