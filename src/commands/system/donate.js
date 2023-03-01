const { ApplicationCommandType } = require(`discord.js`)

/**
 * Command's Class description
 * @author Pan
 */
module.exports = {
    name: `donate`,
    aliases: [],
    description: `Provides link to our donate link if you wish to support us further`,
    usage: `donate`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: false,
    messageCommand: false,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        await reply.send(`Please ask in our support server how you can support us.`)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        await reply.send(`Please ask in our support server how you can support us.`)
    }

}