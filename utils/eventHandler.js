const reqEvent = (event) => require(`../events/${event}`)
const env = require(`../.data/environment.json`);

module.exports = bot => {
    
    bot.on("ready", async() => reqEvent("ready")(bot));
    bot.on("message", async(message) => reqEvent("message")(bot, message));
    bot.on("error", reqEvent("error"));
    bot.on("raw", async (packet) => reqEvent("raw")(bot, packet));
    bot.on("messageReactionAdd", async (reaction, user) => reqEvent("messageReactionAdd")(bot, reaction, user));
    bot.on("messageReactionRemove", async (reaction, user) => reqEvent("messageReactionRemove")(bot, reaction, user));
    // Need these lines to have error catcher in own file
    let message_object;
    bot.on('message', message => {
        message_object = message;
    })
    process.on('unhandledRejection', (err, p) => reqEvent("unhandledRejection")(bot,err,p,message_object));
    //

    if (!env.dev) {
        bot.on("guildMemberAdd", async(member) => reqEvent("guildMemberAdd")(bot, member));
        bot.on("guildMemberRemove", async(member) => reqEvent("guildMemberRemove")(bot, member));
        bot.on("guildMemberUpdate", async(oldUser, newUser) => reqEvent("guildMemberUpdate")(bot, oldUser, newUser));    
    }

    if (env.active_exp) bot.on("message", async(message) => reqEvent("experienceMessage")(bot, message));
}