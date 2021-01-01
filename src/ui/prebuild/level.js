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
		const currentBarPercentage = this.user.exp.current_exp <=  this.user.exp.minexp ? 0 : (this.user.exp.current_exp - this.user.exp.minexp) / this.user.exp.nextexpcurve
		const adjustedPrimaryColorContrast = this.user.usedTheme.alias === `light` ? Color(this.user.rank.color).saturate(0.8).darken(0.4).hex() : this.user.rank.color
		let card = await new Cards({ width: 260, height: 260, theme: this.user.usedTheme.alias, primaryColor: adjustedPrimaryColorContrast, align: `center` })
		//	Base card
		.createBase({})
		//  Add top cover
		await card.addBackgroundLayer(this.user.usedCover.alias,{
			isSelfUpload: this.user.usedCover.isSelfUpload, 
			minHeight: 180,
			gradient: true,
			gradientHeight: 180
		})
		//	Avatar representative
		await card.addContent({ avatar: await urlToBuffer(this.user.displayAvatarURL({format: `png`, dynamic: false})), justify: `center`, marginTop: 65, avatarRadius: 12 })
		//	Author and rank name
		card.addTitle({ main: this.user.username, caption: symbolParser(this.user.rank.name), captionColor: `inherit`, size: 15, marginTop: 40 })
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
			content: `${formatK(Math.round(this.user.exp.maxexp - this.user.exp.current_exp))} EXP`, 
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