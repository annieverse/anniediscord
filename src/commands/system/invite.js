const { ApplicationCommandType } = require(`discord.js`)
    /**
     * Generates Server & Bot invitation link
     * @author klerikdust
     */
module.exports = {
    name: `invite`,
    aliases: [`serverinvite`, `serverlink`, `linkserver`, `invitelink`, `invite`, `botinvite`, `invitebot`],
    description: `Generates Support Server & Bot Invitation link`,
    usage: `invite`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    permmissionInteger: 268823638,
    /**
     * Client/Bot invite generator.
     * @param {Client} client Current client instancee.
     * @return {string}
     */
    getBotInviteUrl(client) {
        return `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=${this.permmissionInteger}&scope=bot`
    },
    async execute(client, reply, message, arg, locale) {
        try {
            //  Attempt to send through DM.
            await this.sendInvites(message.author)
            return reply.send(locale.INVITE_LINK_SENT, { status: `success`, socket: { emoji: `:e_mail:` } })
        } catch (error) {
            // Send to channel if failed send attempt to dm
            return this.sendInvites(message.channel, client, reply, locale)
        }
    },
    async Iexecute(client, reply, interaction, options, locale) {
        try {
            //  Attempt to send through DM.
            await this.sendInvites(interaction.member)
            return reply.send(locale.INVITE_LINK_SENT, { status: `success`, socket: { emoji: `:e_mail:` } })
        } catch (error) {
            // Send to channel if failed send attempt to dm
            return this.sendInvites(interaction.channel, client, reply, locale)
        }
    },

    /**
     * Default template for sending invites.
     * @param {object} [targetChannel={}] target channel to be sent in..
     * @returns {void}
     */
    async sendInvites(targetChannel = {}, client, reply, locale) {
        await reply.send(locale.GENERATE_BOT_INVITE, {
            socket: { botInviteLink: `[Let's add me to your server!](${this.getBotInviteUrl(client)})` },
            field: targetChannel
        })
        return reply.send(locale.GENERATE_SERVER_INVITE, {
            simplified: true,
            socket: {
                serverLink: client.supportServer,
                emoji: await client.getEmoji(`692428927620087850`)
            },
            field: targetChannel
        })
    }
}