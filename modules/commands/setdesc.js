const Discord = require('discord.js');
const sql = require("sqlite");
sql.open(".data/database.sqlite");
class setDesc {
	constructor(Stacks) {
		this.author = Stacks.meta.author;
		this.data = Stacks.meta.data;
		this.utils = Stacks.utils;
		this.message = Stacks.message;
		this.args = Stacks.args;
		this.palette = Stacks.palette;
		this.stacks = Stacks;
	}

	async execute() {
		let message = this.message;
		let palette = this.stacks.palette;
		function profileDescription(userid, desc) {
			sql.get(`SELECT * FROM userdata WHERE userId=${userid}`)
				.then(async data => {
					sql.run(`UPDATE userdata SET description = "${desc}" WHERE userId=${userid}`);
				})
		}


		const descriptionArguments = message.content.substring(9);
		const embed = new Discord.RichEmbed();

		if (!args[0]) {
			embed.setColor(palette.darkmatte)
			embed.setDescription(`Here's the example on how to create your own profile description!\n\n\`>setdesc\` \`I'm AAU Artist!\``)

			return message.channel.send(embed);
		} else if (descriptionArguments.length > 165) {
			embed.setColor(palette.darkmatte)
			embed.setDescription(`You've exceeded the number limit you baka! It should be less than **166** characters.`)

			return message.channel.send(embed)
		} else {
			await profileDescription(message.author.id, descriptionArguments);
			embed.setColor(palette.halloween)
			embed.setDescription(`Hello **${message.author.username}**, your profile description has been set to \`${descriptionArguments}\``)

			return message.channel.send(embed)

		}
	}
}

module.exports.help = {
	start: setDesc,
	name: "setdesc",
	aliases: [],
	description: `Set description for profile card`,
	usage: `${require(`../../.data/environment.json`).prefix}setdesc <message>`,
	group: "General",
	public: true,
	require_usermetadata: true,
	multi_user: true
}