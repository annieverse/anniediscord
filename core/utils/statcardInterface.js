const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)
const { get } = require(`snekfetch`)
const Color = require(`color`)
const imageUrlRegex = /\?size=2048$/g
const moment = require(`moment`)
const profileManager = require(`./profileManager`)
const databaseManager = require(`./databaseManager`)
const rankManager = require(`./ranksManager`)
const formatManager = require(`./formatManager`)
const palette = require(`./colorset`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

async function stat(stacks, member) {
	const {bot} = stacks
	const configProfile = new profileManager()
	const collection = new databaseManager(member.id)
	const configRank = new rankManager(stacks.bot, stacks.message)
	const configFormat = new formatManager(stacks.message)


	/**
     * id = userid, cur = currentexp, max = maxexp,
     * crv = expcurve, lvl = userlevel, ac = userartcoins,
     * rep = userreputation, des = userdescription, ui = userinterfacemode
     * clr = hex code of user`s rank color.
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


	/**
	 * 	Get author last online
	 *  @getLastOnline
	 */
	const getLastOnline = () => bot.users.get(member.id).presence.status != `offline` ? `Currently Active` : user.log ? moment(user.log).fromNow() : `No data retrieved.`



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

	var gradient = canv.createLinearGradient(baseWidth/2, 350, baseWidth/2-10, 0)
	gradient.addColorStop(0, user.clr)
	gradient.addColorStop(1, `transparent`)
	/**
	 *    USER
	 *    AVATAR
	 */
	canv.createBeveledClip(startPos_x, startPos_y-100, baseWidth+100, 360, 100, 1)
		.setColor(user.clr)
		.setGlobalAlpha(0.5)
		.addRect(startPos_x, startPos_y, baseWidth, 260) // (x, y, x2, y2)
		.setGlobalAlpha(0.25)
		.addImage(avatar, startPos_x, startPos_y-10, baseWidth, baseWidth)
		.setGlobalAlpha(1)
		.setColor(gradient)
		.addRect(startPos_x, startPos_y, baseWidth, 260) // (x, y, x2, y2)

		.setColor(switchColor[usercolor].base)
		.setTextAlign(`Left`)
		.setTextFont(`9pt RobotoBold`)
		.addText(`Last online`, startPos_x + 23, 88)

		//	Disabled emoji
		//.setTextFont(`14pt Roboto`)
		//.addText(`🕑`, startPos_x + 87, 85)

		.setTextFont(`20pt RobotoBold`)
		.addText(getLastOnline(), startPos_x + 30, 115)

		.setTextAlign(`end`)
		.setTextFont(`9pt RobotoBold`)
		.addText(`Current experience points`, baseWidth - 13, 180)

		.setTextFont(`24pt RobotoBold`)
		.addText(configFormat.threeDigitsComa(user.cur) + ` EXP`, baseWidth - 13, 210)
		.restore()

		.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`Left`)
		.setTextFont(`9pt RobotoBold`)
		.addText(`Ranking`, startPos_x + 28, 290)

		.setColor(user.clr)
		.setTextFont(`33pt RobotoBold`)
		.addText(configFormat.ordinalSuffix(await collection.ranking + 1), startPos_x + 33, 350)

		.setColor(switchColor[usercolor].secondaryText)
		.setTextFont(`9pt RobotoBold`)
		.addText(`from a total of `+configFormat.threeDigitsComa(bot.users.size)+` members`, startPos_x + 38, 366)


	return canv.toBuffer()

}

module.exports = stat