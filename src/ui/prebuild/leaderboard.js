const Cards = require(`../../ui/components/cards`)
const formatK = require(`../../utils/formatK`)
const commanifier = require(`../../utils/commanifier`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
const Color = require(`color`)

class UI {
	/**
	 * Leaderboard UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @param {object} [lbData={}] returned result from `Database.indexRanking()`
	 * @param {function} [nameParser] user_id parser tool. Ref to `Pistachio.name()`
	 * @param {function} [avatarParser] user's avatar parser tool. Ref to `Pistachio.avatar()`
	 * @return {Canvas}
	 */
	constructor(user={}, lbData={}, nameParser, avatarParser) {
		this.user = user
		this.lbData = lbData
		this.nameParser = nameParser
		this.avatarParser = avatarParser
	}

	async build() {
		let card = new Cards({width: 520, height: 550, theme: `dark`}).createBase({cornerRadius: 50})
		let topTenRows = this.lbData.slice(0, 10)
		card.addCover({ img: await urlToBuffer(this.avatarParser(topTenRows[0].id)), gradient: true }) 
		for (let row in topTenRows) {
			let ranking = parseInt(row) + 1
			let colorByRank = ranking <= 1 ? `yellow` : ranking <= 2 ? `lightblue` : ranking <= 3 ? `palebrown` : `text`

			//  Add highlight and lighten the text if current row is the author
			if (topTenRows[row].id === this.user.id) {
				colorByRank = `purewhite`
				card.createDataBar({
					barColor: `golden`, 
					shadowColor: `golden`,
					inline: true,
					marginTop: 22,
					height: 50,
					width: 500
				})
			}

			//  User name
			const userName = this.nameParser(topTenRows[row].id)
			card.addContent({
				main: userName.length >= 18 ? userName.slice(0, 18) + `...` : userName,
				fontWeight: `bold`,
				size: 12,
				avatar: await this.avatarParser(topTenRows[row].id, true), 
				avatarRadius: 20,
				mainColor: colorByRank,
				marginLeft: 120,
				inline: true
			})

			//  User points (EXP/AC/HEARTS/ETC)
			card.addContent({
				main: commanifier(topTenRows[row].points),
				justify: `right`,
				align: `right`,
				marginLeft: -40,
				mainColor: colorByRank,
				inline: true,
			})

			//  User ranking
			card.addContent({
				main: `#${ranking}`,
				mainColor: colorByRank,
				releaseHook: true,
				marginLeft: 80
			})
		}
		return card.ready()
	}
}

module.exports = UI