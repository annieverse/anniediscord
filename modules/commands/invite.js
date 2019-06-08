module.exports.run = async (...ArrayStacks) => {


return message.channel.send(`Hey **${message.author.username}**, here's the link.
	https://discord.gg/YFaCQVn`)

}
module.exports.help={
    name:"invite",
    aliases: ["serverinvite", "serverlink", "linkserver", "invitelink", "link"],
    description: `gives a server invite link`,
    usage: `>invite`,
    group: "Server",
    public: true,
}