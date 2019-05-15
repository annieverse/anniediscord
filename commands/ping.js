const Discord = require("discord.js");
const botconfig = require('../botconfig.json');
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager.js');

module.exports.run = async (bot,command, message, args) => {



const format = new formatManager(message);
return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? initPing()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


async function initPing() {

	function measuringLatency(ms) {
		const predict = ['weak', 'Fair', 'stable'];

		if(ms <= 30) {
			return `Yay! pretty **${predict[2]}**!`;
		}
		else if (ms < 60) {
			return `**${predict[1]}** latency.`;
		}
		else {
			return `Sorry, It seems my connection is pretty **${predict[0]}** at the moment.`;
		}

	}	
		const ping = await measuringLatency(Math.round(bot.ping));
		const embed = new Discord.RichEmbed()
			.setColor(palette.darkmatte)
			.setDescription(`${ping} request taken in **${Math.round(bot.ping)}ms**`)


		return message.channel.send(embed)

			}
}


module.exports.help = {
	name: "ping",
        aliases:[]
}