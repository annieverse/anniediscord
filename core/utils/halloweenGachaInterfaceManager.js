const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)


/**
 *  Handles canvas-powered graphic result from gacha roll
 *  @param {Object} Stacks de'facto parameter
 *  @param {Object} container An object of parsed roll result.
 */
class halloweenGachaGUI {
	constructor(Stacks, container){
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
		const { relabel, loadAsset } = this.stacks
		this.canv.addImage(await loadAsset(relabel(this.container.alias[index])), x, y, dx, dy, dm)
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
	shadowGround(x = this.startPos_x+4, y = this.startPos_y+4, dx = this.baseWidth-8, dy = this.baseHeight-8) {
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


	/**
     *  Handling single-roll type of interface
     */
	async singleRoll() {
		const { loadAsset, relabel } = this.stacks

		this.canvas_x = 200
		this.canvas_y = 240

		//  Initialize new canvas
		this.canv = new Canvas(this.canvas_x, this.canvas_y)

		//  Set checkpoint before rendering image
		this.canv.save()
        
		if (this.container.type[0] === `card`) {
			//  Add base shadow
			this.shadowGround()
			this.removeShadowLayer()
			//  Load item asset
			this.canv.addImage(await loadAsset(relabel(this.container.alias[0])), this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight, this.baseHeight)
			//  Render
			return this.canv.toBuffer()
		} else {
			//   Add base shape
			this.drawCardBase(this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight)
			//  Load item assets
			await this.itemVisual(55, 50, 100, 100, 50)
			await this.itemText(100, 170)
			//  Render
			return this.canv.toBuffer()
		}      
	}


	/**
     *  Handling multi-roll type of interface
     */
	async multiRoll() {
		const { palette, loadAsset, relabel } = this.stacks

		this.canvas_x = 940
		this.canvas_y = 500
        
		//  Initialize new canvas
		this.canv = new Canvas(this.canvas_x, this.canvas_y)

		//  Add save points to assist .restore() mechanism
		const setSavepoints = async (times = 0) => {
			for(let i = 0; i < times; i++) {
				this.canv.save()
			}
		}
        
		//  Init save points
		await setSavepoints(20)

		//  Handling per row rendering (top/bottom)
		const row = async (opt) => {
			let card_dx = 170
			let card_dy = 210

			//  Automatically calculates X between cards based on index.
			let card2card_distancex = (times) => this.startPos_x + ((card_dx * times) + (10 * times))
			//  Automatically set Y coordinate based on row type
			let set_y = opt === `top` ? this.startPos_y : this.startPos_y + (card_dy + 10)

			for (let i = 0; i < 5; i++) {
				const currentIndex = this.indexrow[opt][i]
				const dynamicX = i < 1 ? this.startPos_x : card2card_distancex(i)
				const item = (prop) => this.container[prop][currentIndex]
                
				//  Setup new restore and color if current iteration is not an init.
				if (currentIndex > 0) this.canv.restore()
				if (i > 0) this.canv.setColor(palette.darkmatte)
                
				//  Render without base if its a card item
				if (item(`type`) === `card`) {
					this.canv.addImage(await loadAsset(relabel(item(`alias`))), dynamicX-2, set_y-4, card_dx+5, card_dy+10, card_dy)
					continue
				}
                
				//  Draw card base
				this.drawCardBase(dynamicX, set_y, card_dx, card_dy)
				//  Adjusting item graphic
				await this.itemVisual(card2card_distancex(i) + 38, set_y + 35, 100, 100, 50, currentIndex)
				//  Adjusting text
				await this.itemText(card2card_distancex(i) + 85, set_y + 150, currentIndex)
			}
		}

		await row(`top`)
		await row(`bottom`)

		return this.canv.toBuffer()
	}


	/**
     *  Initializer
     */
	get render() {
		return this.container.roll_type < 10 ? this.singleRoll() : this.multiRoll()
	}
}

module.exports = halloweenGachaGUI