const { Canvas } = require(`canvas-constructor`) 
const { resolve, join } = require(`path`)
const profileManager = require(`./profileManager`)
const palette = require(`./colorset`)
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)

/**
    Inventory graphic built with canvas.
    @visual_interface
*/
async function visual_interface(container) {
	const configProfile = new profileManager()


	let canvas_x = 580
	let canvas_y = 478
	let startPos_x = 10
	let startPos_y = 15


	let canv = new Canvas(canvas_x, canvas_y) // x y




	// Render the base for card.
	function card_base() {
		canv.setShadowColor(`rgba(28, 28, 28, 1)`)
			.setShadowOffsetY(7)
			.setShadowBlur(15)
			.setColor(palette.darkmatte)

			.addRect(startPos_x + 15, startPos_y + 10, canvas_x - 45, canvas_y - 45)
			.createBeveledClip(startPos_x, startPos_y, canvas_x - 20, canvas_y - 20, 15)
			.setShadowBlur(0)
			.setShadowOffsetY(0)
			.setColor(palette.white)
			.addRect(startPos_x, startPos_y, canvas_x, canvas_y)
			.addRect(startPos_x + 150, startPos_y, canvas_x, canvas_y)
			.restore()
	}


	// Load the item asset.
	async function load_asset(id) {
		try {
			return configProfile.getAsset(id)
		} catch (e) {
			return
		}
	}


	/**
        Scalable grid-system
        Allows each item to be stored into its own grid.
        @grid       
    */
	async function grid(x, y, dx, dy, collimit) {
		let i

		//  Define value for each column break.
		const colbreak_value = () => {
			let arr = []
			for (i = 1; i < 4; i++) {
				arr.push(collimit * i)
			}
			return arr
		}
		
		
		let colbreak = colbreak_value()

		//  Blank rectangle behind the item.
		canv.setColor(palette.lightgray)
		for (i = 0; i < colbreak[0]; i++) {
			canv.addRect(x + (dx * i) + (5 * i), y, dx, dy)
			canv.addRect(x + (dx * i) + (5 * i), y + (dx + 5), dx, dy)
			canv.addRect(x + (dx * i) + (5 * i), y + ((dx * 2) + 10), dx, dy)
			canv.addRect(x + (dx * i) + (5 * i), y + ((dx * 3) + 15), dx, dy)
			canv.addRect(x + (dx * i) + (5 * i), y + ((dx * 4) + 20), dx, dy)
			canv.addRect(x + (dx * i) + (5 * i), y + ((dx * 5) + 25), dx, dy)
		}


	}





	card_base()
	await grid(startPos_x + 20, startPos_y + 5, 70, 70, 7)
	return canv.toBuffer()
}


module.exports = visual_interface