const Discord = require("discord.js");
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');
const userFinding = require('../utils/userFinding');


module.exports.run = async (bot, command, message, args) => {

// avatar.js
//
//	AVATAR COMMANDS
//		changes log :
//		12/20/18 - Structure reworks.
//		11/05/18 - Rating bug fixed (number below 5 often occured), added numbers range function.
//		11/03/18 - Added user finding by given input. Reaction. Major feature reworks.
//		09/17/18 - Imported commands from naphnaphz's bot.

const env = require('../.data/environment.json');
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);
return ["bot", "bot-games", "cmds", "sandbox"].includes(message.channel.name) ? avatar()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)

		async function avatar() {
			const get = {
				nickname (id) {
					return message.guild.members.get(id).displayName;
				},
				avatarURL (id) {
					return bot.users.get(id).displayAvatarURL;
				},
				username (id) { 
					return bot.users.get(id).username;
				}
			};
			
			let reactOptions = [
			"I'd give you a",
			"Definitely",
			"Hmm ..",
			"Amazing!",
			"I wuv it ❤",
			"Awesome art!",
			"Meh.",
			"Magnificent~",
			"Totally",
			"I only could give",
			"Beautiful!!",
			"Avatar of the day!"
			];

			let impressEmbed = new Discord.RichEmbed();
			let avaEmbed = new Discord.RichEmbed();

			impressEmbed.setDescription(`${format.randomize(reactOptions)} **${format.rangeNumber(4, 11)}/10**`)
						.setColor(palette.darkmatte)

				if(!args[0]) {
					
					avaEmbed.setAuthor(get.nickname(message.author.id), message.author.displayAvatarURL)
							.setImage(message.author.displayAvatarURL)
							.setColor(palette.darkmatte)

							message.react('📸')
							return message.channel.send(avaEmbed)
								.then(() => message.channel.startTyping())
									.then(() => message.channel.stopTyping())
										.then(() => message.channel.send(impressEmbed))
				}
				else {
					try {
					const user = await userFinding.resolve(message, message.content.substring(command.length+2))

					avaEmbed.setAuthor(get.nickname(user.id), get.avatarURL(user.id))
							.setImage(get.avatarURL(user.id))
							.setColor(palette.darkmatte)

							message.react('📸')
							return message.channel.send(avaEmbed)
								.then(() => message.channel.startTyping())
									.then(() => message.channel.stopTyping())
										.then(() => message.channel.send(impressEmbed))
					}
					catch(Error) {
						let res = Error;
						console.log(res);
						message.channel.send(`\`\`\`javascript\n${res}\n\`\`\``)
					}
				}
		}
}


module.exports.help = {
	name: "avatar",
        aliases:['ava', 'pfp']
}