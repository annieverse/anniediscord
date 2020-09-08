const Cards = require(`../../ui/components/cards`)
const commanifier = require(`../../utils/commanifier`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
const Color = require(`color`)

class UI {
	/**
	 * Pay UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @param {number} [amountToSend=0] amount of artcoins to be sent
	 * @return {Canvas}
	 */
	constructor(user={}, amountToSend=0) {
		this.user = user
		this.amountToSend = amountToSend
	}

	async build() {
		//  Initialize framework
		let card = await new Cards({
			width: 320,
			height: 310,
			justify: `center`,
			align: `center`,
			theme: this.user.usedTheme.alias
		})
		//  Base card
		.createBase({})
		//  Semi-opaque background
		.addCover({ img: await loadAsset(this.user.usedCover.alias), gradient: true })
		await card.addContent({
			avatar: await urlToBuffer(this.user.user.displayAvatarURL({format: `png`, dynamic: false})),
			avatarRadius: 12,
			justify: `center`,
			marginTop: 60
		})
		//  Balance Author
		card.addTitle({main: this.user.user.username, size: 12, marginTop: 30})
		.addTitle({main: `will receive ...`, size: 9, marginTop: 20})
		//  Amount to send
		.addTitle({main: commanifier(this.amountToSend), size: 30, marginTop: 80})
		.addTitle({main: `artcoins?`, size: 9, marginTop: 25})
		// Finalize
		.ready()
		return card.getBuffer()
	}
}

module.exports = UI