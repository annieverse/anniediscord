const { ApplicationCommandType, PermissionFlagsBits, OAuth2Scopes } = require(`discord.js`)
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
        const link = client.generateInvite({
        permissions: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.UseExternalEmojis,
            PermissionFlagsBits.UseExternalStickers,
            PermissionFlagsBits.ManageMessages
        ],
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
        })
        return link
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
            await this.sendInvites(interaction.member, client, reply, locale, true)
            return reply.send(locale.INVITE_LINK_SENT, { status: `success`, socket: { emoji: `:e_mail:` } })
        } catch (error) {
            // Send to channel if failed send attempt to dm
            return this.sendInvites(interaction.channel, client, reply, locale)
        }
    },

    /**
     * Default template for sending invites.
     * @param {Object} [targetChannel={}] target channel to be sent in..
     * @param {Discord.Client} client The client passthrough parameter
     * @param {Function} reply The reply passthrough parameter
     * @param {Object} locale The locale passthrough parameter
     * @param {Boolean} dm whether or not to try and send message as a Direct message
     * @returns {void}
     */
    async sendInvites(targetChannel = {}, client, reply, locale, dm=false) {
        await reply.send(locale.GENERATE_BOT_INVITE, {
            socket: { botInviteLink: `[Let's add me to your server!](${this.getBotInviteUrl(client)})` },
            field: targetChannel,
            dm: dm
        })
        return await reply.send(locale.GENERATE_SERVER_INVITE, {
            simplified: true,
            socket: {
                serverLink: client.supportServer,
                emoji: await client.getEmoji(`692428927620087850`)
            },
            field: targetChannel,
            followUp:true,
            dm: dm
        })
    }
}