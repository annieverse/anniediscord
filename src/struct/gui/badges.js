const { Canvas } = require(`canvas-constructor`) 
const { resolve, join } = require(`path`)
const { get } = require(`node-fetch`)
const imageUrlRegex = /\?size=2048$/g
const Theme = require(`../../ui/colors/themes`)

Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-black.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-thin.ttf`)), `RobotoThin`)

async function badge(stacks, member) {
	const { loadAsset, meta: {data} } = stacks


	/**
     * id = userid, cur = currentexp, max = maxexp,
     * crv = expcurve, lvl = userlevel, ac = userartcoins,
     * rep = userreputation, des = userdescription, ui = userinterfacemode
     * clr = hex code of user's rank color.
     */
	const userdata = data
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
		theme: Theme[userdata.interfacemode]
	}

	let canvas_x = 320//300
	let canvas_y = 420//400
	let startPos_x = 10
	let startPos_y = 10
	let baseWidth = canvas_x - 20
	let baseHeight = canvas_y - 20

	const {
		body: avatar
	} = await get(member.user.displayAvatarURL().replace(imageUrlRegex, `?size=512`))
	const badgesdata = data.badges

	delete badgesdata.userId

	const key = Object.values(badgesdata).filter(x => x)

	let canv = new Canvas(canvas_x, canvas_y) // x y

	/**
	 *    CARD BASE
	 */
	canv = canv.setShadowColor(`rgba(28, 28, 28, 1)`)
		.setShadowOffsetY(5)
		.setShadowBlur(10)
		.setColor(user.theme.main)
		.addRect(startPos_x + 7, startPos_y + 7, baseWidth - 14, baseHeight - 14) // (x, y, x2, y2)
		.createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
		.addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
		.setShadowBlur(0)
		.setShadowOffsetY(0)
		.save()

	/**
	 *    USER AVATAR
	 */
	canv.addRoundImage(avatar, 15, 15, 30, 30, 15)

	/**
	 *    TITLE BAR
	 */
		.setColor(user.theme.text)
		.setTextAlign(`left`)
		.setTextFont(`11pt RobotoBold`)
		.addText(`Badges Collection`, 55, 35)
		.setColor(user.theme.separator)
		.addRect(startPos_x, 48, baseWidth, 2) // bottom border

	const symetric_xy = 45
	const diameter = Math.round(symetric_xy / 2)
	const y_badge = 85
	await setBadge(symetric_xy, diameter, y_badge)

	//we can fit 20 badges; if user has more display a plus or something
	async function setBadge(xy, diameter, pos_y) {
		for (var i=0; i<=Math.min(key.length, 18); i++) {
			var j = Math.floor(i/4)
			canv.addImage(await loadAsset(key[i]), startPos_x + 40 + i % 4 *57, pos_y + j*57, xy, xy, diameter)
		}
		if (key.length == 19) {
			canv.addImage(await loadAsset(key[i]), startPos_x + 40 + 3*57, pos_y + 4*57, xy, xy, diameter)
		} else if (key.length > 19) {
			canv.addImage(await loadAsset(`plus`), startPos_x + 40 + 3*57, pos_y + 4*57, xy, xy, diameter)
		}
	}

	return canv.toBuffer()

}

module.exports = badge