const logger = require(`./logger`)

class Moderations {
    /**
     * @param {Object} message <Message> instance is required. 
     * @param {*} userId target user id.
     */
    constructor(message = {}, userId = ``) {
        this.message = message
        this.user = message.guild.members.cache.get(userId)
        this.author = `[${message.guild.name}] ${message.author.tag} -`
    }


    /**
     * @param {*} point required parameter (1 ~ 4) in order to give the correct action
     */
    byPoints(points = 0) {
        const actionByPoints = {
            1: `mute@3`,
            2: `mute@24`,
            3: `kick`,
            4: `ban`
        }

        // Cancel action if the given point is negative.
        if (!points) return logger.debug(`no actions given for ${this.user.id}`)

        if (points > 4) points = 4

        const selectedAction = actionByPoints[points]
        this[selectedAction]()
        return logger.info(`${this.author} has requested "${selectedAction}" action for ${this.user.id}`)
    }


    checkForMuteRole() {
        return this.message.guild.roles.find(r => [`mute`, `muted`, `muting`].includes(r.name))
    }


    mute() {
        const muteRole = this.checkForMuteRole

        /**
         * If mute role already present, use it.
         */
        if (muteRole) {
            this.user.roles.add(muteRole.id)
            return logger.info(`${this.user.id} has been muted`)
        }

        /**
         *  Else, create a new one.
         */
        const newMuteRole = this.message.guild.roles.create({
            name: `muted`
        })
        this.user.roles.add(newMuteRole.id)
        return logger.info(`${this.user.id} has been muted`)
    }


    kick() {
        this.user.kick()
        this.logger.info(`[${this.message.guild.name}] ${this.user.id} has been kicked`)
    }


    ban() {
        this.user.ban()
        this.logger.info(`[${this.message.guild.name}] ${this.user.id} has been banned`)
    }


}

module.exports = Moderations