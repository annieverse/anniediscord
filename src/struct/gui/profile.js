const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)
const palette = require(`../../ui/colors/default`)
const Theme = require(`../../ui/colors/themes`)

Canvas.registerFont(resolve(join(__dirname, `../../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-thin.ttf`)), `RobotoThin`)

async function profile(stacks, member, cover = null, sticker = null) {
	const { commanifier, formatString, loadAsset, meta: {data, author} } = stacks
	const rank = stacks.meta.data.rank

	const user = {
		id: author.id,
		cur: data.currentexp,
		max: data.maxexp,
		crv: data.nextexpcurve,
		lvl: data.level,
		ac: data.artcoins,
		rep: data.reputations,
		des: data.description,
		ui: data.interfacemode,
		prt: data.partner,
		rtg: data.rating,
		likecount: data.liked_counts,
		cov: cover == null ? data.cover : cover,
		stic: sticker == null ? data.sticker == ` ` ? null : data.sticker : sticker,
		log: data.last_login,
		theme: Theme[data.interfacemode]
	}

	let canvas_x = 320//300
	let canvas_y = 420//400
	let startPos_x = 10
	let startPos_y = 10
	let baseWidth = canvas_x - 20
	let baseHeight = canvas_y - 20

	const avatar = await stacks.avatar(member.id, true)
	const badgesdata = await data.badges
	const isVIP = member.roles.has(`585550404197285889`)

	//  Remove userid from badges object.
	delete badgesdata.userId

	const key = Object.values(badgesdata).filter(x => x)

	let canv = new Canvas(canvas_x, canvas_y) // x y

	/*
       x = starting point from x axis (horizontal)
       y = starting point from y axis (vertical)
       x2 = second point from (x)
       y2 = second point from (y)
    */

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
	 *    PROFILE STICKER
	 * 	  DISABLED UNTIL NEXT UPDATE (01/15/20)
	 */
	if (user.stic) {
		let stickerIsThemeSpecific = await data.stickerTheme(user.stic)
		stickerIsThemeSpecific ? canv.addImage(await loadAsset(`sticker_${user.stic}_${user.theme.inverseThemeName}`), startPos_x, startPos_y + 194, baseWidth, 206) :
			canv.addImage(await loadAsset(`sticker_${user.stic}`), startPos_x, startPos_y + 194, baseWidth, 206) // STICKER BG
	}

	/**
	 *    PROFILE HEADER COVER
	 */

	canv.setColor(rank.color)
		.addRect(startPos_x, startPos_y, baseWidth, 194)
		.addImage(await loadAsset(user.cov?user.cov:`defaultcover1`), startPos_x, startPos_y, baseWidth, 194) // COVER HEADER

	/**
	 *    USER AVATAR
	 */
	canv.setColor(isVIP ? palette.yellow : user.theme.main)
		.addCircle(startPos_x + 70, 200, 52) 
		.addRoundImage(avatar, startPos_x + 20, 150, 100, 100, 50)

	/**
	 *    BADGES COLLECTION
	 */
	const symetric_xy = 18
	const diameter = Math.round(symetric_xy / 2)
	const y_badge = 208
	await setBadge(symetric_xy, diameter, y_badge)

	//we can fit 8 badges; if user has more display a plus or something
	async function setBadge(xy, diameter, pos_y) {
		for (var i=0; i<=Math.min(key.length, 6); i++) {
			canv.addImage(await loadAsset(key[i]), startPos_x + 128 + i*20, pos_y, xy, xy, diameter)
		}
		if (key.length == 7) {
			canv.addImage(await loadAsset(key[i]), startPos_x + 128 + 140, pos_y, xy, xy, diameter)
		} else if (key.length > 7) {
			canv.addImage(await loadAsset(`plus`), startPos_x + 128 + 140, pos_y, xy, xy, diameter)
		}
	}


	const resizeLongNickname = (name = ``) => {
		return name.length <= 12 ? `14pt` : name.length <= 17 ? `11pt` : `9pt`
	}


	const titlePicker = (memberObject = {}) => {
		return memberObject.roles.find(r => r.name === `༶•  Grand Master`) ? `G R A N D  M A S T E R` :
		memberObject.roles.find(r => r.name === `༶•  Art Mentor`) ? `A R T  M E N T O R` :
		memberObject.roles.find(r => r.name === `Digital ☆`) ? `D I G I T A L   A R T I S T` :
		memberObject.roles.find(r => r.name === `Traditional ☆`) ? `T R A D I T I O N A L  A R T I S T` :
		memberObject.roles.find(r => r.name === `Mixed ☆`) ? `G E N E R A L  A R T I S T` :
				`A R T  A P P R E C I A T O R`
	}


	/**
	 *    USERNAME
	 */
	canv.setColor(user.theme.text)
		.setTextAlign(`center`)
		.setTextFont(`${resizeLongNickname(member.user.username)} RobotoBold`)
		.addText(member.user.username, startPos_x + 70, 272)


	/**
	 * 	TITLE
	 */
	canv.setColor(rank.color)
		.setTextFont(`5pt RobotoBold`)
		.addText(titlePicker(member), startPos_x + 70, 286)

	/**
	 *
	 * 	Add blue verified badge if user has received total 1,000 hearts
	 *
	 */
	const verifiedStartingPoint = canv.measureText(member.user.username).width * 1.3 + 2
	if (user.likecount >= 1000) {
		canv.addImage(await loadAsset(`verified_badge`), startPos_x + 70 + verifiedStartingPoint, 256, 16, 16)
	}

	/**
	 *    RANK TITLE
	 */
	canv.setColor(rank.color)
		.createBeveledClip(startPos_x + 150, startPos_y + 250, 130, 20, 20)
		.addRect(startPos_x + 150, startPos_y + 250, 130, 20)
		.setColor(palette.white)
		.setTextFont(`8pt RobotoBold`) // role window - role name
		.addText(rank.name, startPos_x + 215, startPos_y + 264)
		.restore()

	/**
	 *    PROFILE DESCRIPTION
	 */
	canv.setColor(user.theme.text)
		.setTextAlign(`left`)
		.setTextFont(`8pt Roboto`)
	if (user.des.length > 0 && user.des.length <= 51) {
		canv.addText(formatString(user.des, 1).first, 40, 307)
			.addText(formatString(user.des, 1).second, 40, 320)
	} else if (user.des.length > 51 && user.des.length <= 102) {
		canv.addText(formatString(user.des, 2).first, 40, 307)
			.addText(formatString(user.des, 2).second, 40, 320)
			.addText(formatString(user.des, 2).third, 40, 333)
	} else if (user.des.length > 102 && user.des.length <= 154) {
		canv.addText(formatString(user.des, 3).first, 40, 307)
			.addText(formatString(user.des, 3).second, 40, 320)
			.addText(formatString(user.des, 3).third, 40, 333)
			.addText(formatString(user.des, 3).fourth, 40, 346)
	}
	/**
	 *    THREE BOXES
	 *    HEART, LVL, REP
	 *
	 */
	canv.setTextAlign(`center`)
		.setColor(rank.color)
		.setTextFont(`20pt RobotoMedium`)
		.addText(commanifier(user.likecount), 70, 370) // left point // rank
		.addText(user.lvl, 160, 370) // middle point // level
		.addText(commanifier(user.rep), 250, 370) // right point // AC

		.setColor(user.theme.text)
		.setTextFont(`8pt Whitney`)
		.addText(`HEARTS`, 70, 390) // left point
		.addText(`LEVEL`, 160, 390) // middle point
		.addText(`FAME`, 250, 390) // right point

	return canv.toBuffer()


}

module.exports = profile