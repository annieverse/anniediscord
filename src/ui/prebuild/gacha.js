const Canvas = require(`../setup`)
const palette = require(`../colors/default`)
const theme = require(`../colors/themes`)
const loadAsset = require(`../../utils/loadAsset`)
const {loadImage} = require(`canvas-constructor/cairo`)

class UI {
	/**
	 * Gacha UI Builder.
	 * to access the buffer, please call `.png()` after running `this.build()`
	 * @return {Canvas}
	 */
	constructor(container, drawCount=1, user){
		this.drawCount = drawCount
		this.canvas_x = 210
		this.canvas_y = 265
		this.startPos_x = 15
		this.startPos_y = 15
		this.baseWidth = this.canvas_x - 40
		this.baseHeight = this.canvas_y - 50
		this.container = container
		this.canv = null
        this.user = user
		this.indexrow = {
			"top": [0, 1, 2, 3, 4],
			"bottom": [5, 6, 7, 8, 9],
		}
	}


	async build() {
		return this.drawCount < 10 ? await this.singleRoll() : await this.multiRoll()
	}

	/**
     *  Handling single-roll type of interface
     */
	async singleRoll() {
		this.canvas_x = 200
		this.canvas_y = 240
		const item = this.container[0]
		//  Initialize new canvas
		this.canv = new Canvas(this.canvas_x, this.canvas_y)
		//  Init save points
		this.setSavepoints(1)

		if (item.type_name === `Cards`) {
			//  Add base shadow
			this.shadowGround()
			this.removeShadowLayer()
			//  Load item asset
			this.canv.printImage(await loadImage(await loadAsset(item.alias)), this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight)
		} else {
			//   Add base shape
			this.drawCardBase(this.startPos_x, this.startPos_y, this.baseWidth, this.baseHeight)
			//  Load item assets
			await this.itemVisual(55, 50, 100, 100)
			await this.itemText(100, 170)
		}      

		//  Add flare overlay for item with rarity above 3
		if (item.rarity_level > 3) this.canv.printImage(await loadImage(await loadAsset(`rarityflare_micro_${item.rarity_level}`)), 0, 0, this.canvas_x, this.canvas_y)
		return this.canv.png()
	}

	/**
     *  Handling multi-roll type of interface
     */
	async multiRoll() {
		this.canvas_x = 940
		this.canvas_y = 500
		//  Initialize new canvas
		this.canv = new Canvas(this.canvas_x, this.canvas_y)
		//  Init save points
		this.setSavepoints(20)
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
				const item = (prop) => this.container[currentIndex][prop]
				//  Setup new restore and color if current iteration is not an init.
				if (currentIndex > 0) this.canv.restore()
				if (i > 0) this.canv.setColor(palette.darkmatte)
				//  Render without base if its a card item
				if (item(`type_name`) === `Cards`) {
					this.canv.printImage(await loadImage(await loadAsset(item(`alias`))), dynamicX-2, set_y-4, card_dx+5, card_dy+10)
					continue
				}
				//  Draw card base
				this.drawCardBase(dynamicX, set_y, card_dx, card_dy)
				//  Adjusting item graphic
				await this.itemVisual(card2card_distancex(i) + 38, set_y + 35, 100, 100, currentIndex)
				//  Adjusting text
				this.itemText(card2card_distancex(i) + 85, set_y + 150, currentIndex)
			}
		}

		await row(`top`)
		await row(`bottom`)

		this.canv.restore()
		//  Add flare overlay for item with rarity above 3
		const rareRarities = this.container.filter(item => item.rarity_level > 3).map(item => item.rarity_level)
		const highestRarityInPool = Math.max.apply(Math, rareRarities)
		if (highestRarityInPool > 3) this.canv.printImage(await loadImage(await loadAsset(`rarityflare_${highestRarityInPool}`)), 0, 0, this.canvas_x, this.canvas_y)
		return this.canv.png()
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
	async itemVisual(x, y, dx, dy, index = 0) {
		this.canv.printImage(await loadImage(await loadAsset(this.container[index].alias)), x, y, dx, dy)
	}

	/**
     * Handles item's descriptive text
     * @param {number} x horizontal coordinates
     * @param {number} y vertical coordinates
     * @param {number} [index=0] current index position of item's object
     * @returns {void}
     */
	itemText(x, y, index = 0) {
		const item = this.container[index]
		//  Name
		this.canv.setColor(theme[this.user.usedTheme.alias].text)
		this.canv.setTextAlign(`center`)
		this.canv.setTextFont(`9pt Roboto`) 
		this.canv.printText(`${item.quantity}x ${item.name}`, x, y)
		//  Rarity
		this.canv.setTextFont(`9pt Sans`)
		this.canv.printText(`★`.repeat(this.container[index].rarity_level), x, y + 15)
	}

	/**
     *  Render drop shadow
     *  @param {HexColor} color defining shadow color. Default is recommended.
     */
	dropShadow(color = palette.darkmatte) {
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
		this.canv.printRectangle(x, y, dx, dy) // (x, y, x2, y2)   
	}

	/**
     *  Default card base
     *  @param {Integer|Float} x horizontal coordinates
     *  @param {Integer|Float} y vertical coordinates
     *  @param {Integer|Float} dx second horizontal coordinates point after x
     *  @param {Integer|Float} dy second vertical coordinates point after x
     */
	drawCardBase(x, y, dx, dy) {
		this.canv.createRoundedClip(x, y, dx, dy, 7)
		this.canv.setColor(theme[this.user.usedTheme.alias].main)
		this.canv.printRectangle(x, y, dx, dy)

	}

	/**
	 * Applying save points to current canvas instance
	 * param {number} [times=0] amount of savepoints
	 * returns {void}
	 */
	setSavepoints (times = 0) {
		for(let i = 0; i < times; i++) {
			this.canv.save()
		}
	}  
}

module.exports = UI
