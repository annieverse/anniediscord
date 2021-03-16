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
	async execute({ reply, name, emoji }) {
		//  Handle if the EXP module isn't enabled in current guild
		if (!this.guild.configs.get(`EXP_MODULE`).value) return reply(this.locale.COMMAND.DISABLED, {
			socket: {command: `EXP Module`},
			status: `warn`
		})
		//  Fetch user's metadata
		await this.requestUserMetadata(2)
		//  Handle if user doesn't exists
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		reply(this.locale.COMMAND.FETCHING, {
			simplified: true,
			socket: {
				emoji: emoji(`AAUloading`), 
				user: this.user.master.id,
				command: `level`
			}
		})
		.then(async loading => {
			await reply(this.locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: await new GUI(this.user).build(),
				socket: {
					emoji: emoji(`AnnieDab`),
					user: name(this.user.master.id),
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