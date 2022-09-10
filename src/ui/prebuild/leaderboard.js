const Cards = require(`../../ui/components/cards`)
const commanifier = require(`../../utils/commanifier`)
const urlToBuffer = require(`../../utils/urlToBuffer`)

class UI {
	/**
	 * Leaderboard UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @param {object} [lbData={}] returned result from `Database.indexRanking()`
     * @parma {Client} client Current bot instance.
	 * @return {Canvas}
	 */
	constructor(user={}, lbData={}, client, guild) {
		this.user = user
		this.lbData = lbData
        this.client = client
		this.guild = guild
	}

	async build() {
		let card = new Cards({width: 520, height: 550, theme: `light`}).createBase({})
		let topTenRows = this.lbData.slice(0, 10)
		await card.addCover({ img: await urlToBuffer(await this.client.getUserAvatar(topTenRows[0].id, this.guild.id)), gradient: true })
		for (let row in topTenRows) {
			let ranking = parseInt(row) + 1
			let colorByRank = ranking <= 1 ? `crimson` : ranking <= 2 ? `blue` : ranking <= 3 ? `darkbrown` : `text`

			//  Add highlight and lighten the text if current row is the author
			if (topTenRows[row].id === this.user.master.id) {
				colorByRank = `purewhite`
				card.createDataBar({
					barColor: `pink`, 
					shadowColor: `pink`,
					inline: true,
					marginTop: 22,
					height: 50,
					width: 500
				})
			}

			//  User ranking
			card.addContent({
				main: `#${ranking}`,
				mainColor: colorByRank,
				inline: true,
				marginLeft: 80
			})

			//  User name
			//  This one required to be async, since we use canvas constructor's .resolveImage()
			//  to handle the avatar.
			const userName = await this.client.getUsername(topTenRows[row].id)
			await card.addContent({
				main: userName.length >= 18 ? userName.slice(0, 18) + `...` : userName,
				fontWeight: `bold`,
				size: 12,
				avatar: await this.client.getUserAvatar(topTenRows[row].id, this.guild.id, true), 
				avatarRadius: 10,
				mainColor: colorByRank,
				marginLeft: 140,
				inline: true
			})

			//  User points (EXP/AC/HEARTS/ETC)
			card.addContent({
				main: commanifier(Math.floor(topTenRows[row].points)),
				justify: `right`,
				align: `right`,
				marginLeft: -40,
				mainColor: colorByRank,
				releaseHook: true,
			})
		}
		return card.ready()
	}
}

module.exports = UI
