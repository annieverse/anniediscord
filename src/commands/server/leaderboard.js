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
			[`exp`, `xp`, `lvl`, `level`],
			[`artcoins`, `ac`, `artcoin`, `balance`],
			[`fame`, `rep`,  `reputation`, `reputations`, `reps`],
			[`artists`, `arts`, `artist`, `art`, `artwork`],
			[`anime`, `weeb`, `otaku`, `weebs`, `mal`],
			[`halloween`, `hallowee`, `candies`, `cdy`, `spooky`, `spook`]
		]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, avatar, commanifier, name, bot:{db} }) {
		await this.requestUserMetadata(2)

		//  Returns a guide if no parameter was specified.
		if (!this.args[0]) return reply(this.locale.LEADERBOARD.GUIDE)
		//  Returns if parameter is invalid.
		if (!this.wholeKeywords.includes(this.args[0].toLowerCase())) return reply(this.locale.LEADERBOARD.INVALID_CATEGORY)
		//  Store key of selected group
		const selectedGroup = this.keywords.filter(v => v.includes(this.args[0].toLowerCase()))[0][0]
		return reply(this.locale.COMMAND.FETCHING, {
			socket: {
				command: `${selectedGroup} leaderboard`,
				emoji: emoji(`AAUloading`),
				user: this.user.id
			},
			simplified: true
		})
		.then(async load => {
			const lbData = await db.indexRanking(selectedGroup, this.message.guild.id)
			//  Handle if no returned leaderboard data
			if (!lbData.length) {
				load.delete()
				return reply(this.locale.LEADERBOARD.NO_DATA, {socket: {category: selectedGroup}})
			}
			const img = await new GUI(this.user, lbData, name, avatar).build()
			load.delete()
			await reply(`${emoji(selectedGroup)} **| ${selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)} Leaders**`, {
				prebuffer: true,
				image: img.toBuffer(),
				simplified: true
			})

			const author = lbData.filter(key => key.id === this.user.id)[0]
			reply(this.locale.LEADERBOARD.AUTHOR_RANK, {
				simplified: true,
				socket: {
					rank: lbData.indexOf(author) + 1,
					points: commanifier(author.points) == 0 ? commanifier(author.points + 1): commanifier(author.points),
					emoji: emoji(selectedGroup),
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
	group: `Server`,
	permissionLevel: 0,
	multiUser: false
}