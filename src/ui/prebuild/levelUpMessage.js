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
		let card = await new Cards({width: 150, height: 50, theme: this.user.usedTheme.alias})
		//  Base
		card.createBase({cornerRadius: 100})
		//  Semi-opaque background
		.addCover({ img: await loadAsset(this.user.usedCover.alias) })
		//  User's avatar on left
		await card.addContent({ 
			avatar: await urlToBuffer(this.user.displayAvatarURL({format: `png`, dynamic: false})),
			avatarRadius: 7,
			marginLeft: 25,
			marginTop: 30,
			inline: true
		})
		//  Main text content
		card.addTitle({ 
			main: `Level up to ${this.level}!`,
			size: 8, 
			fontWeight: `bold`,
			marginLeft: -5,
			marginTop: 29,
			align: `left`,
			inline: true
		})
		//  Finalize
		card.ready()
		return card.canv.toBuffer()
	}
}

module.exports = UI