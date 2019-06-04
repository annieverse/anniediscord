const Discord = require("discord.js");
const palette = require('../colorset.json');

const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {


if(env.dev && !env.administrator_id.includes(message.author.id))return;

var authors = ['230034968515051520'];
let embed = new Discord.RichEmbed();
let embed2 = new Discord.RichEmbed();


	embed.setColor(palette.red)
	embed.setDescription(`Sorry, you don't have authorization to use the command.`)
    if(!authors.includes(message.author.id))return message.channel.send(embed);


embed2.setColor(palette.darkmatte)
embed2.setDescription(`**${args[0]}** has been refreshed.`)
  

	try {
		delete require.cache[require.resolve(`./${args[0]}`)];
	} catch (e) {
		embed2.setColor(palette.red)
		embed2.setDescription(`Unable to reload **${args[0]}**.`)
		return message.channel.send(embed2)
	}
  
  message.channel.send(embed2);
}

module.exports.help = {
	name:"rs",
	aliases: [],
	description: `restarts Bot`,
	usage: `${prefix}rs`,
	group: "Admin",
	public: true,
}