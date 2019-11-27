const { Canvas } = require(`canvas-constructor`) 
const palette = require(`./colorset`)

class Card {
	constructor({width=500, height=400}) {
		this.width = width
		this.height = height
		this.color = palette.white
		this.canv = new Canvas(this.width, this.height) 
	}


	get base() {
		this.canv.setColor(this.color)
		.createBeveledClip(10, 10, this.width - 20, this.height - 20, 30)
		.addRect(0, 0, this.width, this.height)

		return this.canv
	}
}

module.exports = Card