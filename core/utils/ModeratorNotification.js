
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
        this.isModerator = Components.isModerator
        this.setCooldown = Components.setCooldown
        this.isCooldown = Components.isCooldown
        this.modRoleId = `633393246902419469` 
        this.trialModRoleId = `683504516309450842`
        this.verificationChId = `538843763544555528`
        this.moderatorChannelId = `588438012787163146`
        this.moduleID = `${Components.message.author.id}-REQUESTING_VERIFICATION`
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
     *  Fetch trial moderator role metadata.
     *  @modRole
     */
    get trialModRole() {
        return this.message.guild.roles.get(this.trialModRoleId)
    }


    /**
     *  Get all the users who has moderator role. Returns a collection of members.
     *  @since 5.3.0
     *  @author klerikdust
     *  @param {RoleResolvable} role Use this.modRole or this.trialModRole
     */
    getModListFrom(role) {
        if (!role) throw new TypeError(`[ModeratorNotification.getModListFrom()] parameter "role" cannot be blank.`)
        return role.members
    }


    /**
     *  Filter mods with non-offline status. Returns non-offline mods.
     *  @since 5.3.0
     *  @author klerikdust
     *  @param {GuildMemberResolvable} members returned members object from this.getModListFrom()
     *  @returns {ArrayOfId}
     */
    currentlyActive(members) {
        if (!members) throw new TypeError(`[ModeratorNotification.activeMemberOf()] parameter "members" cannot be blank.`)
        return members.filter(m => m.user.presence.status !== `offline`).map(m => m.id)
    }


    /**
     *  Parse into mentionable user based on their id. Returns flat `string`.
     *  @param {Array} ArrayOfId source of id to be parsed.
     *  @returns {String}
     */
    parseId(ArrayOfId = []) {
        let str = ``
        for (let i = 0; i < ArrayOfId.length; i++) {
            str += `<@${ArrayOfId[i]}> `
        }
        return str
    }


    /**
     *  Decide on which message to be sent based on specified condition.
     *  The message that user see will be removed within 60s.
     *  @sendResponse
     */
    async sendResponse() {
        const availableTrialMods = this.currentlyActive(this.getModListFrom(this.trialModRole))
        const availableMods = this.currentlyActive(this.getModListFrom(this.modRole))
        const activeModerators = [...availableMods, ...availableTrialMods]

        //  Ignore if the sender was a moderator/admin. (to prevent unnecessary notification)
        if (this.isModerator) return
        //  Ignore if user still in cooling down state to avoid repetitive notifications/spam.
        if (await this.isCooldown(this.moduleID)) return
        this.setCooldown(this.moduleID, 60000)

        //  Handle unavailable mods.
        if (activeModerators.length < 1) {

            //  Notify user if there's no mod currently around.
            this.reply(this.code.MODS_UNAVAILABLE, {
                socket: [this.message.author.username, this.emoji(`AnnieYandere`)],
                deleteIn: 60
            })

            //  Mention moderator role in #overseer channel.
            this.logger.info(`${this.message.author.username} has sent verification request, but no mods are around. I've pinged all mods in #${this.moderatorChannel.name} about this.`)
            return this.reply(this.code.NOTIFY_ALL_MODS, {
                socket: [this.modRole, this.trialModRole, this.emoji(`AnnieDead`), (this.verificationChannel).toString()],
                simplified: true,
                field: this.moderatorChannel
            })
    
        }

        //  Regular verifification message.
        this.logger.info(`New verification request by ${this.message.author.username}. I've notified ${activeModerators.length} mods about this.`)
        return this.reply(this.code.NOTIFY_AVAILABLE_MODS, {
            socket: [this.parseId(activeModerators)],
            simplified: true,
            deleteIn: 20
        })
    }
}

module.exports = ModNotification