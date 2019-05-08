const Discord = require("discord.js");
const palette = require('../colorset.json');

module.exports.run = async (bot,command, message, args, dynamicMessage) => {

		const embed = new Discord.RichEmbed()
			.setColor(palette.darkmatte)
      .setImage(`https://cdn.discordapp.com/attachments/513209851506065420/565099821703364608/ezgif.com-video-to-gif.gif`)
			//.setDescription(`request taken in **${Math.round(bot.ping)}ms**`)


		//return message.channel.send(embed)

			}


module.exports.help = {
	name: "ping",
        aliases:[]
}