const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {


if(env.dev && !env.administrator_id.includes(message.author.id))return;

return message.channel.send(`Hey **${message.author.username}**, here's the link.
	https://discord.gg/YFaCQVn`)

}
module.exports.help={
    name:"invite",
    aliases: ["serverinvite", "serverlink", "linkserver", "invitelink", "link"],
    description: `gives a server invite link`,
    usage: `${prefix}invite`,
    group: "Server",
    public: true,
}