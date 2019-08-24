const Discord = require(`discord.js`)
const ms = require(`ms`)

class mute {
	constructor(Stacks) {
		this.author = Stacks.meta.author
		this.data = Stacks.meta.data
		this.utils = Stacks.utils
		this.message = Stacks.message
		this.this.args = Stacks.this.args
		this.palette = Stacks.palette
		this.stacks = Stacks
	}

	async execute() {
		let message = this.message
		let bot = this.stacks.bot
		let palette = this.stacks.palette
		message.delete()
		let bicon = bot.user.displayAvatarURL
		let admEmbed = new Discord.RichEmbed()
		admEmbed.setColor(palette.red)
		admEmbed.setDescription(`You don't have authorization to use this command.`)
		admEmbed.setFooter(`Anime Artist United | Say Message`, bicon)

		if (!message.member.roles.find(r => (r.name === `Creators Council`)
      || (r.name === `Trial Mod`)
      || (r.name === `Channel Overseer`)
      || (r.name === `Tomato Fox`))) return message.channel.send(admEmbed)

		let mutee = message.guild.member(message.mentions.users.first() || message.guild.members.get(this.args[0]))
		if (!mutee) return message.channel.send(`Please provide a user to be muted.`)

		let reason
		let mutetime = this.args[1]
		if (!mutetime) {
			mutetime = `1d`
		}
		if (mutetime) {
			if (isNaN(mutetime.charAt(0))) {
				mutetime = `1d`
				reason = this.args[1]
				if (!reason) { reason = `No reason was given.` } else { reason = this.args.join(` `).split(` `).slice(1).join(` `) }
			} else {
				reason = this.args[2]
				if (!reason) { reason = `No reason was given.` } else { reason = this.args.join(` `).split(` `).slice(2).join(` `) }
			}
		}


		let muterole = message.guild.roles.find(r => r.name === `muted`)
		//start of create role
		if (!muterole) {
			try {
				muterole = await message.guild.createRole({
					name: `muted`,
					color: `#000000`,
					permissions: []
				})
				message.guild.channels.forEach(async (channel) => {
					await channel.overwritePermissions(muterole, {
						SEND_MESSAGES: false,
						ADD_REACTIONS: false,
						SEND_TTS_MESSAGES: false,
						ATTACH_FILES: false,
						SPEAK: false
					})
				})
			} catch (e) {
				console.log(e.stack)
			}
		}

		mutee.addRole(muterole.id).then(() => {
			message.delete()
			mutee.send(`Hello, you have been muted in ${message.guild.name}\n
                for: ${reason}\nfor: ${mutetime}: **Or** until a staff member unmutes.`).catch(err => console.log(err))
		})
		//end of create role

		let embed = new Discord.RichEmbed()
			.setColor(palette.red)
			.setAuthor(`${message.guild.name} Modlogs`, message.guild.iconURL)
			.addField(`Moderation:`, `mute`)
			.addField(`Mutee:`, `username: ${mutee.user.username}\n
                      user ID:  ${mutee.id}`)
			.addField(`Moderator:`, `username: ${message.author.username}\n
                           user ID:  ${message.author.id}`)
			.addField(`Reason:`, reason)
			.addField(`Time:`, mutetime)
			.addField(`Date:`, message.createdAt.toLocaleString())

		let staffLogChannel = bot.channels.get(`460267216324263936`)
		staffLogChannel.send(embed)

		setTimeout(function () {
			if (mutee.roles.find(r => r.name === muterole.name)) {
				mutee.removeRole(muterole.id)
			}
		}, ms(mutetime))
	}
}

module.exports.help = {
	start: mute,
	name:`mute`,
	aliases: [],
	description: `mutes a user and sends them a dm`,
	usage: `${require(`../../.data/environment.json`).prefix}mute @user [time]<optional (defaults to 1d if nothing supplied) <reason>`,
	group: `Admin`,
	public: true,
	require_usermetadata: true,
	multi_user: true
}
