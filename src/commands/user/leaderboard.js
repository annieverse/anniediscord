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
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, avatar, commanifier, name, bot:{db} }) {
		await this.requestUserMetadata(2)

		//  Returns a guide if no parameter was specified.
		if (!this.args[0]) return reply(this.locale.LEADERBOARD.GUIDE, {
			header: `Hi, ${name(this.user.master.id)}!`,
			image: `banner_leaderboard`,
			socket: {
				prefix: this.bot.prefix,
				emoji: await emoji(`692428597570306218`)
			}
		})
		//  Returns if parameter is invalid.
		if (!this.wholeKeywords.includes(this.args[0].toLowerCase())) return reply(this.locale.LEADERBOARD.INVALID_CATEGORY, {
			socket: {emoji: await emoji(`692428969667985458`)}
		})
		//  Store key of selected group
		const selectedGroupParent = this.keywords.filter(v => v.includes(this.args[0].toLowerCase()))[0]
		const selectedGroup = selectedGroupParent[0]
		const selectedGroupIdentifier = selectedGroupParent[1]
		return reply(this.locale.COMMAND.FETCHING, {
			socket: {
				command: `${selectedGroup} leaderboard`,
				emoji: await emoji(`790994076257353779`),
				user: this.user.master.id
			},
			simplified: true
		})
		.then(async load => {
			//  Fetch points data and eliminates zero values if present.
			let lbData = (await db.indexRanking(selectedGroup, this.message.guild.id)).filter(node => node.points > 0)
			let validIds = 0
			//  Fetching uncached users
			for (let i=0; i<lbData.length; i++) {
				if (i >= 20) break
				try {
					await this.message.guild.members.fetch(lbData[i].id)
				}
				catch(e) {
					continue
				}
			}
			for (let i=0; i<lbData.length; i++) {
				//  If member doesn't exist in the guild, then discard from result set
				while (!this.message.guild.members.cache.has(lbData[i].id)) lbData.splice(i, 1)
				validIds++
				//  Once we collected 10 valid ids, break the loop
				if (validIds >= 10) break
			}
			//  Handle if no returned leaderboard data
			if (!lbData.length) {
				load.delete()
				return reply(this.locale.LEADERBOARD.NO_DATA, {
					color: `golden`,
					socket: {
						category: selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1),
						emoji: await emoji(`751024231189315625`)
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

			const author = lbData.filter(key => key.id === this.user.master.id)[0]
			const footer = author ? this.locale.LEADERBOARD.AUTHOR_RANK : this.locale.LEADERBOARD.UNRANKED
			reply(footer, {
				simplified: true,
				socket: {
					rank: lbData.indexOf(author) + 1,
					points: author ? commanifier(author.points) : 0,
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
	aliases: [`rank`, `leaderboard`, `rank`, `ranking`, `lb`, `leaderboards`],
	description: `Displays global leaderboard`,
	usage: `leaderboard`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}