const Cards = require(`../../ui/components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)

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
		let card = await new Cards({width: 250, height: 80, theme: this.user.usedTheme.alias})
		//  Base
		card.createBase({cornerRadius: 100})
		//  Add top cover
		await card.addBackgroundLayer(this.user.usedCover.alias,{
			isSelfUpload: this.user.usedCover.isSelfUpload, 
			gradient: true,
			gradientHeight: 160
		})
		//  User's avatar on left
		await card.addContent({ 
			avatar: await urlToBuffer(this.user.displayAvatarURL({format: `png`, dynamic: false})),
			avatarRadius: 10,
			marginLeft: 42,
			marginTop: 43,
			inline: true
		})
		//  Main text content
		card.addTitle({ 
			main: `Level up to ${this.level}!`,
			size: 13, 
			fontWeight: `bold`,
			marginLeft: 25,
			marginTop: 46,
			align: `left`,
			inline: true
		})
		//  Finalize
		card.ready()
		return card.canv.toBuffer()
	}
}

module.exports = UI