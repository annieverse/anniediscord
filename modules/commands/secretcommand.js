const Discord = require('discord.js');
const sql = require("sqlite");
sql.open(".data/database.sqlite");

class secretCommand {
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
		// Add these three lines so u dont have to go through and put this./this.stacks infront of everything
		// might have to go through if another varible is called
		let message = this.message;
		let embed = new Discord.RichEmbed()

			.setColor('#5178a5')
			.setDescription(`This feature will be available in the next update. Sorry for the incovenience. </3`)

		return message.channel.send(embed);
	}
}

module.exports.help={
	start: secretCommand,
    name:"secretcommand",
	aliases: ["secretbox"],
	description: `Secret`,
	usage: `${require(`../../.data/environment.json`).prefix}secretbox`,
	group: "Fun",
	public: false,
	require_usermetadata: false,
	multi_user: false
}