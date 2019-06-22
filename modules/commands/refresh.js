const Discord = require("discord.js");

class refresh {
	constructor(Stacks) {
		this.utils = Stacks.utils;
		this.message = Stacks.message;
		this.args = Stacks.args;
		this.palette = Stacks.palette;
		this.stacks = Stacks;
	}

	async execute() {
		let message = this.message;
		let palette = this.stacks.palette;
		var authors = ['230034968515051520'];
		let embed = new Discord.RichEmbed();
		let embed2 = new Discord.RichEmbed();


		embed.setColor(palette.red)
		embed.setDescription(`Sorry, you don't have authorization to use the command.`)
		if (!authors.includes(message.author.id)) return message.channel.send(embed);


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
}

module.exports.help = {
	start: refresh,
	name:"refresh",
	aliases: ["rs"],
	description: `restarts Bot`,
	usage: `>rs`,
	group: "Admin",
	public: true,
	require_usermetadata: false,
	multi_user: false
}