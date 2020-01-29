class screenshare {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {message, reply} = this.stacks
		let link_start = `https://discordapp.com/channels/459891664182312980/`
		let link_end = ``
		if (message.member.voiceChannelID == null || undefined) return reply(`I'm sorry, but you must be in a voice channel first.`, { simplified: true })
		link_end = message.member.voiceChannelID
		return reply(`[Join/Start screenshare!](${link_start + link_end})`, { notch:true})
	}
}

module.exports.help = {
	start: screenshare,
	name: `screenshare`, // This MUST equal the filename
	aliases: [`tea`], // More or less this is what the user will input on discord to call the command
	description: `gives a link to screen share in the server`,
	usage: `screenshare`,
	group: `general`,
	public: true,
	require_usermetadata: false,
	multi_user: false,
	special_channels: [`463536514887057436`,`640383732322140160`]
}
