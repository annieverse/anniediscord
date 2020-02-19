const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)

Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/Whitney.otf`)), `Whitney`)


/**
 *  Handles canvas-powered graphic result from gacha roll
 *  @param {Object} Stacks de'facto parameter
 *  @param {Object} container An object of parsed roll result.
 */
class canvasGUI {
	constructor(Stacks, container) {
		this.stacks = Stacks
		this.canvas_x = 210
		this.canvas_y = 265
		this.startPos_x = 15
		this.startPos_y = 15
		this.baseWidth = this.canvas_x - 40
		this.baseHeight = this.canvas_y - 50
		this.container = container
		this.canv = null
		this.indexrow = {
			"top": [0, 1, 2, 3, 4],
			"bottom": [5, 6, 7, 8, 9],
		}
		this.amount = container.amount
		this.amountofpages = Math.ceil(container.amount / 15)
	}

	/**
     * 
     * Render item's graphic
     *  @param {Integer|Float} x horizontal coordinates
     *  @param {Integer|Float} y vertical coordinates
     *  @param {Integer|Float} dx second horizontal coordinates point after x
     *  @param {Integer|Float} dy second vertical coordinates point after x
     *  @param {Integer|Float} dm overall diameter/size
     *  @param {Integer} index current index position of item's object
     */
	async itemVisual(x, y, dx, dy, dm, index = 0) {
		const { loadAsset } = this.stacks
		this.canv.addImage(await loadAsset(this.container.alias[index]), x, y, dx, dy, dm)
	}


	/**
     *  Handles item's descriptive text
     *  @param {Integer|Float} x horizontal coordinates
     *  @param {Integer|Float} y vertical coordinates
     *  @param {Integer} index current index position of item's object
     */
	async itemText(x, y, index = 0) {
		const { palette } = this.stacks
		//  Name
		this.canv.setColor(palette.white)
		this.canv.setTextAlign(`center`)
		this.canv.setTextFont(`9pt Whitney`)
		this.canv.addText(this.container.item[index], x, y)
		//  Rarity
		this.canv.setTextFont(`9pt Whitney`)
		this.canv.addText(`★`.repeat(this.container.rarity[index]), x, y + 15)
	}


	/**
     *  Render drop shadow
     *  @param {HexColor} color defining shadow color. Default is recommended.
     */
	dropShadow(color = this.stacks.palette.darkmatte) {
		this.canv.setShadowColor(`rgba(28, 28, 28, 1)`)
		this.canv.setShadowOffsetY(3)
		this.canv.setShadowBlur(3)
		this.canv.setColor(color)
	}


	/**
     *  Remove existing drop shadow to avoid unwanted visual.
     */
	removeShadowLayer() {
		this.canv.setShadowBlur(0)
		this.canv.setShadowOffsetY(0)
	}


	/**
     *  Add dead shape as a shadow's placeholder.
     *  @param {Integer|Float} x horizontal coordinates
     *  @param {Integer|Float} y vertical coordinates
     *  @param {Integer|Float} dx second horizontal coordinates point after x
     *  @param {Integer|Float} dy second vertical coordinates point after x
     */
	shadowGround(x = this.startPos_x + 4, y = this.startPos_y + 4, dx = this.baseWidth - 8, dy = this.baseHeight - 8) {
		this.dropShadow()
		this.canv.addRect(x, y, dx, dy) // (x, y, x2, y2)   
	}


	/**
     *  Default card base
     *  @param {Integer|Float} x horizontal coordinates
     *  @param {Integer|Float} y vertical coordinates
     *  @param {Integer|Float} dx second horizontal coordinates point after x
     *  @param {Integer|Float} dy second vertical coordinates point after x
     */
	drawCardBase(x, y, dx, dy) {
		const { palette } = this.stacks
		this.canv.createBeveledClip(x, y, dx, dy, 7)
		this.canv.setColor(palette.nightmode)
		this.canv.addRect(x, y, dx, dy)

	}

	async makeCanvasIndividual(index) {
		const { loadAsset } = this.stacks
		
		this.canv = new Canvas(this.canvas_x, this.canvas_y)
		//  Set checkpoint before rendering image
		this.canv.save()
		if (this.container.type[index] == undefined) {
			//  Add base shadow
			this.shadowGround()
			this.removeShadowLayer()
			//  Load item asset
			this.canv.addImage(await loadAsset(`plaincard`), this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight, this.baseHeight)
			//  Render
			return this.canv.toBuffer()
		}
		if (this.container.type[index].toLowerCase() === `card`) {
			//  Add base shadow
			this.shadowGround()
			this.removeShadowLayer()
			//  Load item asset
			this.canv.addImage(await loadAsset(this.container.alias[index]), this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight, this.baseHeight)
			//  Render
			return this.canv.toBuffer()
		}
	}
	async create() {
		var strips = []
		this.canvas_x = 200
		this.canvas_y = 240
		this.amount > 5 && this.amount < 10 ? this.amount += 10 - this.amount : this.amount
		this.amount > 10 && this.amount < 15 ? this.amount += 15 - this.amount : this.amount
		for (var i = 0; i < this.amount; i++) {
			strips.push(await this.makeCanvasIndividual(i))
		}
		let width = this.canvas_x
		let height = this.canvas_y

		let x = this.startPos_x
		let originalX = this.startPos_x
		let y = this.startPos_y
		let originalY = this.startPos_y
		let baseWidth = this.baseWidth
		let baseHeight = this.baseHeight
		let mergerWidth = this.amount > 5 ? width * 5 - ((30 * 7) + (x)) : width * this.amount - ((30 * this.amount) + (this.amount == 1 ? 0 : x))
		let mergerHeight = this.amount > 5 ? this.amount > 10 ? this.canvas_y * 3 - (originalY*5) : this.canvas_y * 2 - this.startPos_y : this.canvas_y

		let canv = new Canvas(mergerWidth, mergerHeight)

		strips.forEach((element, index) => {
			if (index == 5) y = (-1*(originalY * 2)) + height
			if (index == 10) y = (-1*(originalY * 5)) + height * 2
			if (index == 5 || index == 10) x = originalX
			canv.addImage(element, x, y, baseWidth, baseHeight, baseHeight)
			canv.save()
			x += (baseWidth-25)
		})
		return canv.toBuffer()
	}

	/**
     *  Initializer
     */
	get render() {
		let pages = []
		for (let index = 0; index < this.amountofpages; index++) {
			pages.push(this.create())
		}
		return pages
	}
}

module.exports = canvasGUI