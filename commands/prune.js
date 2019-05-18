const Discord = require("discord.js");
const botconfig = require('../botconfig.json');
const palette = require('../colorset.json');

module.exports.run = async (bot,command, message, args) => {

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

	let embed = new Discord.RichEmbed();
	embed.setColor(palette.darkmatte)
	const author = message.member;
	const modRole = message.guild.roles.find(r => (r.name === 'Creators Council') || (r.name === 'Tomato Fox'));

	if(author.roles.has(modRole.id)) {
		if(!args[0]) {
			embed.setDescription(`${message.author.username}.. could you specify the number?`)
			return message.channel.send(embed)
		}

    args[0] = parseInt(args[0])+1;
		if(args[0] > 100) {
			embed.setDescription(`Eh, i couldn't delete more than **100** messages at once!`)
			return message.channel.send(embed)

		}

			message.channel.bulkDelete(args[0]);

			embed.setColor(palette.halloween)
			embed.setDescription(`Yay! I've deleted **${args[0]-1}** messages!`)
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