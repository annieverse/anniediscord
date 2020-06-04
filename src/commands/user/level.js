const GUI = require(`../../ui/prebuild/level`)
const Command = require(`../../libs/commands`)
/**
 * Display your current exp, level and rank.
 * @author klerikdust
 */
class Level extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, name, emoji, avatar}) {
		await this.requestUserMetadata(2)

		//  Handle if user doesn't exists
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		reply(this.locale.COMMAND.FETCHING, {
			simplified: true,
			socket: {
				emoji: emoji(`AAUloading`), 
				user: this.user.id,
				command: `level`
			}
		})
		.then(async loading => {
			const img = await new GUI(this.user).build()
			await reply(this.locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: img.toBuffer(),
				socket: {
					emoji: emoji(`AnnieDab`),
					user: name(this.user.id),
					command: `Level`
				}
			})
			return loading.delete()
		})
	}
}

module.exports.help = {
	start: Level,
	name: `level`,
	aliases: [`lvl`, `lv`],
	description: `Display your current exp, level and rank.`,
	usage: `level <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}