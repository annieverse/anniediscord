const GUI = require(`../../ui/prebuild/leaderboard`)
const Command = require(`../../libs/commands`)
/**
 * Displays global leaderboard
 * @author klerikdust
 */
class Leaderboard extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)

		/**
		 * First element of the child array determines the leaderboard category name.
		 * @type {array}
		 */
		this.keywords = [
			[`exp`, `exp`, `xp`, `lvl`, `level`],
			[`artcoins`, `artcoins`, `ac`, `artcoin`, `balance`, `bal`],
			[`fame`, `fames`, `rep`,  `reputation`, `reputations`, `reps`],
			[`artists`, `hearts`, `arts`, `artist`, `art`, `artwork`],
			[`halloween`, `candies`, `hallowee`, `candies`, `cdy`, `spooky`, `spook`]
		]

		/**
		 * URL source for leaderboard's thumbnail
		 * @type {string}
		 */
		this.thumbnail = `https://i.ibb.co/2jnLwx2/leaderboard.png`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, avatar, commanifier, name, bot:{db} }) {
		await this.requestUserMetadata(2)

		//  Returns a guide if no parameter was specified.
		if (!this.args[0]) return reply(this.locale.LEADERBOARD.GUIDE, {
			color: `crimson`,
			thumbnail: this.thumbnail,
			header: `Hi, ${name(this.user.id)}!`,
			socket: {
				prefix: this.bot.prefix,
				emoji: emoji(`AnnieDab`)
			}
		})
		//  Returns if parameter is invalid.
		if (!this.wholeKeywords.includes(this.args[0].toLowerCase())) return reply(this.locale.LEADERBOARD.INVALID_CATEGORY, {
			color: `red`,
			socket: {emoji: emoji(`fail`)}
		})
		//  Store key of selected group
		const selectedGroupParent = this.keywords.filter(v => v.includes(this.args[0].toLowerCase()))[0]
		const selectedGroup = selectedGroupParent[0]
		const selectedGroupIdentifier = selectedGroupParent[1]
		if (selectedGroup == `exp` && !this.bot.xp_module) return reply(this.locale.COMMAND.DISABLED)
		return reply(this.locale.COMMAND.FETCHING, {
			socket: {
				command: `${selectedGroup} leaderboard`,
				emoji: emoji(`AAUloading`),
				user: this.user.id
			},
			simplified: true
		})
		.then(async load => {
			//  Fetch points data and eliminates zero values if present.
			const lbData = (await db.indexRanking(selectedGroup, this.message.guild.id)).filter(node => node.points > 0)
			//  Handle if no returned leaderboard data
			if (!lbData.length) {
				load.delete()
				return reply(this.locale.LEADERBOARD.NO_DATA, {
					color: `golden`,
					socket: {
						category: selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1),
						emoji: emoji(`warn`)
					}
				})
			}
			const img = await new GUI(this.user, lbData, name, avatar).build()
			load.delete()
			await reply(`:trophy: **| ${selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)} Leaders**\n${this.message.guild.name}'s Ranking`, {
				prebuffer: true,
				image: img.toBuffer(),
				simplified: true
			})

			const author = lbData.filter(key => key.id === this.user.id)[0]
			reply(this.locale.LEADERBOARD.AUTHOR_RANK, {
				simplified: true,
				socket: {
					rank: lbData.indexOf(author) + 1,
					points: author.points ? commanifier(author.points) : 0,
					emoji: selectedGroupIdentifier,
				}
			})
		})
	}

	/**
	 * Aggregate available keywords in `this.keywords`.
	 * @type {array}
	 */
	get wholeKeywords() {
		let arr = []
		for (let i = 0; i < this.keywords.length; i++) {
			arr.push(...this.keywords[i])
		}
		return arr
	}
}

module.exports.help = {
	start: Leaderboard,
	name:`leaderboard`,
	aliases: [`lb`,`leaderboard`, `rank`, `ranking`],
	description: `Displays global leaderboard`,
	usage: `lb`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}