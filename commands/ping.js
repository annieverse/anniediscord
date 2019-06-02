const Discord = require("discord.js");
const palette = require('../colorset.json');

module.exports.run = async (bot, command, message, args, utils) => {

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

		const embed = new Discord.RichEmbed()
			.setColor(palette.darkmatte)
			.setDescription(`request taken in **${Math.round(bot.ping)}ms**`)


		return message.channel.send(embed)

			}


module.exports.help = {
	name: "ping",
        aliases:[]
}