const sql = require("sqlite");
sql.open(".data/database.sqlite");
const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, _command, message, _utils) => {


    //  Rebuild file.
    return message.channel.send(`unavailable.`)
    
}
module.exports.help = {
    name: "addxp",
    aliases: [],
    description: `Add XP to a specific user`,
    usage: `${prefix}addxp @user <amount>`,
    group: "Admin",
    public: true,
}