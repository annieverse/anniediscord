const Discord = require('discord.js');
const palette = require('../colorset.json');
const sql = require("sqlite");
sql.open(".data/database.sqlite");
const env = require('../.data/environment.json');
const prefix = env.prefix;


module.exports.run = async (bot, command, message, args, utils) => {


	if (env.dev && !env.administrator_id.includes(message.author.id)) return;


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
module.exports.help = {
	name: "setdesc",
	aliases: [],
	description: `Set description for profile card`,
	usage: `${prefix}setdesc <message>`,
	group: "General",
	public: true,
}