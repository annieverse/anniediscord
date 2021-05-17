const Command = require(`../../libs/commands`)
const { MessageEmbed } = require(`discord.js`)
/**
 * Display user's avatar
 * @author klerikdust
 */
class Avatar extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
		await this.requestUserMetadata(1)
		if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
        await this.message.react(`📸`)
		const [avatar, name] = [this.user.master.displayAvatarURL({ type: `png`, size:512 }), this.user.master.username]
		const embed = new MessageEmbed()
		.setImage(avatar)
		.setAuthor(name, avatar)
		.setColor(`#912f46`)
		return this.message.channel.send(embed)
	}
}

module.exports.help = {
	start: Avatar,
	name: `avatar`,
	aliases: [`ava`, `pfp`],
	description: `Display user's avatar`,
	usage: `avatar <user>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}
