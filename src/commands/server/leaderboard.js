const Card = require(`../../ui/components/cards`)
const Command = require(`../../libs/commands`)
/**
 * Displays current leaderboard in the server
 * @author klerikdust
 */
class Leaderboard extends Command {

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
    async execute({ reply, emoji, avatar, commanifier, name, bot:{db, locale:{LEADERBOARD}} }) {
		await this.requestUserMetadata(2)

		const keywords = [
				[`exp`, `xp`, `lvl`, `level`],
				[`artcoins`, `ac`, `artcoin`, `balance`],
				[`fame`, `rep`,  `reputation`, `reputations`, `reps`],
				[`artists`, `arts`, `artist`, `art`, `artwork`],
				[`anime`, `weeb`, `otaku`, `weebs`, `mal`],
				[`halloween`, `hallowee`, `candies`, `cdy`, `spooky`, `spook`]
		]
		const wholeKeywords = () => {
			let arr = []
			for (let i = 0; i < keywords.length; i++) {
				arr.push(...keywords[i])
			}
			return arr
		}

		//  Returns a guide if no parameter was specified.
		if (!this.args[0]) return reply(LEADERBOARD.SHORT_GUIDE)
		//  Returns if parameter is invalid.
		if (!wholeKeywords().includes(this.args[0].toLowerCase())) return reply(LEADERBOARD.INVALID_CATEGORY)
		//  Store key of selected group
		const selectedGroup = keywords.filter(v => v.includes(this.args[0].toLowerCase()))[0][0]

		return reply(LEADERBOARD.FETCHING, {
			socket: [selectedGroup],
			simplified: true
		})
		.then(async load => {
			//  Pull leaderboard data based on given keyword
			const lbData = await db.indexRanking(selectedGroup)
			//  Handle if no returned leaderboard data
			if (!lbData.length) {
				load.delete()
				return reply(`no leaderboard data found for **${selectedGroup}** category`)
			}


			//  Get interface buffer
			let ui = await new Card({width: 520, height: 550, theme: `dark`})
			.createBase({cornerRadius: 50})

			for (let row in lbData) {
				let ranking = parseInt(row) + 1
				let colorByRank = ranking <= 1 ? `yellow` : ranking <= 2 ? `lightblue` : ranking <= 3 ? `palebrown` : `text`

				//  Add highlight and lighten the text if current row is the author
				if (lbData[row].id === this.user.id) {
					colorByRank = `purewhite`
					ui.createDataBar({
						barColor: `golden`, 
						inline: true,
						marginTop: 22,
						height: 50,
						width: 500
					})
				}

				//  User name
				const userName = name(lbData[row].id)
				ui.addContent({
					main: userName.length >= 18 ? userName.slice(0, 18) + `...` : userName,
					fontWeight: `black`,
					size: 12,
					avatar: await avatar(lbData[row].id, true), 
					mainColor: colorByRank,
					marginLeft: 120,
					inline: true
				})

				//  User points (EXP/AC/HEARTS/ETC)
				ui.addContent({
					main: commanifier(lbData[row].points),
					justify: `right`,
					align: `right`,
					marginLeft: -40,
					mainColor: colorByRank,
					inline: true,
				})

				//  User ranking
				ui.addContent({
					main: `#${ranking}`,
					mainColor: colorByRank,
					releaseHook: true,
					marginLeft: 80
				})
			}

			load.delete()
			return reply(`${emoji(selectedGroup)} **| ${selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)} Leaders**`, {
				prebuffer: true,
				image: ui.ready().toBuffer(),
				simplified: true
			})

		})
	}
}

module.exports.help = {
	start: Leaderboard,
	name:`leaderboard`,
	aliases: [`lb`,`leaderboard`, `rank`, `ranking`],
	description: `Get local leaderboard`,
	usage: `lb`,
	group: `Server`,
	permissionLevel: 0,
	multiUser: false
}