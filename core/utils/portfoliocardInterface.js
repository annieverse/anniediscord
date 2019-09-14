const { Canvas } = require(`canvas-constructor`) 
const { resolve, join } = require(`path`)
const { get } = require(`snekfetch`)
const Color = require(`color`)
const moment = require(`moment`)
const imageUrlRegex = /\?size=2048$/g
const profileManager = require(`./profileManager`)
const databaseManager = require(`./databaseManager`)
const rankManager = require(`./ranksManager`)
const palette = require(`./colorset`)
const probe = require(`probe-image-size`)
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

async function portfolio(stacks, member) {
	const configProfile = new profileManager()
	const collection = new databaseManager(member.id)
	const configRank = new rankManager(stacks.bot, stacks.message)


	/**
     * id = userid, cur = currentexp, max = maxexp,
     * crv = expcurve, lvl = userlevel, ac = userartcoins,
     * rep = userreputation, des = userdescription, ui = userinterfacemode
     * clr = hex code of user's rank color.
     */
	const userdata = await collection.userMetadata()
	const user = {
		id: userdata.userId,
		cur: userdata.currentexp,
		max: userdata.maxexp,
		crv: userdata.nextexpcurve,
		lvl: userdata.level,
		ac: userdata.artcoins,
		rep: userdata.reputations,
		des: userdata.description,
		ui: userdata.interfacemode,
		prt: userdata.partner,
		rtg: userdata.rating,
		likecount: userdata.liked_counts,
		cov: userdata.cover,
		log: userdata.last_login,
		get clr() {
			return this.ui === `light_profileskin` ? (Color(configRank.ranksCheck(userdata.level).color).desaturate(0.2)).hex() :
				this.ui === `dark_profileskin` ? (Color(configRank.ranksCheck(userdata.level).color).desaturate(0.1)).hex() :
					(Color(configRank.ranksCheck(userdata.level).color).desaturate(0.2)).hex()
		},
	}

	const switchColor = {

		"dark_profileskin": {
			base: palette.nightmode,
			border: palette.deepnight,
			text: palette.white,
			secondaryText: palette.lightgray
		},

		"light_profileskin": {
			base: palette.white,
			border: palette.lightgray,
			text: palette.darkmatte,
			secondaryText: palette.blankgray
		}
	}

	let canvas_x = 320//300
	let canvas_y = 420//400
	let startPos_x = 10
	let startPos_y = 10
	let baseWidth = canvas_x - 20
	let baseHeight = canvas_y - 20

	const {
		body: avatar
	} = await get(member.user.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
	const usercolor = configProfile.checkInterface(user.ui, member)

	let canv = new Canvas(canvas_x, canvas_y) // x y

	/**
	 *    CARD BASE
	 */
	canv = canv.setShadowColor(`rgba(28, 28, 28, 1)`)
		.setShadowOffsetY(5)
		.setShadowBlur(10)
		.setColor(switchColor[usercolor].base)
		.addRect(startPos_x + 7, startPos_y + 7, baseWidth - 14, baseHeight - 14) // (x, y, x2, y2)
		.createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
		.addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
		.setShadowBlur(0)
		.setShadowOffsetY(0)
		.save()

	/**
	 *    USER
	 *    AVATAR
	 */
	canv.addRoundImage(avatar, 15, 15, 30, 30, 15)

	/**
	 *    TITLE BAR
	 */
		.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`left`)
		.setTextFont(`11pt RobotoBold`)
		.addText(`Recent Post`, 55, 35)
		.setColor(switchColor[usercolor].border)
		.addRect(startPos_x, 48, baseWidth, 2) // bottom border


	async function gridImage(posx, posy, dx, dy) {
		var res = await sql.all(`SELECT * FROM userartworks WHERE userId = ${member.id} ORDER BY timestamp DESC`)
		async function aspectRatio(src) {
			try {
				var proberes = await probe(src)
				//if (err) throw err
				let width = proberes.width
				let height = proberes.height
				let {
					body: photo
				} = await get(src)
				if (width > height) {
					canv.addImage(photo, posx - ((width * dy / height) - dx)/2, posy, width * dy / height, dy,1)
				} else {
					canv.addImage(photo, posx, posy - ((height * dx / width) - dy)/2, dx, height * dx / width,1)
				}
			} catch (e) {
				//console.log(err);
				sql.run(`DELETE FROM userartworks WHERE url = "${src}"`)
			}
		}

		async function nullCollection() {
			canv.addText(`No artworks yet!`, (baseWidth / 2) + 10, 100)
				.createBeveledClip(startPos_x, 110, baseWidth, baseWidth, 25)
				.setColor(switchColor[usercolor].border)
				.addRect(posx, posy, dx, dy)
				.addImage(await configProfile.getAsset(`anniewot`), 350, 125, 80, 80, 40)
		}

		canv.setColor(switchColor[usercolor].secondaryText)
			.setTextAlign(`right`)
			.setTextFont(`11pt Whitney`)
			.addText(moment(res[0].timestamp).fromNow(), baseWidth - 5, 35)
			.setTextAlign(`center`)
			.setTextFont(`10pt Roboto`)
		if (res.length < 1) {
			await nullCollection()
		} else {
            var description = `My newest artwork!`
				if (res[0].description) {
					if (res[0].description.length>56) {
						description = res[0].description.substring(0, 56)+`...`
					} else {
						description = res[0].description
					}
				}
            canv.addText(description, (baseWidth / 2) + 10, 100)
			    .createBeveledClip(startPos_x, 110, baseWidth, baseWidth, 25)
				.setColor(switchColor[usercolor].border)
				.addRect(posx, posy, dx, dy)
			await aspectRatio(res[0].url)
		}
	}

	await gridImage(startPos_x, 110, baseWidth, baseWidth)

	return canv.toBuffer()

}

module.exports = portfolio