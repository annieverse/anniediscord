const ms = require(`parse-ms`)
const cards = require(`../../utils/cards-metadata.json`)
const moment = require(`moment`)

/**
 * Main module
 * @Daily as function to handle user dailies loot
 */
class Daily {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
     * Initializer method
     * @Execute
     */
	async execute() {
		const { reply, palette, name, emoji, commanifier, code:{DAILY}, db, meta: { author, data } } = this.stacks

		let metadata = {
			cooldown: 8.64e+7,
			streakcooldown: 25.92e+7,
			amount: 250,
			skill: cards.poppy_card.skills.main,
			get isItStreaking() {
				return data.poppy_card ? true : ms(this.streakcooldown - (Date.now() - data.lastdaily)).days >= 1 ? true : false
			},
			get countStreak() {
				return data.totaldailystreak < 1 ? 1 : this.isItStreaking ? data.totaldailystreak + 1 : 0
			},
			get bonus() {
				return this.countStreak !== 0 ? 12 * this.countStreak : 0
			},
			get inCooldown() {
				return (data.lastdaily !== null) && this.cooldown - (Date.now() - data.lastdaily) > 0 ? true : false
			}
		}

		//	Returns if user dailies duration still in cooldown
		if (metadata.inCooldown) return reply(DAILY.IN_COOLDOWN, {
			socket: [moment(data.lastdaily + metadata.cooldown).fromNow()],
			color: palette.red
		})

		//	Update data
		db(author.id).updateDailies(metadata)

		//	Dailies claimed
		return reply(DAILY.CLAIMED, {
			socket: [
				name(author.id),
				emoji(`artcoins`),
				metadata.amount,
				metadata.isItStreaking ? `(+${commanifier(metadata.bonus)})` : ``,
				metadata.isItStreaking ? `**${metadata.countStreak}** days of consecutive claims ` : ``,
				data.poppy_card ? ` with Poppy's blessing.` : ``
			],
			color : data.poppy_card ? palette.purple : palette.blue,
			notch : data.poppy_card ? true : false
		})
	}
}

module.exports.help = {
	start: Daily,
	name: `daily`,
	aliases: [`dly`, `daili`, `dail`, `dayly`, `attendance`, `dliy`],
	description: `collects a daily flat rate of AC`,
	usage: `${require(`../../.data/environment.json`).prefix}daily`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}