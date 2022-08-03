const reqEvent = (event) => require(`../events/${event}.js`)
    /**
     * Handles events in the current node
     * @param {client} Annie Current bot instance.
     * @return {void}
     */
module.exports = function eventsController(annie) {
    annie.once(`ready`, () => reqEvent(`ready`)(annie))
    annie.on(`error`, (e) => reqEvent(`error`)(annie, e))
    annie.on(`messageCreate`, (message) => reqEvent(`messageCreate`)(annie, message))
    annie.on(`guildCreate`, (guild) => reqEvent(`guildCreate`)(annie, guild))
    annie.on(`guildDelete`, (guild) => reqEvent(`guildDelete`)(annie, guild))
    annie.on(`interactionCreate`, (interaction) => reqEvent(`interactionCreate`)(annie, interaction))
    annie.on(`debug`,l => annie.logger.info(l))
    annie.on(`warn`,l => annie.logger.info(l))
    annie.on(`shardReady`,(id, unavailableGuilds) => reqEvent(`shardReady`)(annie, id, unavailableGuilds))
        //  Events below this point is only available in the production
    if (annie.dev) return
    annie.on(`messageDelete`, (message) => reqEvent(`messageDelete`)(annie, message))
    annie.on(`messageDeleteBulk`, (messages) => reqEvent(`messageDeleteBulk`)(annie, messages))
    annie.on(`roleCreate`, (role) => reqEvent(`roleCreate`)(annie, role))
    annie.on(`roleDelete`, (role) => reqEvent(`roleDelete`)(annie, role))
    annie.on(`emojiCreate`, (emoji) => reqEvent(`emojiCreate`)(annie, emoji))
    annie.on(`emojiDelete`, (emoji) => reqEvent(`emojiDelete`)(annie, emoji))
    annie.on(`channelDelete`, (channel) => reqEvent(`channelDelete`)(annie, channel))
    annie.on(`channelCreate`, (channel) => reqEvent(`channelCreate`)(annie, channel))
    annie.on(`guildBanAdd`, (guild, user) => reqEvent(`guildBanAdd`)(annie, guild, user))
    annie.on(`guildBanRemove`, (guild, user) => reqEvent(`guildBanRemove`)(annie, guild, user))
    annie.on(`guildMemberAdd`, (member) => reqEvent(`guildMemberAdd`)(annie, member))
    annie.on(`guildMemberUpdate`, (oldMember,newMember) => reqEvent(`guildMemberAdd`)(annie, oldMember,newMember))
}