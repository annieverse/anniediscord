const GUI = require(`../../utils/leaderboardInterface`)

/**
 * Main module
 * @Leaderboard Display top 10 user in the server.
 */
class Leaderboard {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
     *  Initialzer method
     */
	async execute() {
		const { args, reply, code: {LEADERBOARD} } = this.stacks

		//  Centralized object
		let metadata = {
			keywords: [
				[`xp`, `exp`, `lvl`, `level`],
				[`ac`, `artcoins`, `artcoin`, `balance`],
				[`rep`, `fame`,  `reputation`, `reputations`, `reps`],
				[`arts`, `artists`, `artist`, `art`, `artwork`]
			],
			get whole_keywords() {
				let arr = []
				for (let i = 0; i < this.keywords.length; i++) {
					arr.push(...this.keywords[i])
				}
				return arr
			}
		}

		//  Returns a guide if no parameter was specified.
		if (!args[0]) return reply(LEADERBOARD.SHORT_GUIDE)
		//  Returns if parameter is invalid.
		if (!metadata.whole_keywords.includes(args[0].toLowerCase())) return reply(LEADERBOARD.INVALID_CATEGORY)
		//  Store key of selected group
		metadata.selected_group = metadata.keywords.filter(v => v.includes(args[0].toLowerCase()))[0][0]

        
		//  Fetching data
		return reply(LEADERBOARD.FETCHING, {
			socket: [metadata.selected_group],
			simplified: true
		})
			.then(async load => {
				//  Get interface buffer
				let res = await GUI(this.stacks, metadata)
				//  Display leaderboard
				reply(res.title, {
					image: res.img,
					prebuffer: true,
					simplified: true
				})
					.then(() => {
						load.delete()
						//  Display author rank information
						reply(res.footer_components[1] ? LEADERBOARD.AUTHOR_RANK : LEADERBOARD.UNRANKED, {
							socket: res.footer_components
						})
					})
			})
	}
}

module.exports.help = {
	start: Leaderboard,
	name:`leaderboard`,
	aliases: [`lb`,`leaderboard`, `rank`, `ranking`],
	description: `pulls up options for the leaderboards`,
	usage: `lb`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}