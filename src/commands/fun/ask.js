const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
const Command = require(`../../libs/commands`)
    /**
     * You can ask any question and Annie will answer you.
     * @author klerikdust
     */
module.exports = {
    name: `ask`,
    aliases: [`8ball`],
    description: `You can ask any question and Annie will answer you.`,
    usage: `ask <Message>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    options: [
        {name: `question`, description: `You can ask any question and Annie will answer you.`, required: true, type: ApplicationCommandOptionType.String}
    ],
    async execute(client, reply, message, arg, locale) {
        if (!arg) return reply.send(locale.ASK.SHORT_GUIDE)
        const pool = locale.ASK.ANSWERS
        return reply.send(pool[Math.floor(Math.random() * pool.length)])
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const pool = locale.ASK.ANSWERS
        return reply.send(pool[Math.floor(Math.random() * pool.length)])
    }
}