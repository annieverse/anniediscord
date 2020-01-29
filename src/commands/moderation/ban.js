const Discord = require(`discord.js`)

class ban {
	constructor(Stacks) {
		this.author = Stacks.meta.author
		this.data = Stacks.meta.data
		this.utils = Stacks.utils
		this.message = Stacks.message
		this.this.args = Stacks.this.args
		this.palette = Stacks.palette
		this.required_roles = this.message.member.roles.find(r => (r.name === `Grand Master`) || (r.name === `Tomato Fox`))
		this.stacks = Stacks
	}

	async execute() {
		let message = this.message
		let bUser = message.guild.member(message.mentions.users.first() || message.guilds.member.get(this.args[0]))
		if (!bUser) return message.channel.send(`Can't find user.`)
		let breason = this.args.join(` `).slice(22)
		if (!message.member.hasPermission(`ADMINISTRATOR`)) return message.channel.send(`You are not allowed to kick.`)
		if (bUser.hasPermission(`ADMINISTRATOR`)) return message.channel.send(`That person can't be kicked.`)
		let banEmbed = new Discord.RichEmbed()

			.setDescription(`~Ban~`)
			.setColor(0xff1a1a)
			.addField(`Banned User`, `${bUser}with ID ${bUser.id}`)
			.addField(`Banned By`, `<@${message.author.id}> with ID ${message.author.id}`)
			.addField(`Banned In`, message.channel)
			.addField(`Time`, message.createdAt)
			.addField(`Reason`, breason)
		let BanChannel = message.guild.channels.find(`name`, `goodbye`)
		if (!BanChannel) return message.channel.send(`Can't goodbye channel`)
		message.guild.member(bUser).ban(breason)
		BanChannel.send(banEmbed)
	}
}

module.exports.help={
	start:ban,
	name:`ban`,
	aliases: [],
	description: `Kick permanently.`,
	usage: `ban @user <reason>`,
	group: `Admin`,
	public: true,
	require_usermetadata: true,
	multi_user: true
}