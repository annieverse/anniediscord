const Discord = require('discord.js');

module.exports.run = async(bot,command,message,args)=>{

return message.channel.send(`Hey **${message.author.username}**, here's the link.
	https://discord.gg/YFaCQVn`)

}
module.exports.help={
    name:"invite",
        aliases:["inv", "serverinvite", "serverlink", "linkserver", "invitelink", "link"]
}