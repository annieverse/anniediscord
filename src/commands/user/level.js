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
     * @return {void}
     */
	async execute() {
		//  Handle if the EXP module isn't enabled in current guild
		if (!this.message.guild.configs.get(`EXP_MODULE`).value) return this.reply(this.locale.COMMAND.DISABLED, {
			socket: {command: `EXP Module`},
		})
		await this.requestUserMetadata(2)
		if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
		this.reply(this.locale.COMMAND.FETCHING, {
			simplified: true,
			socket: {
				emoji: await this.bot.getEmoji(`790994076257353779`), 
				user: this.user.master.id,
				command: `level`
			}
		})
		.then(async loading => {
			await this.reply(this.locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: await new GUI(this.user).build(),
				socket: {
					emoji: await this.bot.getEmoji(`692428597570306218`),
					user: this.user.master.username,
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
