const Discord = require("discord.js");
const botconfig = require('../botconfig.json');
const palette = require('../colorset.json');

module.exports.run = async (bot,command, message, args) => {

	let embed = new Discord.RichEmbed();
	embed.setColor(palette.darkmatte)
	const author = message.member;
	const modRole = message.guild.roles.find(r => r.name === 'Bot Commander');

	if(author.roles.has(modRole.id)) {
		if(!args[0]) {
			embed.setDescription(`${message.author.username}.. could you specify the number?`)
			return message.channel.send(embed)
		}
		if(args[0] > 100) {
			embed.setDescription(`Eh, i couldn't delete more than **100** messages at once!`)
			return message.channel.send(embed)

		}

			message.channel.bulkDelete(args[0]);

			embed.setColor(palette.halloween)
			embed.setDescription(`Yay! I've deleted **${args[0]}** messages!`)
			return message.channel.send(embed).then((msg) => {
				msg.delete(5000)
		})
	}
	else {
		embed.setDescription(`You don't have authorization to use this command.`)
		return message.channel.send(embed)
	}
}


module.exports.help = {
	name: "prune",
        aliases:[]
}