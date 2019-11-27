
const palette = require(`../colorset`)

/**
  * Typography Library (Use object from CardComponents base)
  * Library
 */
class Typography {
	constructor(base, color=`white`) {
		this.color = palette[color]
		this.card = base
	}


	/**
	  * Returning base card in canvas object.
	  *	@base
	 */
	addTitle(text = ``) {
		this.card.setColor(this.color)
		this.card.setTextAlign(`left`)
		this.card.setTextFont(`30pt RobotoBold`)
		this.card.addText(text, 50, 100)

		return this
	}

}

module.exports = Typography