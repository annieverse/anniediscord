const Cards = require(`../../ui/components/cards`)
const commanifier = require(`../../utils/commanifier`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
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
			height: 210,
			justify: `left`,
			align: `left`,
			theme: this.user.usedTheme.alias
		})
		//  Base card
		.createBase({})
		//  Semi-opaque background
		.addCover({ img: await loadAsset(this.user.usedCover.alias), gradient: true })
		await card.addContent({
			avatar: await urlToBuffer(this.user.displayAvatarURL({format: `png`, dynamic: false})),
			avatarRadius: 7,
			marginTop: 65,
			marginLeft: 80,
			inline: true
		})
		//  Balance Author
		card.addTitle({main: this.user.username + `,`, size: 12, marginLeft: 60, marginTop: 60, fontWeight: `bold`})
		.addTitle({main: `will receive ...`, size: 9, marginLeft: 70, marginTop: 15})
		//  Artcoins visual
		const amountTextLength = commanifier(this.amountToSend).length
		const imageRadius = 50
		await card.addContent({
			img: await loadAsset(`artcoins`),
			justify: `center`,
			align: `center`,
			marginLeft: (0-(imageRadius/2)) - amountTextLength*12 + (amountTextLength >= 8 ? 20 : 0),
			imgDx: imageRadius,
			imgDy: imageRadius,
			marginTop: 20,
			inline: true
		})
		//  Amount to get
		const dynamicX = amountTextLength <= 3 ? 20 + amountTextLength*2 : 10 + amountTextLength*2
		card.addTitle({main: commanifier(this.amountToSend), size: 30, marginTop: 60, marginLeft: dynamicX,justify: `center`, align: `center`})
		// Finalize
		.ready()
		return card.getBuffer()
	}
}

module.exports = UI