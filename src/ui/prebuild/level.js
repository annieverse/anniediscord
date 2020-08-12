const Cards = require(`../../ui/components/cards`)
const formatK = require(`../../utils/formatK`)
const commanifier = require(`../../utils/commanifier`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
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
		const currentBarPercentage = this.user.exp.current_exp <=  this.user.exp.minexp ? 0 : (this.user.exp.current_exp - this.user.exp.minexp) / this.user.exp.nextexpcurve
		const adjustedPrimaryColorContrast = this.user.usedTheme.alias === `light` ? Color(this.user.rank.color).saturate(0.8).darken(0.4).hex() : this.user.rank.color
		let card = await new Cards({ width: 260, height: 260, theme: this.user.usedTheme.alias, primaryColor: adjustedPrimaryColorContrast, align: `center` })
		//	Base card
		.createBase({})
		//  Add top cover
		.addCover({ img: await loadAsset(this.user.usedCover.alias), gradient: true })
		await card
		//	Avatar representative
		.addContent({ avatar: await urlToBuffer(this.user.user.displayAvatarURL({format: `png`, dynamic: false})), justify: `center`, marginTop: 65,
		avatarRadius: 12 })
		card
		//	Author and rank name
		.addTitle({ main: this.user.user.username, caption: this.user.rank.name, captionColor: `inherit`, size: 15, marginTop: 25 })
		//	Add experience bar
		.addLinebar({  
			current: currentBarPercentage, 
			fillColor: `inherit`, 
			marginTop: 25,
			width: 200, 
			height: 12
		})
		//  Required exp to the next level
		.createDataBar({ 
			content: `${formatK(this.user.exp.maxexp - this.user.exp.current_exp)} EXP`, 
			label: `until level ${commanifier(this.user.exp.level + 1)}`, 
			labelSize: `MICRO`,
			size: `SMALL`, 
			contentColor: `inherit`,
			barColor: `main`,
			width: 150,
			marginTop: 10
		})
		//  Small chip under avatar that displays user's current level
		.createDataBar({ 
			rawPositioning: true,
			content: commanifier(this.user.exp.level),
			size: `MICRO`, 
			contentSize: `MICRO`,
			contentColor: `inherit`,
			barColor: `main`,
			marginTop: 75,
			disableShadow: true
		})
	
		//	Finalize
		.ready()
		return card.getBuffer()
	}
}

module.exports = UI