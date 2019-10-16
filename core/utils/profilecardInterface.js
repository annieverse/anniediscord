const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)
const { get } = require(`snekfetch`)
const Color = require(`color`)
const imageUrlRegex = /\?size=2048$/g
const profileManager = require(`./profileManager`)
const databaseManager = require(`./databaseManager`)
const rankManager = require(`./ranksManager`)
const formatManager = require(`./formatManager`)
const palette = require(`./colorset`)
const { nitro_boost } = require(`./role-list`)

Canvas.registerFont(resolve(join(__dirname, `../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

async function profile(stacks, member) {
	const configProfile = new profileManager()
	const collection = new databaseManager(member.id)
	const configFormat = new formatManager(stacks.message)
	const configRank = new rankManager(stacks.bot, stacks.message)

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
		stic: userdata.sticker,
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
			secondaryText: palette.lightgray,
			sticker: `dark`
		},

		"light_profileskin": {
			base: palette.white,
			border: palette.lightgray,
			text: palette.darkmatte,
			secondaryText: palette.blankgray,
			sticker: `light`
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
	const badgesdata = await collection.badges
	const isVIP = member.roles.has(nitro_boost)

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
		.setColor(switchColor[usercolor].base)
		.addRect(startPos_x + 7, startPos_y + 7, baseWidth - 14, baseHeight - 14) // (x, y, x2, y2)
		.createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
		.addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
		.setShadowBlur(0)
		.setShadowOffsetY(0)
		.save()

	/**
	 *    PROFILE STICKER
	 */
	/*if (user.stic) {
		canv.addImage(await configProfile.getAsset(user.stic+switchColor[usercolor].sticker), startPos_x, startPos_y + 270, baseWidth, 460) // STICKER BG
	}*/
	//canv.addImage(await configProfile.getAsset(`AAU_Profile_Theme_Pumpkin`), startPos_x, startPos_y + 194, baseWidth, 206) // STICKER BG

	/**
	 *    PROFILE HEADER COVER
	 */

	canv.setColor(user.clr)
		.addRect(startPos_x, startPos_y, baseWidth, 194)
		.addImage(await configProfile.getAsset(user.cov?user.cov:`defaultcover1`), startPos_x, startPos_y, baseWidth, 194) // COVER HEADER

	/**
	 *    USER AVATAR
	 */
	canv.setColor(isVIP ? palette.yellow : switchColor[usercolor].base)
		.addCircle(startPos_x + 70, 200, 52) //avatar
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
			canv.addImage(await configProfile.checkBadges(key[i]), startPos_x + 128 + i*20, pos_y, xy, xy, diameter)
		}
		if (key.length == 7) {
			canv.addImage(await configProfile.checkBadges(key[i]), startPos_x + 128 + 140, pos_y, xy, xy, diameter)
		} else if (key.length > 7) {
			canv.addImage(await configProfile.getAsset(`plus`), startPos_x + 128 + 140, pos_y, xy, xy, diameter)
		}
	}

	/**
	 *    USERNAME
	 */
	canv.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`center`)
		if (member.user.username.length <= 10) {
			canv.setTextFont(`14pt RobotoBold`)
		} else if (member.user.username.length <= 20) {
			canv.setTextFont(`12pt RobotoBold`)
		} else {
			canv.setTextFont(`10pt RobotoBold`)
		}
	canv.addText(member.user.username, startPos_x + 70, 272)

		.setColor(isVIP ? palette.yellow : user.clr)
		.setTextFont(`5pt RobotoBold`)
		.addText(
			isVIP ? `D O N A T O R` :
			member.roles.find(r => r.name === `Digital ☆`) ? `D I G I T A L   A R T I S T` :
			member.roles.find(r => r.name === `Traditional ☆`) ? `T R A D I T I O N A L  A R T I S T` :
				member.roles.find(r => r.name === `Mixed ☆`) ? `G E N E R A L  A R T I S T` :
					`A R T  A P P R E C I A T O R`, startPos_x + 70, 286)

	/**
	 *
	 * 	Add blue verified badge if user has received total 1,000 hearts
	 *
	 */
	const verifiedStartingPoint = canv.measureText(member.user.username).width * 1.3 + 2
	if (user.likecount >= 1000) {
		canv.addImage(await configProfile.getAsset(`verified_badge`), startPos_x + 70 + verifiedStartingPoint, 256, 16, 16)
	}

	/**
	 *    RANK TITLE
	 */
	canv.setColor(user.clr)
		.createBeveledClip(startPos_x + 150, startPos_y + 250, 130, 20, 20)
		.addRect(startPos_x + 150, startPos_y + 250, 130, 20)
		.setColor(palette.white)
		.setTextFont(`8pt RobotoBold`) // role window - role name
		.addText(configRank.ranksCheck(user.lvl).title, startPos_x + 215, startPos_y + 264)
		.restore()

	/**
	 *    PROFILE DESCRIPTION
	 */
	canv.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`left`)
		.setTextFont(`8pt Roboto`)
	if (configProfile.checkDesc(user.des).length > 0 && configProfile.checkDesc(user.des).length <= 55) {
		canv.addText(configProfile.formatString(configProfile.checkDesc(user.des), 1).first, 31, 307)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 1).second, 31, 317)
	} else if (configProfile.checkDesc(user.des).length > 55 && configProfile.checkDesc(user.des).length <= 110) {
		canv.addText(configProfile.formatString(configProfile.checkDesc(user.des), 2).first, 31, 307)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 2).second, 31, 317)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 2).third, 31, 327)
	} else if (configProfile.checkDesc(user.des).length > 110 && configProfile.checkDesc(user.des).length <= 165) {
		canv.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).first, 31, 307)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).second, 31, 317)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).third, 31, 327)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).fourth, 31, 337)
	}
	/**
	 *    THREE BOXES
	 *    HEART, LVL, REP
	 *
	 */
	canv.setTextAlign(`center`)
		.setColor(user.clr)
		.setTextFont(`20pt RobotoMedium`)
		.addText(configFormat.formatK(user.likecount), 70, 370) // left point // rank
		.addText(user.lvl, 160, 370) // middle point // level
		.addText(configFormat.formatK(user.rep), 250, 370) // right point // AC

		.setColor(switchColor[usercolor].secondaryText)
		.setTextFont(`8pt Whitney`)
		.addText(`HEARTS`, 70, 390) // left point
		.addText(`LEVEL`, 160, 390) // middle point
		.addText(`FAME`, 250, 390) // right point

	return canv.toBuffer()


}

module.exports = profile