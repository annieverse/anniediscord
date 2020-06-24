const palette = require(`../colors/default`)
const Color = require(`color`)
const ThemePresets = require(`../colors/themes`)
const loadAsset = require(`../../utils/loadAsset`)
const Canvas = require(`../setup`)

/**
 * 	Displaying user inventory.
 * 	Powered by Canvas
 * 	@param {Object|InventoryCollection} container preferably to use returned data from .inventory()
 *  @param {String} usertheme refer to user.interfacemode
 * 	@Render
 */
const InventoryInterface = async (container, usertheme) => {

	let canvas_x = 580
	let canvas_y = 478
	let startPos_x = 10
	let startPos_y = 15
	let canv = new Canvas(canvas_x, canvas_y) // x y
	let theme = ThemePresets[usertheme]

	/**
	 * 	Rendering base layer of the card
	 * 	@baseLayer
	 */
	const baseLayer = () => {
		canv.setShadowColor(`rgba(28, 28, 28, 1)`)
			.setShadowOffsetY(7)
			.setShadowBlur(15)
			.setColor(palette.darkmatte)
			.addRect(startPos_x + 15, startPos_y + 10, canvas_x - 45, canvas_y - 45)
			.createBeveledClip(startPos_x, startPos_y, canvas_x - 20, canvas_y - 20, 15)
			.setShadowBlur(0)
			.setShadowOffsetY(0)
			.setColor(theme.main)
			.addRect(startPos_x, startPos_y, canvas_x, canvas_y)
			.addRect(startPos_x + 150, startPos_y, canvas_x, canvas_y)
			.restore()
	}

	/**
	 * Scalable grid-system
	 * Allows each item to be stored into its own grid.
	 * @param {Number|Position|xAxis} x starter horizontal point from topleft.
	 * @param {Number|Position|yAxis} y starter vertical point from topleft.
	 * @param {Number|Diameter} dx horizontal distance/diameter from start to end point.
	 * @param {Number|Diameter} dx vertical distance/diameter from start to end point.
	 * @param {Number} colimit define max column size (horizontal grid)
	 * @param {Number} rowlimit define max row size (vertical grid)
     * @grid 
	 */
	const grid = async (x, y, dx, dy, colimit, rowlimit) => {

		//  Define value for each column break.
		const splittingColumns = () => {
			let arr = []
			for (let i = 0; i < rowlimit; i++) {
				arr.push(colimit * i)
			}
			return arr
		}


		//	Specify starter index for each row
		const columnBreak = splittingColumns()


		//	Render item rarity frame
		const renderFrame = (frameColor, pos=[]) => {
			const frameHole = () => {
				pos[0] = pos[0] + 1
				pos[1] = pos[1] + 1
				pos[2] = pos[2] - 2
				pos[3] = pos[3] - 2

				canv.save()
				canv.createBeveledClip(...pos, 15)
				canv.setColor(Color(frameColor)[theme.iconBackground](theme.iconBackgroundOpacity))
				canv.addRect(...pos)
				canv.restore()
			}

			canv.save()
			canv.createBeveledClip(...pos, 15)
			canv.setColor(frameColor)
			canv.addRect(...pos)
			frameHole()
			canv.restore()
		}


		/**
		 * Use special number prefix if quantity is exceeding 1 bil.
		 * @param {Number} qty number to be checked with
		 * @quantityLimitCheck
		 */
		const quantityLimitCheck = (qty=0) => qty > 999999999 ? `+999999999` : qty


		/**
		 * Rendering item quantity
		 * @param {Number} qty quantity to be displayed
		 * @param {ArrayOfPosition} pos Preferably to use the same grid array across function
		 * @renderQuantity
		 */
		const renderQuantity = (qty=0, pos=[]) => {

			const quantity = quantityLimitCheck(qty)

			//	Mutating default grid dimension for item quantity (bottomright)
			pos[0] = (pos[0] + dx) - 6
			pos[1] = (pos[1] + dy) - 6


			canv.save()
			canv.setTextAlign(`right`)
			canv.setTextFont(`10pt RobotoBold`)
			canv.context.strokeStyle = theme.secondary
			canv.context.lineWidth = 2
			canv.context.strokeText(quantity, ...pos)
			canv.setColor(theme.text)
			canv.addText(quantity, ...pos)
			canv.restore()
		}


		/**
		 * Rendering item icon
		 * @param {String|ID} id id of the asset (item_alias)
		 * @param {ArrayOfPosition} pos Preferably to use the same grid array across function
		 * @renderIcon
		 */
		const renderIcon = async (id, pos=[]) => canv.addImage(await loadAsset(id), ...pos, dx / 2)


		/**
		 * Get absolute dimension for each item grid. Returns an array
		 * @param {Number} index current iteration position
		 * @param {Number} rowNth current row position in the inventory. Index-ordering(0)
		 * @aspectRatio
		 */
		const aspectRatio = ({index=0,rowNth=0}) => {
			const yAxis = rowNth < 1 ? y : y + ((dx+5) * rowNth)
			const xAxis = x + (dx * index) + (5 * index)
			return [xAxis, yAxis, dx, dy]
		}


		/**
		 * Check if item available in the pool. Purposely to avoid optional chaining in an object.
		 * @param {Number} index current iteration position
		 * @param {Number} rowNth current row position in the inventory. Index-ordering(0)
		 * @aspectRatio
		 */
		const itemRenderable = ({index=0, rowNth=0}) => container[index + columnBreak[rowNth]] ? true : false


		//	Default color for blank grid
		canv.setColor(theme.secondary)
		//	Recursively rendering from left to rightmost column
		for (let i = 0; i < colimit; i++) {

			//	Row 0 ( 0 - 7 grid )
			const gridZero = aspectRatio({index: i, rowNth: 0})
			canv.addRect(...gridZero)
			if (itemRenderable({index: i, rowNth: 0})) {
				renderFrame(container[i + columnBreak[0]].rarity_color, gridZero)
				await renderIcon(container[i + columnBreak[0]].alias, gridZero)
				renderQuantity(container[i + columnBreak[0]].quantity, gridZero)

			}

			//	Row 1 ( 7 - 14 grid )
			const gridOne = aspectRatio({index: i, rowNth: 1})
			canv.addRect(...gridOne)
			if (itemRenderable({index: i, rowNth: 1})) {
				renderFrame(container[i + columnBreak[1]].rarity_color, gridOne)
				await renderIcon(container[i + columnBreak[1]].alias, gridOne)
				renderQuantity(container[i + columnBreak[1]].quantity, gridOne)
			}
			
			//	Row 2 ( 14 - 21 grid )
			const gridTwo = aspectRatio({index: i, rowNth: 2})
			canv.addRect(...gridTwo)
			if (itemRenderable({index: i, rowNth: 2})) {
				renderFrame(container[i + columnBreak[2]].rarity_color, gridTwo)
				await renderIcon(container[i + columnBreak[2]].alias, gridTwo)
				renderQuantity(container[i + columnBreak[2]].quantity, gridTwo)
		   }

			//	Row 3 ( 21 - 28 grid )
			const gridThree = aspectRatio({index: i, rowNth: 3})
			canv.addRect(...gridThree)
			if (itemRenderable({index: i, rowNth: 3})) {
				renderFrame(container[i + columnBreak[3]].rarity_color, gridThree)
				await renderIcon(container[i + columnBreak[3]].alias, gridThree)
				renderQuantity(container[i + columnBreak[3]].quantity, gridThree)
		   }
			
			//	Row 4 ( 28 - 35 grid)
			const gridFour = aspectRatio({index: i, rowNth: 4})
			canv.addRect(...gridFour)
			if (itemRenderable({index: i, rowNth: 4})) {
				renderFrame(container[i + columnBreak[4]].rarity_color, gridFour)
				await renderIcon(container[i + columnBreak[4]].alias, gridFour)
				renderQuantity(container[i + columnBreak[4]].quantity, gridFour)
		   }

			//	Row 5 ( 35 - 42 grid )
			const gridFive = aspectRatio({index: i, rowNth: 5})
			canv.addRect(...gridFive)			
			if (itemRenderable({index: i, rowNth: 5})) {
				renderFrame(container[i + columnBreak[5]].rarity_color, gridFive)
				await renderIcon(container[i + columnBreak[5]].alias, gridFive)
				renderQuantity(container[i + columnBreak[5]].quantity, gridFive)
		   }
		}
	}

	baseLayer()
	await grid(startPos_x + 20, startPos_y + 5, 70, 70, 7, 6)
	return canv.toBuffer()
}


module.exports = InventoryInterface