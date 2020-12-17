const Color = require(`color`)
const Cards = require(`../components/cards`)
const ThemePresets = require(`../colors/themes`)
const loadAsset = require(`../../utils/loadAsset`)
const {resolveImage} = require(`canvas-constructor`)

class UI {
	/**
	 * Inventory UI Builder.
	 * to access the buffer, please call `.toBuffer()` after running `this.build()`
	 * @param {User} [user={}] parsed user object from `./src/libs/user`
	 * @param {Client} [bot={}] current bot instance
	 * @return {Canvas}
	 */
	constructor(user={}, bot) {
		this.user = user
		this.bot = bot
		this.width = 550
		this.height = 475
		this.theme = ThemePresets[this.user.usedTheme.alias]
	}

	async build() {
		this.scaleYBasedOnContainerSize()
		this.card = await new Cards({
			 width: this.width, 
			 height: this.height,
			 theme: this.user.usedTheme.alias,
			 primaryColor: this.adjustedPrimaryColorContrast(),
			 align: `center` 
		})
		//	Base card
		.createBase({})
		//  Render each items grid
		await this.grid()
		return this.card.ready()
	}

	/**
	 * Allows each item to be stored into its own grid.
	 * @param {number} [itemDiameter=70] asset's dimension for each item.
     * @returns {void}
	 */
	async grid(itemDiameter=70) {

		let x = 15
		let y = 15
		let colimit = 7
		let rowlimit = 6

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

		/**
		 * Render item rarity frame.
		 * @param {string} [frameColor=`#000`] hex color code for the frame.
		 * @param {array} [pos=[]] frame container
		 * @returns {void}
		 */
		const renderFrame = (frameColor=`#000`, pos=[]) => {
			const frameHole = () => {
				pos[0] = pos[0] + 1
				pos[1] = pos[1] + 1
				pos[2] = pos[2] - 2
				pos[3] = pos[3] - 2

				this.card.canv.save()
				this.card.canv.createRoundedClip(...pos, 20)
				this.card.canv.setColor(Color(frameColor)[this.theme.iconBackground](this.theme.iconBackgroundOpacity))
				this.card.canv.printRectangle(...pos)
				this.card.canv.restore()
			}

			this.card.canv.save()
			this.card.canv.createRoundedClip(...pos, 20)
			this.card.canv.setColor(frameColor)
			this.card.canv.printRectangle(...pos)
			frameHole()
			this.card.canv.restore()
		}

		/**
		 * Use special number prefix if quantity is exceeding 1 bil.
		 * @param {number} [qty=0] number to be checked from.
		 * @returns {string|number}
		 */
		const quantityLimitCheck = (qty=0) => qty > 999999999 ? `+999999999` : qty

		/**
		 * Rendering item quantity
		 * @param {Number} [qty=0] quantity to be displayed
		 * @param {array} [pos=[]] item container
		 * @returns {void}
		 */
		const renderQuantity = (qty=0, pos=[]) => {

			const quantity = quantityLimitCheck(qty)
			//	Mutating default grid dimension for item quantity (bottomright)
			pos[0] = (pos[0] + itemDiameter) - 6
			pos[1] = (pos[1] + itemDiameter) - 6

			this.card.canv.save()
			this.card.canv.setTextAlign(`right`)
			this.card.canv.setTextFont(`10pt RobotoBold`)
			this.card.canv.context.strokeStyle = this.theme.secondary
			this.card.canv.context.lineWidth = 2
			this.card.canv.context.strokeText(quantity, ...pos)
			this.card.canv.setColor(this.theme.text)
			this.card.canv.printText(quantity, ...pos)
			this.card.canv.restore()
		}

		/**
		 * Rendering item icon
		 * @param {String|ID} id id of the asset (item_alias)
		 * @param {ArrayOfPosition} pos Preferably to use the same grid array across function
		 * @renderIcon
		 */
		const renderIcon = async (id, pos=[]) => this.card.canv.printImage(await resolveImage(await loadAsset(id)), ...pos)

		/**
		 * Get absolute dimension for each item grid. Returns an array
		 * @param {number} [index=0] current iteration position
		 * @param {number} [rowNth=0] current row position in the inventory. Index-ordering(0)
		 * @returns {array}
		 */
		const aspectRatio = ({index=0,rowNth=0}) => {
			const yAxis = rowNth < 1 ? y : y + ((itemDiameter+5) * rowNth)
			const xAxis = x + (itemDiameter * index) + (5 * index)
			return [xAxis, yAxis, itemDiameter, itemDiameter]
		}

		/**
		 * Check if item available in the pool. Purposely to avoid optional chaining in an object.
		 * @param {number} [index=0] current iteration position
		 * @param {number} [rowNth=0] current row position in the inventory. Index-ordering(0)
		 * @returns {boolean}
		 */
		const itemRenderable = ({index=0, rowNth=0}) => container[index + columnBreak[rowNth]] ? true : false

		const container = this.user.inventory.raw
		//	Default color for blank grid
		this.card.canv.setColor(this.theme.secondary)
		//	Recursively rendering from left to rightmost column
		for (let i = 0; i < colimit; i++) {

			//	Row 0 ( 0 - 7 grid )
			const gridZero = aspectRatio({index: i, rowNth: 0})
			this.card.canv.printRectangle(...gridZero)
			if (itemRenderable({index: i, rowNth: 0})) {
				renderFrame(container[i + columnBreak[0]].rarity_color, gridZero)
				await renderIcon(container[i + columnBreak[0]].alias, gridZero)
				renderQuantity(container[i + columnBreak[0]].quantity, gridZero)

			}

			//	Row 1 ( 7 - 14 grid )
			const gridOne = aspectRatio({index: i, rowNth: 1})
			this.card.canv.printRectangle(...gridOne)
			if (itemRenderable({index: i, rowNth: 1})) {
				renderFrame(container[i + columnBreak[1]].rarity_color, gridOne)
				await renderIcon(container[i + columnBreak[1]].alias, gridOne)
				renderQuantity(container[i + columnBreak[1]].quantity, gridOne)
			}
			
			//	Row 2 ( 14 - 21 grid )
			const gridTwo = aspectRatio({index: i, rowNth: 2})
			this.card.canv.printRectangle(...gridTwo)
			if (itemRenderable({index: i, rowNth: 2})) {
				renderFrame(container[i + columnBreak[2]].rarity_color, gridTwo)
				await renderIcon(container[i + columnBreak[2]].alias, gridTwo)
				renderQuantity(container[i + columnBreak[2]].quantity, gridTwo)
		    }

			//	Row 3 ( 21 - 28 grid )
			const gridThree = aspectRatio({index: i, rowNth: 3})
			this.card.canv.printRectangle(...gridThree)
			if (itemRenderable({index: i, rowNth: 3})) {
				renderFrame(container[i + columnBreak[3]].rarity_color, gridThree)
				await renderIcon(container[i + columnBreak[3]].alias, gridThree)
				renderQuantity(container[i + columnBreak[3]].quantity, gridThree)
		    }
			
			//	Row 4 ( 28 - 35 grid)
			const gridFour = aspectRatio({index: i, rowNth: 4})
			this.card.canv.printRectangle(...gridFour)
			if (itemRenderable({index: i, rowNth: 4})) {
				renderFrame(container[i + columnBreak[4]].rarity_color, gridFour)
				await renderIcon(container[i + columnBreak[4]].alias, gridFour)
				renderQuantity(container[i + columnBreak[4]].quantity, gridFour)
		    }

			//	Row 5 ( 35 - 42 grid )
			const gridFive = aspectRatio({index: i, rowNth: 5})
			this.card.canv.printRectangle(...gridFive)			
			if (itemRenderable({index: i, rowNth: 5})) {
				renderFrame(container[i + columnBreak[5]].rarity_color, gridFive)
				await renderIcon(container[i + columnBreak[5]].alias, gridFive)
				renderQuantity(container[i + columnBreak[5]].quantity, gridFive)
		    }
		}
	}

	/**
	 * Automatically adjust contrast for the primary color, based on what theme currently being used by the user.
	 * @returns {hex}
	 */
	adjustedPrimaryColorContrast() {
		return this.user.usedTheme.alias === `light` ? Color(this.user.rank.color).saturate(0.8).darken(0.4).hex() : this.user.rank.color
	}

	/**
	 * Automatically adjust card's height based on the size of user's inventory.
	 * @returns {void}
	 */
	scaleYBasedOnContainerSize() {
		const size = this.user.inventory.raw.length
		if (size <= 7) return this.height = 100
		if (size <= 14) return this.height = 175
		if (size <= 21) return this.height = 250
		if (size <= 28) return this.height = 325
		if (size <= 35) return this.height = 400
		if (size <= 42) return this.height = 475
		return this.height
	}
}


module.exports = UI