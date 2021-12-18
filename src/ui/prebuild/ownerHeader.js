const Cards = require(`../../ui/components/cards`)
const formatK = require(`../../utils/formatK`)
const commanifier = require(`../../utils/commanifier`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const symbolParser = require(`../../utils/symbolParser`)
const Color = require(`color`)
class UI {
	/**
	 * Level UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @return {Canvas}
	 */
	constructor(user={}) {
		this.user = user
	}

	async build() {
		let card = await new Cards({ width: 260, height: 160, theme: this.user.usedTheme.alias, align: `center` })
		//	Base card
		.createBase({})
		//  Add top cover
		await card.addBackgroundLayer(this.user.usedCover.alias,{
			isSelfUpload: this.user.usedCover.isSelfUpload, 
			minHeight: 120,
			gradient: true,
			gradientHeight: 160
		})
		//	Avatar representative
		await card.addContent({ avatar: await urlToBuffer(this.user.master.displayAvatarURL({format: `png`, dynamic: false})), justify: `center`, marginTop: 80, avatarRadius: 24 })
		//	Finalize
		card.ready()
		return card.getBuffer()
	}
}

module.exports = UI
