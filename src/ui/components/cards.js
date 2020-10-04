const Canvas = require(`../setup`)
const { resolveImage } = require(`canvas-constructor`)
const sizeOf = require(`buffer-image-size`)
const Color = require(`color`)
const { DEFAULT, DATABAR, CONTENT } = require(`../config`)
const palette = require(`../colors/default`)
const themePresets = require(`../colors/themes`)
/**
 * Universal UI Library for Annie's Material Design.
 * Supports method chaining.
 */
class Card {
	/**
	 * Global presets for current card instance.
	 * @param {*} Object
	 */
	constructor({
		width=DEFAULT.WIDTH, 
		height=DEFAULT.HEIGHT, 
		theme=DEFAULT.THEME, 
		dataBarSize=DEFAULT.DATABAR.SIZE,
		primaryColor=themePresets[DEFAULT.THEME].text,
		marginLeft=50,
		marginTop=50,
		align=`left`
		}) {
		this.width = width
		this.height = height
		this.parsingThemeCode = theme.startsWith(`dark`) ? `dark` : `light`
		this.color = themePresets[this.parsingThemeCode]
		this.canv = new Canvas(this.width, this.height) 
		this.marginLeft = marginLeft
		this.marginTop = marginTop
		this.align = align
		this.dataBarCount = 0
		this.dataBarSize = dataBarSize
		this.reservedSpace = 0
		this.primaryColor = primaryColor
		this.avatar = {width: 50, height: 50}
	}

	getBuffer(){
		return this.canv.toBuffer()
	}

	/**
	 * 	Finisher method chain..
	 * 	@ready
	 */
	ready() {
		return this.canv
	}
	

	/**
	 * 	Fallback handler for component's color property.
	 * 	@param {String} prop color's name reference.
	 *	@param {String} defaultOpt fallback color when given prop is not exists in the available palette pool.
	 * 	@private	
	 * 	@_resolveColor
	 */
	_resolveColor(prop, defaultOpt=`white`) {

		//	Gives default option if the given prop is undefined/null
		if (!prop) return defaultOpt
		//	Following system theming
		if (this.color[prop]) return this.color[prop]
		//	If color is inherited, this will use the defined primary color in the global preset.
		if (prop === `inherit`) return this.primaryColor
		//	Returns if the given prop is a valid hex code
		if (prop.startsWith(`#`)) return prop
		//	Check for color availability in standard colorset
		if (palette[prop]) return palette[prop]

		return defaultOpt
	}

	/**
	 *  ----------------------------------------------------------------------------------------
	 * 	CARDS COMPONENTS SECTION
	 * ----------------------------------------------------------------------------------------
	 * 
	 */

	/**
	 * @current of user currentexp.
	 * @barLength is the width size of the given rectangle.
	 */
	_barSize(current, barlength) {
		return Math.floor(Math.floor(current*100)/100 * barlength)
	}

	/**
	 *  Creating a linebar that similar to exp bar.
	 *  @param {*} Object 
	 */
	addLinebar({
		barColor=this.color.secondary,
		fillColor=this.color.secondary,
		marginLeft=null,
		marginTop=0,
		align=this.align,
		width=200,
		height=10,
		current=50,
		inline=false
		}) {
		
		//  Handle invalid type of color
		barColor = this._resolveColor(barColor, this.color.secondary)
		fillColor = this._resolveColor(fillColor, `red`)

		const progressBar = this._barSize(current, width)
		const dynamicMarginLeft = marginLeft + (align === `center` ? this._getHorizontalAlign(`center`)-Math.floor(width/2) : this._getHorizontalAlign(align))
		this.canv
		.save()
		.save()
		//	Base pipe
		.setColor(barColor)
		.createRoundedClip(dynamicMarginLeft, this.reservedSpace+marginTop, width, height, 240)
		.printRectangle(dynamicMarginLeft, this.reservedSpace+marginTop, width, height)
		.restore()
		//	Filled pipe
		this.canv.setColor(fillColor)
		.createRoundedClip(dynamicMarginLeft,  this.reservedSpace+marginTop, progressBar, height, 240)
		.printRectangle(dynamicMarginLeft, this.reservedSpace+marginTop, progressBar, height)  
		.restore()

		if (!inline) this.reservedSpace += marginTop+height

		return this
	}

	async addCover({img=``, gradient=false }) {
		const grad = this.canv.createLinearGradient(0, 0, 0, Math.floor(this.height/1.5))
		const themeInRgb = Color(this.color.main).rgb().array()
		const semiTransparent = `rgba(${themeInRgb.join(`,`)},0.2)`
		const imgSize = sizeOf(img)
		const dynamicHeight = () => {
			if (imgSize.width < this.width) return imgSize.height+((this.width - imgSize.width))
			if (imgSize.width > this.width) return imgSize.height-((imgSize.width - this.width)/1.5)
			return this.height
		}
		let image = await resolveImage(img)
		img = image
		grad.addColorStop(1, this.color.main)
		grad.addColorStop(0, semiTransparent)
		this.canv
		.setGlobalAlpha(0.2)
		.printImage(img, 0, 0, this.width, dynamicHeight())
		.setGlobalAlpha(1)

		if (gradient) {
			this.canv
			.setColor(grad)
			.printRectangle(0, 0, this.width, this.height)
		}
		return this
	}

	/**
	 *	Initialize canvas with base card layer.
	 *	@param {Hex|ResolvableColor} color custom color choice.
	 *	@param {Integer} cornerRadius integer value for card cornerning radius.
	 *	@createBase
	 */
	createBase({color=``, cornerRadius=DEFAULT.CORNER_RADIUS}) {
		const grad = this.canv.createLinearGradient(0, 0,  Math.floor(this.width/1.5), 0)
		const themeInRgb = Color(this.color.highlight).rgb().array()
		const semiTransparent = `rgba(${themeInRgb.join(`,`)},0.2)`

		grad.addColorStop(1, this.color.highlight)
		grad.addColorStop(0.5, semiTransparent)
		grad.addColorStop(0, this.color.main)

		this.canv
		.setColor(this._resolveColor(color, this.color.main))
		.createRoundedClip(10, 10, this.width - 20, this.height - 20, cornerRadius)
		.printRectangle(0, 0, this.width, this.height)

		return this
	}

	/**
	 * 	Creating a FAB-like bar that displays a bit piece of information.
	 * 	@param {*} Object 
	 * 	@createDataBar
	 */
	createDataBar({
		content=``, 
		label=``, 
		size=this.dataBarSize,
		align=this.align,
		contentColor=null,
		barColor=null,
		width = null,
		height = null,
		labelColor=null,
		disableShadow=false,
		shadowColor=null,
		shadowBlur=15,
		marginTop=0,
		inline=false,
		marginLeft=this.marginLeft,
		releaseHook=false,
		rawPositioning=false,
		contentSize=`MEDIUM`,
		labelSize=`SMALL`
		}) {

		//	Handle sensitive case
		size = size.toUpperCase()
		contentSize = contentSize.toUpperCase()
		labelSize = labelSize.toUpperCase()

		//  Handle missing value
		if (!width) width = DATABAR[size].WIDTH
		if (!height) height = DATABAR[size].HEIGHT
		//	Handle custom color selection
		barColor = this._resolveColor(barColor, this.color.secondary)
		contentColor = this._resolveColor(contentColor, this.color.text)
		labelColor = this._resolveColor(labelColor, this.color.text)
		shadowColor = this._resolveColor(shadowColor, contentColor)

		//	Flexible X positioning
		const leftMarginState = () => {
			if (rawPositioning && (align === `center`)) return this._getHorizontalAlign(`center`)-Math.floor(width/2)
			if (rawPositioning) return marginLeft
			if ((this.dataBarCount > 0) && inline) return (width * this.dataBarCount) + (10 * this.dataBarCount) + marginLeft
			if (align === `center`) return this._getHorizontalAlign(`center`)-Math.floor(width/2)
			return marginLeft
		}
		const topMarginState = () => {
			if (rawPositioning) return marginTop
			return this.reservedSpace+marginTop
		}


		this.canv.save()
		//	Apply shadow if the selected theme is allowing object shadow elevation.
		if (!disableShadow && this.color.allowedShadow) {
			this.canv.setShadowColor(shadowColor)
			.setShadowOffsetX(0)
			.setShadowOffsetY(7)
			.setShadowBlur(shadowBlur)
			.setColor(this.color.main)
	
			.printRectangle(leftMarginState()+20, topMarginState()+20, width-40, height-35)
			.setShadowBlur(0)
			.setShadowOffsetY(0)
			
		}

		//	If custom color is not specified, will follow default theming preset instead.
		this.canv.setColor(barColor)
		.createRoundedClip(leftMarginState(), topMarginState(), width, height, DEFAULT.DATABAR.CORNER_RADIUS)
		.printRectangle(marginLeft, topMarginState(), this.width, this.height)
		//  Content
		this.canv
		.setTextAlign(align)
		.setColor(contentColor)
		.setTextFont(CONTENT[`MAIN_TEXT`].SIZE[contentSize])
		.printText(content, leftMarginState()+(width/2), topMarginState()+(height/1.4))
		//  Label
		this.canv
		.setTextAlign(align)
		.setColor(labelColor)
		.setTextFont(CONTENT[`LABEL`].SIZE[labelSize])
		.printText(label, leftMarginState()+(width/2), topMarginState()+(height/3.9))


		this.canv.restore()
		//	Add state for flexible X positioning
		this.dataBarCount += 1
		//	Add state for flexible Y positioning
		if (!inline || (inline && releaseHook)) this.reservedSpace += marginTop+height
		return this
	}

	/**
	 *	Create content separator. Vertically.
	 *	@param {*} Object
	 *	@createVerticalSeparator
	 */
	createVerticalSeparator({margin=20, thickness=1}) {
		this.canv
		.setColor(this.color.separator)
		.printRectangle(0, this.reservedSpace + margin, this.width, thickness)

		this.reservedSpace += (margin*2)

		return this
	}

	/**
	 *  ----------------------------------------------------------------------------------------
	 * 	TYPOGRAPHY COMPONENTS SECTION
	 * ----------------------------------------------------------------------------------------
	 * 
	 */

	 
	/**
	 * 	Return fixed position for custom horizontal align
	 * 	@param {String} alignName
	 * 	@_getHorizontalAlign
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
	 * 	Add title section to the card.
	 * 	@param {*} Object 
	 * 	@addTitle
	 */
	addTitle({
		main=``,
		caption=null, 
		align=this.align,
		inline=false,
		releaseHook=false,
		marginTop=this.marginTop,
		marginLeft=0,
		size=null,
		captionMargin=15,
		fontWeight=`light`,
		captionColor=this.color.caption,
		color=this.color.text}) {
		color = this._resolveColor(color, this.color.text)
		captionColor = this._resolveColor(captionColor, this.color.text)
		this.canv
		.setColor(color)
		.setTextAlign(align)
		.setTextFont(size ? `${parseInt(size)}pt roboto-${fontWeight}` : DEFAULT.HEADER.TITLE.FONT)
		.printText(main, this._getHorizontalAlign(align)+marginLeft, this.reservedSpace+marginTop)
		if (caption) {
			this.canv
			.setTextFont(size ? `${parseInt(size/1.5)}pt roboto-${fontWeight}` : DEFAULT.HEADER.CAPTION.FONT)
			.setColor(captionColor)
			.printText(caption, this._getHorizontalAlign(align)+marginLeft, this.reservedSpace+marginTop+captionMargin)
		}
		//	Add state for flexible Y positioning
		if (!inline || (releaseHook && inline)) {
			if (caption) this.reservedSpace += captionMargin
			this.reservedSpace += marginTop
		}

		return this
	}

	/**
	 *	Add content/body section to the card.
	 *	@param {*} Object 
	 * 	@addContent
	 */
	async addContent({
		main=``,
		caption=null,
		align=this.align,
		mainColor=this.color.text,
		captionColor=this.color.caption,
		fontWeight=`Bold`,
		size=`small`,
		justify=null,
		marginTop=this.marginTop,
		marginLeft=this.marginLeft,
		marginBottom=0,
		inline=false,
		releaseHook=false,
		captionMargin=20,
		img=null,
		imgDy=0,
		imgDx=0,
		avatar=null,
		avatarRadius=10
		}) {
		//	Handle sensitive case
		if (typeof size === `string`) size = size.toUpperCase()
		//	Handle custom color selectio
		mainColor = this._resolveColor(mainColor, this.color.text)
		captionColor = this._resolveColor(captionColor, this.color.caption)

		const customAvatarRadius = avatarRadius ? avatarRadius : Math.floor(this.avatar.width/2)
		const customAvatarWidth = avatarRadius ? avatarRadius * 2 : this.avatar.width
		const customAvatarHeight = avatarRadius ? avatarRadius * 2 : this.avatar.height
		const mainMarginLeft = () => {
			let combinedCustomXAxis = 0
			if (justify) combinedCustomXAxis += this._getHorizontalAlign(justify)
			/** 
			*  If avatar parameter is supplied, then the text's X position
			*  will be sum by avatarRadius value.
			*  EXAMPLE: 
			*  avatarRadius = 10
			*  textX = 50
			*  w/o Avatar -> 50 = X position = textX
			*  w/ Avatar -> 60 = X position = textX + avatarRadius 
			*  (therefore, avatar will be placed on the text's original X position.) 
			*/
			if (avatar) combinedCustomXAxis += customAvatarWidth + 20
			return combinedCustomXAxis + marginLeft
		}
		const avatarMarginLeft = () => {
			let combinedCustomXAxis = 0
			if (justify === `center`) return this._getHorizontalAlign(`center`)//-customAvatarRadius
			return combinedCustomXAxis + marginLeft
		}

		if (caption) {
			this.canv
			.setTextFont(CONTENT.CAPTION.SIZE.LARGE)
			.setColor(captionColor)
			.printText(caption, marginLeft, this.reservedSpace+marginTop+captionMargin)
		}
		
		if (avatar) {
			avatar = await resolveImage(avatar)
			this.canv.printCircularImage(avatar, avatarMarginLeft(), (this.reservedSpace+marginTop)-3, customAvatarWidth, customAvatarHeight, customAvatarRadius)
		}
		if (main) {
			this.canv
			.setColor(mainColor)
			.setTextAlign(align)
			.setTextFont(CONTENT.MAIN_TEXT.SIZE[size] || `${size}pt roboto-${fontWeight}`)
			.printText(main, mainMarginLeft(), this.reservedSpace+marginTop)
		}

		//	Add state for flexible Y positioning
		if (!inline || (inline && releaseHook)) {
			if (caption) this.reservedSpace += captionMargin 
			if (img) this.reservedSpace += sizeOf(img).height
			if (avatar) this.reservedSpace += customAvatarRadius
			this.reservedSpace += marginTop
		}
		if (img) {
			img = await resolveImage(img)
			this.canv.printImage(img, marginLeft+this._getHorizontalAlign(justify), this.reservedSpace+marginTop-marginBottom, imgDx, imgDy)
		}
		return this
	}
}

module.exports = Card