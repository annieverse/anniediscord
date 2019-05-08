const reqEvent = (event) => require(`../events/${event}`)

module.exports = bot =>{
  bot.on("ready", async function() {reqEvent("ready") (bot)});
  bot.on("message", async (message) => reqEvent("message")(bot, message));
  bot.on("raw", async (packet) => reqEvent("raw")(bot, packet));
  bot.on("messageReactionAdd", async (reaction, user) => reqEvent("messageReactionAdd")(bot, reaction, user));
}