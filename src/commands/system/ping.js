const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Output bot's latency
     * @author klerikdust
     */
module.exports = {
    name: `ping`,
    aliases: [`pong`, `p1ng`, `poing`],
    description: `Output bot's latency`,
    usage: `ping`,
    permissionLevel: 0,
    applicationCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return reply.send(locale.REQUEST_PING, {
            status: `success`,
            socket: {
                ping: commanifier(Math.floor(client.ws.ping)),
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return reply.send(locale.REQUEST_PING, {
            status: `success`,
            socket: {
                ping: commanifier(Math.floor(client.ws.ping)),
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    }
}