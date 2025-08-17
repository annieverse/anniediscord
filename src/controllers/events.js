const reqEvent = (type, event) => require(`../events/${type}/${event}.js`)
const { Events } = require(`discord.js`)
/**
 * Handles events in the current node
 * @param {client} Annie Current bot instance.
 * @return {void}
 */
module.exports = function eventsController(annie) {
    annie.once(Events.ClientReady, () => reqEvent(`base`, `ready`)(annie))
    annie.on(Events.Error, (e) => reqEvent(`base`, `error`)(annie, e))
    annie.on(Events.Debug, l => annie.logger.debug(l))
    annie.on(Events.Warn, l => annie.logger.warn(l))
    annie.on(Events.InteractionCreate, (interaction) => reqEvent(`interaction`, `interactionCreate`)(annie, interaction))
    // annie.once(Events.ShardReady, (id, unavailableGuilds) => reqEvent(`shardReady`)(annie, id, unavailableGuilds))
    //  Events below this point is only available in the production
    if (annie.dev) return
    /**
     * Shard Events
     */
    annie.on(Events.ShardDisconnect, (closeEvent, shardId) => reqEvent(`shard`, `shardDisconnect`)(annie, closeEvent, shardId))
    annie.on(Events.ShardError, (error, shardId) => reqEvent(`shard`, `shardError`)(annie, error, shardId))
    annie.on(Events.ShardReady, (shardId, unavailableGuilds) => reqEvent(`shard`, `shardReady`)(annie, shardId, unavailableGuilds))
    annie.on(Events.ShardReconnecting, (shardId) => reqEvent(`shard`, `shardReconnecting`)(annie, shardId))
    annie.on(Events.ShardResume, (shardId, replayedEvents) => reqEvent(`shard`, `shardResume`)(annie, shardId, replayedEvents))
    /**
     * Other Events
     */
    annie.on(Events.MessageCreate, (message) => reqEvent(`message`, `messageCreate`)(annie, message))
    annie.on(Events.GuildCreate, (guild) => reqEvent(`guild`, `guildCreate`)(annie, guild))
    annie.on(Events.GuildDelete, (guild) => reqEvent(`guild`, `guildDelete`)(annie, guild))
    annie.on(Events.MessageDelete, (message) => reqEvent(`message`, `messageDelete`)(annie, message))
    annie.on(Events.MessageBulkDelete, (messages, channel) => reqEvent(`message`, `messageBulkDelete`)(annie, messages, channel))
    annie.on(Events.GuildRoleCreate, (role) => reqEvent(`role`, `roleCreate`)(annie, role))
    annie.on(Events.GuildRoleDelete, (role) => reqEvent(`role`, `roleDelete`)(annie, role))
    annie.on(Events.GuildEmojiCreate, (emoji) => reqEvent(`emoji`, `emojiCreate`)(annie, emoji))
    annie.on(Events.GuildEmojiDelete, (emoji) => reqEvent(`emoji`, `emojiDelete`)(annie, emoji))
    annie.on(Events.ChannelDelete, (channel) => reqEvent(`channel`, `channelDelete`)(annie, channel))
    annie.on(Events.ChannelCreate, (channel) => reqEvent(`channel`, `channelCreate`)(annie, channel))
    annie.on(Events.GuildBanAdd, (guild, user) => reqEvent(`guild`, `guildBanAdd`)(annie, guild, user))
    annie.on(Events.GuildBanRemove, (guild, user) => reqEvent(`guild`, `guildBanRemove`)(annie, guild, user))
    annie.on(Events.GuildMemberAdd, (member) => reqEvent(`guild`, `guildMemberAdd`)(annie, member))
    annie.on(Events.GuildMemberUpdate, (oldMember, newMember) => reqEvent(`guild`, `guildMemberUpdate`)(annie, oldMember, newMember))
}