const Cards = require(`../../ui/components/cards`)
class LevelUI {
	/**
	 * Level User Interface
	 * @param {Object} stacks pistachio's stack from command module. 
	 */
	constructor(stacks=Object) {
		this.stacks = stacks
	}


	async build() {
		const { avatar, meta:{author, data}, getExpMetadata, commanifier } = this.stacks
		const exp = getExpMetadata(data.currentexp)
		const current = data.currentexp <= exp.minexp ? 0 : (data.currentexp - exp.minexp) / exp.nextexpcurve
	
	
		return new Cards({ width: 500, height: 260, theme: `dark`, primaryColor: data.rank.color })
	
	
		//	Base card
		.createBase({})
		//	Avatar representative
		.addContent({ avatar: await avatar(author.id, true), inline: true })
		//	Rank name 
		.addTitle({ marginLeft: 100, marginTop: 70, main: data.rank.name, color: data.rank.color , inline: true, size: 8 })
		//	Author name
		.addTitle({ marginLeft: 100, marginTop: 100, main: author.user.username, size: 20 })
		//	Add experience bar
		.addLinebar({ marginLeft: 100, marginTop: 120, current: current, max: exp.maxexp, fillColor: data.rank.color, width: 280 })
	
	
		//	Footer contents
		.createDataBar({ 
			content: data.level,
			label: `level`,
			size: `SMALL-MED`, 
			contentColor: `inherit`, 
			barColor: `main`,
			marginTop: 30, 
			inline: true 
		})
		.createDataBar({ 
			content: commanifier(data.currentexp), 
			label: `current exp`, 
			size: `SMALL-MED`, 
			contentColor: `inherit`,
			barColor: `main`,
			marginTop: 30, 
			inline: true 
		})
		.createDataBar({ 
			content: commanifier(exp.maxexp - data.currentexp), 
			label: `next level up`, 
			size: `SMALL-MED`, 
			contentColor: `inherit`,
			barColor: `main`,
			marginTop: 30, 
			inline: true 
		})
	
	
		//	Finalize
		.ready()
	}


	async render() {
		const buffer = (await this.build()).toBuffer()
		return buffer
	}
}

module.exports = LevelUI