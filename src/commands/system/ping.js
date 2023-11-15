"use strict"
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType } = require(`discord.js`)
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
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(client,reply,locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client,reply,locale)
    },
    getPing(client){
        return commanifier(Math.floor(client.ws.ping))
    },
    async run(client,reply,locale){
        return await reply.send(locale.REQUEST_PING, {
            status: `success`,
            socket: {
                ping: this.getPing(client),
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    }
}