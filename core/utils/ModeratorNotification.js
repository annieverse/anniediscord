
/**
 *  Handles verification message. 
 *  This class is purposely to help user's verification done quicker by notifying the moderators.
 *  Hopefully will increase the rate of user staying in the server.
 * 
 *  This class is just like usual event submission check, portfolio check, etc
 *  It will passed into Worker.js and MessageController.js first, before getting into here.
 *  
 *  @ModNotification
 */
class ModNotification {


    /**
     * Default Params.
     * @param {Object} Components standard (this.data) parameter from `Worker.js`
     */
    constructor(Components) {
        this.message = Components.message
        this.bot = Components.bot
        this.logger = Components.bot.logger
        this.reply = Components.reply
        this.code = Components.code.VERIFICATION_REQUEST
        this.emoji = Components.emoji
        this.modRoleId = `551603523070984222` 
        this.verificationChId = `538843763544555528`
        this.moderatorChannelId = `588438012787163146`
    }


    /**
     *  Fetch #verification/roles-request channel metadata.
     *  @verificationChannel
     */
    get verificationChannel() {
        return this.message.guild.channels.get(this.verificationChId)
    }


    /**
     *  Fetch #overseer/moderator channel metadata.
     *  @moderatorChannel
     */
    get moderatorChannel() {
        return this.message.guild.channels.get(this.moderatorChannelId)
    }


    /**
     *  Fetch moderator role metadata.
     *  @modRole
     */
    get modRole() {
        return this.message.guild.roles.get(this.modRoleId)
    }


    /**
     *  Get all the users who has moderator role. Returns a collection of members.
     *  @modList
     */
    get modList() {
        return this.modRole.members
    }


    /**
     *  Filter mods with non-offline status. Returns non-offline mods.
     *  @currentlyActive
     */
    get currentlyActive() {
        return this.modList.filter(m => m.user.presence.status !== `offline`)
    }


    /**
     *  Parse into mentionable user based on their id. Returns flat `string`.
     *  @param {Array} ArrayOfId source of id to be parsed.
     *  @parseModsFromId
     */
    get fetchModId() {
        return this.currentlyActive.map(m => m.id)
    }


    /**
     *  Parse into mentionable user based on their id. Returns flat `string`.
     *  @param {Array} ArrayOfId source of id to be parsed.
     *  @parseModsFromId
     */
    parseModsFromId(ArrayOfId = []) {
        let str = ``
        for (let i = 0; i < ArrayOfId.length; i++) {
            str += `<@${ArrayOfId[i]}> `
        }
        return str
    }


    /**
     *  Check if the message author is a moderator (who has manage role permission)
     *  Returns Boolean
     */
    get senderIsModerator() {
        return this.message.member.hasPermission('MANAGE_ROLE')
    }


    /**
     *  Decide on which message to be sent based on specified condition.
     *  The message that user see will be removed within 60s.
     *  @sendResponse
     */
    sendResponse() {

        const availableMods = this.fetchModId

        //  Ignore if the sender was a moderator/admin. (to prevent unnecessary notification)
        if (this.senderIsModerator) return

        //  Handle unavailable mods.
        if (availableMods.length < 1) {

            //  Notify user if there's no mod currently around.
            this.reply(this.code.MODS_UNAVAILABLE, {
                socket: [this.message.author.username, this.emoji(`AnnieYandere`)],
                deleteIn: 60
            })

            //  Mention moderator role in #overseer channel.
            this.logger.info(`${this.message.author.username} has sent verification request, but no mods are around. I've pinged all mods in #${this.moderatorChannel.name} about this.`)
            return this.reply(this.code.NOTIFY_ALL_MODS, {
                socket: [this.modRole, this.emoji(`AnnieDead`), (this.verificationChannel).toString()],
                simplified: true,
                field: this.moderatorChannel
            })
        }

        //  Regular verifification message.
        this.logger.info(`New verification request by ${this.message.author.username}. I've notified ${availableMods.length} mods about this.`)
        return this.reply(this.code.NOTIFY_AVAILABLE_MODS, {
            socket: [this.parseModsFromId(availableMods)],
            simplified: true,
            deleteIn: 60
        })
    }
}

module.exports = ModNotification