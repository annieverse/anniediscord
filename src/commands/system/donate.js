"use strict"
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
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        return await this.run(reply, locale)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(reply, locale)
    },
    async run(reply, locale){
        return await reply.send(locale.DONATE)
    }

}