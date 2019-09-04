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
async function visual_interface(itemsdata) {
	const configProfile = new profileManager()
	let { filter_alias_res, filter_rarity_res } = itemsdata


	let canvas_x = 580
	let canvas_y = 250
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
			.setColor(palette.nightmode)
			.addRect(startPos_x, startPos_y, canvas_x, canvas_y)
		//.addImage(avatar, startPos_x-100, startPos_y, 400, 164 * (400/164), 250)
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
        Allows each item to be stored on its own grid.
        @grid       
    */
	async function grid(x, y, dx, dy, collimit) {
		let i, curindex, temporary_y


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
		const blankgrid = () => {
			canv.setColor(palette.deepnight)
			for (i = 0; i < colbreak[0]; i++) {
				canv.addRect(x + (dx * i) + (5 * i), y, dx, dy)
				canv.addRect(x + (dx * i) + (5 * i), y + (dx + 5), dx, dy)
				canv.addRect(x + (dx * i) + (5 * i), y + ((dx * 2) + 10), dx, dy)
			}
		}



		//  Shows quantities of the item.
		const quantity_grid = () => {
			i = 0, curindex = 0
			for (let key in filter_alias_res) {

				// if iteration hitting a value in columnbreak, reset iteration to zero.
				// so y position can be adjusted based on defined row.
				if (colbreak.includes(i)) i = 0
				let row_pos = curindex < colbreak[0] ? y + 65 : curindex < colbreak[1] ? (y + 65) + (dx + 5) : (y + 65) + ((dx * 2) + 10)
				let col_pos = (x + 65) + ((dx + 5) * i)

				// Stroke
				canv.setTextAlign(`right`)
				canv.setTextFont(`12pt RobotoBold`)
				canv.context.strokeStyle = `black`
				canv.context.lineWidth = 2
				canv.context.strokeText(filter_alias_res[key], col_pos, row_pos)

				//White text layer
				canv.setColor(palette.white)
					.addText(filter_alias_res[key], col_pos, row_pos)

				curindex++
				i++
			}
		}



		// Visualize item
		const icon_grid = async () => {
			i = 0, curindex = 0, temporary_y = y
			for (let key in filter_alias_res) {


				// checkpoints
				canv.save()
				canv.save()



				// if iteration hitting a value in columnbreak, reset iteration to zero.
				// so y position can be adjusted based on defined row.
				if (colbreak.includes(i)) i = 0
				let distancey = curindex < colbreak[0] ? y : curindex < colbreak[1] ? y + (dx + 5) : y + ((dx * 2) + 10)
				let distancex = x + ((dx + 5) * i)
				temporary_y = curindex < colbreak[0] ? y : curindex < colbreak[1] ? y + (dx + 5) : y + ((dx + 5) * 2)




				// temporary object
				const rarity_color = {
					"1": palette.blankgray,
					"2": palette.blankgray,
					"3": palette.blue,
					"4": palette.purple,
					"5": palette.red,
				}


				// icon frame
				canv.setColor(rarity_color[filter_rarity_res[key]])
					.createBeveledClip(x + (dx * i) + (5 * i), temporary_y, dx, dy, 20)
					.addRect(x + (dx * i) + (5 * i), temporary_y, dx, dy)
					.restore()


				// Framehole
					.setColor(palette.deepnight)
					.createBeveledClip((x + 3) + (dx * i) + (5 * i), temporary_y + 3, dx - 6, dy - 6, 20)
					.addRect((x + 3) + (dx * i) + (5 * i), temporary_y + 3, dx - 6, dy - 6)



				// the actual icon
					.addImage(await load_asset(key), distancex, distancey, 70, 70, 35)
					.restore()
				curindex++
				i++
			}
		}


		// render each parts.
		card_base()
		await blankgrid()
		await icon_grid()
		await quantity_grid()

	}



	await grid(startPos_x + 20, startPos_y + 5, 70, 70, 7)
	return canv.toBuffer()
}


module.exports = visual_interface