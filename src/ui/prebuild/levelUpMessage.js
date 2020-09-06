const Cards = require(`../../ui/components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)

class UI {
	/**
	 * LevelUp-Message UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @param {number} [level=0] new level to be displayed in the card
	 * @return {Canvas}
	 */
	constructor(user={}, level=0) {
		this.user = user
		this.level = level
	}

	async build() {
		let card = await new Cards({width: 180, height: 60, theme: this.user.usedTheme.alias})
		//  Base
		card.createBase({cornerRadius: 100})
		//  Semi-opaque background
		.addCover({ img: await loadAsset(this.user.usedCover.alias) })
		//  User's avatar on left
		await card.addContent({ 
			avatar: await urlToBuffer(this.user.displayAvatarURL({format: `png`, dynamic: false})),
			avatarRadius: 9,
			marginLeft: 29,
			marginTop: 33,
			inline: true
		})
		//  Main text content
		card.addTitle({ 
			main: `Level up to ${this.level}!`,
			size: 10, 
			fontWeight: `bold`,
			marginLeft: 5,
			marginTop: 34,
			align: `left`,
			inline: true
		})
		//  Finalize
		card.ready()
		return card.canv.toBuffer()
	}
}

module.exports = UI