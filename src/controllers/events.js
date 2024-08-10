const reqEvent = (event) => require(`../events/${event}.js`)
const { Events } = require(`discord.js`)
/**
 * Handles events in the current node
 * @param {client} Annie Current bot instance.
 * @return {void}
 */
module.exports = function eventsController(annie) {
    annie.once(Events.ClientReady, () => reqEvent(`ready`)(annie))
    annie.on(Events.Error, (e) => reqEvent(`error`)(annie, e))
    annie.on(Events.Debug, l => annie.logger.debug(l))
    annie.on(Events.Warn, l => annie.logger.warn(l))
    annie.on(Events.MessageCreate, (message) => reqEvent(`messageCreate`)(annie, message))
    annie.on(Events.GuildCreate, (guild) => reqEvent(`guildCreate`)(annie, guild))
    annie.on(Events.GuildDelete, (guild) => reqEvent(`guildDelete`)(annie, guild))
    annie.on(Events.InteractionCreate, (interaction) => reqEvent(`interactionCreate`)(annie, interaction))
    annie.once(Events.ShardReady, (id, unavailableGuilds) => reqEvent(`shardReady`)(annie, id, unavailableGuilds))
    //  Events below this point is only available in the production
    if (annie.dev) return
    annie.on(Events.ShardError, (error) => annie.logger.error(error))
    annie.on(Events.MessageDelete, (message) => reqEvent(`messageDelete`)(annie, message))
    annie.on(Events.MessageBulkDelete, (messages, channel) => reqEvent(`messageDeleteBulk`)(annie, messages, channel))
    annie.on(Events.GuildRoleCreate, (role) => reqEvent(`roleCreate`)(annie, role))
    annie.on(Events.GuildRoleDelete, (role) => reqEvent(`roleDelete`)(annie, role))
    annie.on(Events.GuildEmojiCreate, (emoji) => reqEvent(`emojiCreate`)(annie, emoji))
    annie.on(Events.GuildEmojiDelete, (emoji) => reqEvent(`emojiDelete`)(annie, emoji))
    annie.on(Events.ChannelDelete, (channel) => reqEvent(`channelDelete`)(annie, channel))
    annie.on(Events.ChannelCreate, (channel) => reqEvent(`channelCreate`)(annie, channel))
    annie.on(Events.GuildBanAdd, (guild, user) => reqEvent(`guildBanAdd`)(annie, guild, user))
    annie.on(Events.GuildBanRemove, (guild, user) => reqEvent(`guildBanRemove`)(annie, guild, user))
    annie.on(Events.GuildMemberAdd, (member) => reqEvent(`guildMemberAdd`)(annie, member))
    annie.on(Events.GuildMemberUpdate, (oldMember, newMember) => reqEvent(`guildMemberUpdate`)(annie, oldMember, newMember))
}