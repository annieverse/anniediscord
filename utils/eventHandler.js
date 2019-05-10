const reqEvent = (event) => require(`../events/${event}`)

module.exports = bot =>{
  //bot.on("channelCreate", async (channel) => reqEvent("channelCreate")(bot, channel));
  //bot.on("channelDelete", async (channel) => reqEvent("channelDelete")(bot, channel));
  bot.on("channelUpdate", async (oldChannel, newChannel) => reqEvent("channelUpdate")(bot, oldChannel, newChannel));
  bot.on("disconnect",async () => reqEvent("disconnect")(bot));
  bot.on("error", reqEvent("error"));
  bot.on("guildMemberAdd", async (member) => reqEvent("guildMemberAdd")(bot, member));
  bot.on("guildMemberRemove", async (member) => reqEvent("guildMemberRemove")(bot, member));
  //bot.on("guildMemberUpdate", async (member) => reqEvent("guildMemberAdd")(bot, member));
  bot.on("message", async (message) => reqEvent("message")(bot, message));
  bot.on("message", async (message) => reqEvent("experienceMessage")(bot, message));
  //bot.on("messageReactionAdd", async (reaction, user) => reqEvent("messageReactionAdd")(bot, reaction, user));
  //bot.on("messageReactionRemove", async (reaction, user) => reqEvent("messageReactionRemove")(bot, reaction, user));
  bot.on("ready", async function() {reqEvent("ready") (bot)});
  bot.on("reconnecting", async () => reqEvent("reconnecting") (bot));
  bot.on("typingStart", async (channel, user) => reqEvent("typingStart")(bot, channel, user));
  bot.on("guildMemberUpdate", async (oldUser, newUser) => reqEvent("guildMemberUpdate")(bot, oldUser, newUser));
  //bot.on("voiceStateUpdate", async (oldMember, newMember) => reqEvent("voiceStateUpdate")(bot, oldMember, newMember));
  bot.on("warn", reqEvent("warn"));
}