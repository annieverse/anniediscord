const reqEvent = (event) => require(`../events/${event}`)
const env = require(`../.data/environment.json`);

module.exports = bot => {
    bot.on("ready", async() => reqEvent("ready")(bot));
    bot.on("message", async(message) => reqEvent("message")(bot, message));

    if (!env.dev) {
        bot.on("guildMemberAdd", async(member) => reqEvent("guildMemberAdd")(bot, member));
        bot.on("guildMemberRemove", async(member) => reqEvent("guildMemberRemove")(bot, member));
        bot.on("guildMemberUpdate", async(oldUser, newUser) => reqEvent("guildMemberUpdate")(bot, oldUser, newUser));    
    }

    if (env.active_exp) bot.on("message", async(message) => reqEvent("experienceMessage")(bot, message));
}