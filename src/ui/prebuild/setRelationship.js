const Cards = require(`../../ui/components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
class UI {
	/**
	 * Set Relationship UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @param {string} [relationship=``] relationship to be assigned
	 * @return {Canvas}
	 */
	constructor(user={}, relationship=``) {
		this.user = user
		this.relationship = relationship
	}

	async build() {
		//  Initialize framework
		let card = await new Cards({
			width: 320,
			height: 210,
			justify: `center`,
			align: `center`,
			theme: this.user.usedTheme.alias
		})
		//  Base card
		.createBase({})
		//  Semi-opaque background
		.addCover({ img: await loadAsset(this.user.usedCover.alias), gradient: true })
		await card.addContent({
			avatar: await urlToBuffer(this.user.displayAvatarURL({format: `png`, dynamic: false})),
			avatarRadius: 15,
			marginTop: 75,
			justify: `center`
		})
		//  Balance Author
		card.addTitle({main: `As ${this.relationship}?`, size: 18, marginTop: 50, fontWeight: `bold`})
		.addTitle({main: `Please wait until they accept it.`, size: 9, marginTop: 18})
		return card.getBuffer()
	}
}

module.exports = UI