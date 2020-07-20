const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * 	Importing user's data from 15 May 2020.
 * 	@author klerikdust
 */
class DataRecovery extends Command {

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
	async execute({ reply, commanifier }) {
		const alreadyRan = await this.bot.db.redis.get(`DATARECOV_ALREADY_RAN`)
		const { totalUsers } = await this.bot.db._query(`SELECT COUNT(*) AS totalUsers FROM users`)
		if (alreadyRan) return reply(this.locale.DATA_RECOVERY.ALREADY_RAN, {color: `red`, socket: {date: moment(alreadyRan).fromNow()} })
		await reply(this.locale.DATA_RECOVERY.INITIAL)
		await this.bot.db.recoverOldData()
		reply(this.locale.DATA_RECOVERY.SUCCESSFUL, {color: `lightgreen`, socket: {totalUsers: commanifier(totalUsers)} })
		// Key expire in a week.
		return this.bot.db.redis.set(`DATARECOV_ALREADY_RAN`, moment().format(), `EX`, 604800)
	}
}

module.exports.help = {
	start: DataRecovery,
	name: `dataRecovery`,
	aliases: [`recovdata`],
	description: `Importing user's data from 15 May 2020.`,
	usage: `recovdata <>`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: false,
}