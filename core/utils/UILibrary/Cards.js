const { Canvas } = require(`canvas-constructor`) 
const palette = require(`../colorset`)
const themePresets = require(`./Themes`)
const { DEFAULT, DATABAR, CONTENT } = require(`./Configurations`)

/**
 * Universal Card UI 
 * Library
 * 
 * Supports method chaining for flexibility
 */
class Card {

	constructor({width=DEFAULT.WIDTH, height=DEFAULT.HEIGHT, theme=DEFAULT.THEME, dataBarSize=DEFAULT.DATABAR.SIZE}) {
		this.width = width
		this.height = height
		this.color = themePresets[theme]
		this.canv = new Canvas(this.width, this.height) 
		this.marginLeft = 50
		this.marginTop = 20
		this.dataBarCount = 0
		this.dataBarSize = dataBarSize
		this.reservedSpace = 0
	}


	/**
	 * 	Niche method so its fully-ready to be converted to buffer.
	 * 	@ready
	 */
	ready() {
		return this.canv
	}


	/**
	 *  ----------------------------------------------------------------------------------------
	 * 	CARDS COMPONENTS SECTION
	 * ----------------------------------------------------------------------------------------
	 * 
	 */


	/**
	 *	Create standard base card.
	 *	@createBase
	 */
	createBase() {
		this.canv.setColor(this.color.main)
		.createBeveledClip(10, 10, this.width - 20, this.height - 20, 30)
		.addRect(0, 0, this.width, this.height)

		return this
	}


	/**
	 * Creating Data Bar
	 * @param {*} Object 
	 */
	createDataBar({content=``, size=this.dataBarSize, position=`bottom`, label=``, color=null}) {

		//	Handle sensitive case
		size = size.toUpperCase()

		const leftMarginState = this.dataBarCount > 0 
		? (DATABAR[size].WIDTH * this.dataBarCount) + (10 * this.dataBarCount) + this.marginLeft
		: this.marginLeft

		const positionPresets = {
			top: Math.floor(this.height / 8),
			center: this.height / 2,
			bottom: this.height / 1.4
		}

		//	If custom color is not specified, will follow default theming preset instead.
		this.canv.setColor(color ? palette[color] : this.color.secondary)

		.save()
		.createBeveledClip(leftMarginState, positionPresets[position], DATABAR[size].WIDTH, DATABAR[size].HEIGHT, DEFAULT.DATABAR.CORNER_RADIUS)
		.addRect(this.marginLeft, positionPresets[position], this.width, this.height)

		this._databarTextContent({
			align: `center`,
			content: content, 
			marginLeft: leftMarginState+(DATABAR[size].WIDTH/2), 
			marginTop: positionPresets[position]+(DATABAR[size].HEIGHT/1.3),
			color: this.color.okay,
		})

		this._databarTextContent({
			align: `left`,
			content: label, 
			marginLeft: leftMarginState+20, 
			marginTop: positionPresets[position]+10,
			size: `SMALL`,
			color: this.color.caption
			
		})

		this.canv.restore()

		//	Add state for flexible X positioning
		this.dataBarCount += 1

		return this
	}


	/**
	 *  ----------------------------------------------------------------------------------------
	 * 	TYPOGRAPHY COMPONENTS SECTION
	 * ----------------------------------------------------------------------------------------
	 * 
	 */


	/**
	 * 	Content-fill for Data Bar
	 * 	@param {Object} Object
	 */
	_databarTextContent({content=``, marginTop=this.marginTop, marginLeft=this.marginLeft, size=`MEDIUM`, align=`center`, color=this.color.text}) {
		this.canv
		.setTextAlign(align)
		.setColor(color)
		.setTextFont(CONTENT.MAIN_TEXT.SIZE[size])
		.addText(content, marginLeft, marginTop)
	}	

	 
	/**
	 * 	Return fixed position for custom horizontal align
	 * 	@param {String} alignName
	 */
	_getHorizontalAlign(alignName=`left`) {
		const alignPresets = {
			left: this.marginLeft,
			center: this.width/2,
			right: this.width - this.marginLeft
		}

		return alignPresets[alignName]
	}


	/**
	 * Add title section to the card.
	 * @param {Object} Object 
	 */
	addTitle({
		main=``,
		caption=null, 
		align=`left`,
		inline=false,
		marginTop=DEFAULT.HEADER.TITLE.HEIGHT,
		captionMargin=25}) {

		this.canv
		.setColor(this.color.text)
		.setTextAlign(align)
		.setTextFont(DEFAULT.HEADER.TITLE.FONT)
		.addText(main, this._getHorizontalAlign(align), DEFAULT.HEADER.TITLE.HEIGHT)

		if (caption) {
			this.canv
			.setTextFont(DEFAULT.HEADER.CAPTION.FONT)
			.setColor(this.color.caption)
			.addText(caption, this._getHorizontalAlign(align), DEFAULT.HEADER.TITLE.HEIGHT + captionMargin)
		}

		//	Add state for flexible Y positioning
		if (!inline) {
			caption ? this.reservedSpace += this.reservedSpace+marginTop+captionMargin : this.reservedSpace += marginTop
		}

		return this
	}


	/**
	 * Add content/body section to the card.
	 * @param {Object} Object 
	 */
	addContent({
		main=``,
		caption=null,
		align=`left`,
		textColor=this.color.okay,
		captionColor=this.color.okay,
		size=`small`,
		marginTop=this.marginTop,
		marginLeft=this.marginLeft,
		inline=false,
		captionMargin=20,
		databarContent=false}) {

		//	Handle sensitive case
		size = size.toUpperCase()

		this.canv
		.setColor(textColor)
		.setTextAlign(align)
		.setTextFont(CONTENT.MAIN_TEXT.SIZE[size])
		.addText(main, inline ? marginLeft + 30 : marginLeft, this.reservedSpace+marginTop)

		if (caption) {
			this.canv
			.setTextFont(CONTENT.CAPTION.SIZE.LARGE)
			.setColor(captionColor)
			.addText(caption, marginLeft, this.reservedSpace+marginTop+captionMargin)
		}

		//	Add state for flexible Y positioning
		if (!inline) {
			caption ? this.reservedSpace += this.reservedSpace+marginTop+captionMargin : this.reservedSpace += marginTop
		}

		if (databarContent) return

		return this
	}
}

module.exports = Card