const Pistachio = require(`./Pistachio`)
/**
 *  Boilerplate for handling Classroom System.
 *  @ClassroomManager
 */
class ClassroomManager {
    constructor(Components) {
		this.components = { 
			user: Components.user, 
			reaction: Components.reaction, 
			bot:Components.bot, 
            message:Components.reaction.message, 
			meta: {author:null}
        }
        this.userGuild = Components.reaction.message.guild.members.get(Components.user.id)
        this.logger = Components.bot.logger
        this.pistachio = new Pistachio(this.components).bag()
        this.keyv = Components.bot.keyv
        this.cdlabel = `classnotifcd:${Components.user.id}`
    }


    /**
     *  Fetching Apprentice role data from guild.
     *  @apprenticeshipRole
     */
    get apprenticeshipRole() {
        return this.components.message.guild.roles.get(`621714766947287052`)
    }


    /**
     *  Fetching Classroom channel data from guild.
     *  @classroomChannel
     */
    get classroomChannel() {
        return this.components.message.guild.channels.get(`621705949429891074`)
    }


    /**
     *  Assigning role to the user
     *  @param {Object|RoleData} roleData
     *  @assignColor
     */
    assignRole(roleData) {
        if (!roleData) return
        this.userGuild.addRole(roleData.id)
        this.logger.info(`${this.components.user.username} has received ${roleData.name} from Classroom Guide channel.`)
    }


    /**
     *  Removing role from the user
     *  @param {Object|RoleData} roleData
     *  @revokeRole
     */
    revokeRole(roleData) {
        if (!roleData) return
        this.userGuild.removeRole(roleData.id)
        this.logger.info(`${this.components.user.username} has revoked ${roleData.name} from Classroom Guide channel.`)
    }


    /**
     *  Check if user already has the role or not.
     *  @param {Object|RoleData} roleData
     *  @userHasRole
     */
    userHasRole(roleData) {
        return this.userGuild.roles.has(roleData.id)
    }


    /**
     *  Sending notification to the classroom based of Pistachio framework.
     *  @param {String} content of the message
     *  @classroomNotification
     */
    classroomNotification(content = ``) {
        if (!content.length) return
        return this.pistachio.reply(content, {field: this.classroomChannel, simplified: true})
    }


    /**
     *  Set up cooldown state.
     *  @param {Number} time timeout until the key disappear.
     *  @classroomNotificationSetCooldown
     */
    classroomNotificationSetCooldown(time = 0) {
        this.keyv.set(this.cdlabel, `1`, time)
    }


    /**
     *  Check if user currently in cooldown state.
     *  @classroomNotificationCurrentlyCoolingdown
     */
    async classroomNotificationCurrentlyCoolingdown() {
        return await this.keyv.get(this.cdlabel)
    }


    /**
     *  Executing sequence for messageReactionAdd.js
     *  @Add
     */
    async Add() {
        const Apprenticeship = this.apprenticeshipRole

        try {
            //  Assign role and redirect user.
            this.assignRole(Apprenticeship)
            //  Skip notification if user still in cooldown state.
            if (await this.classroomNotificationCurrentlyCoolingdown()) return
            this.classroomNotificationSetCooldown(3600000)
            return this.classroomNotification(`${this.components.user} has joined the classroom!`)
        }
        catch (e) {
            //  Incase there's an unexpected error
            return this.logger.error(`Failed to assign ${Apprenticeship.name} key to ${this.components.user.username}. > ${e.stack}`)
        }
    }


    /**
     *  Executing sequence for messageReactionRemove.js
     *  @Remove
     */
    Remove() {
        const Apprenticeship = this.apprenticeshipRole

        //  Return if user dont't have the role in the first place.
        if (!this.userHasRole(Apprenticeship)) return

        try {
            //  Remove role from the user
            this.revokeRole(Apprenticeship)
        }
        catch (e) {
            //  Incase there's an unexpected error
            return this.logger.error(`Failed to revoke ${Apprenticeship.name} key from ${this.components.user.username}. > ${e.stack}`)
        }
    }
}

module.exports = ClassroomManager