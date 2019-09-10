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
			return this.ui === `light_profileskin` ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex() :
				this.ui === `dark_profileskin` ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.1)).hex() :
					(Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex()
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

	let canvas_x = 580//560
	let canvas_y = 600//730
	let startPos_x = 10
	let startPos_y = 10
	let baseWidth = canvas_x - 20
	let baseHeight = canvas_y - 20

	const {
		body: avatar
	} = await get(member.user.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
	const usercolor = configProfile.checkInterface(user.ui, member)
	const badgesdata = await collection.badges

	//  Remove userid from badges object.
	delete badgesdata.userId

	const key = Object.values(badgesdata)
	const reservedSlot = (collection.storingValue(badgesdata)).filter(x => (x !== null)).length - 1

	let canv = new Canvas(canvas_x, canvas_y) // x y

	/*
       x = starting point from x axis (horizontal)
       y = starting point from y axis (vertical)
       x2 = second point from (x)
       y2 = second point from (y)
    */

	/**
	 *    CARD BASE
	 *    600 x 750
	 */
	canv = canv.setShadowColor(`rgba(28, 28, 28, 1)`)
		.setShadowOffsetY(5)
		.setShadowBlur(10)
		.setColor(switchColor[usercolor].base)
		.addRect(startPos_x + 5, startPos_y + 5, baseWidth - 10, baseHeight - 10) // (x, y, x2, y2)
		.createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
		.addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
		.setShadowBlur(0)
		.setShadowOffsetY(0)
		.save()

	/**
     *    PROFILE STICKER
     */
	if (user.stic) {
		canv.addImage(await configProfile.getAsset(user.stic+switchColor[usercolor].sticker), startPos_x, startPos_y + 270, baseWidth, 460) // STICKER BG
	}

	/**
         *    PROFILE HEADER COVER
         */

	if (!user.cov) {
		canv.addRect(startPos_x, startPos_y, baseWidth, 270)
			.setColor(switchColor[usercolor].base)
			.addImage(await configProfile.getAsset(`defaultcover1`), startPos_x, startPos_y, baseWidth, 270, 107) // COVER HEADER
	} else {
		canv.addImage(await configProfile.getAsset(user.cov), startPos_x, startPos_y, baseWidth, 270, 107) // COVER HEADER
	}



	/**
         *    USER AVATAR
         */
		canv.setColor(switchColor[usercolor].base)
		.addCircle(startPos_x + 132, 255, 95) //avatar
		.addRoundImage(avatar, startPos_x + 42, 165, 180, 180, 90)


	/**
     *    BADGES COLLECTION
     */
	const symetric_xy = 40
	const diameter = Math.round(symetric_xy / 2)
	const y_badge = 290
	await setBadge(symetric_xy, diameter, y_badge)

	async function setBadge(xy, diameter, pos_y) {
		for (var i=0; i<=reservedSlot; i++) {
			canv.addImage(await configProfile.checkBadges(key[i]), startPos_x + 230 + i*50, pos_y, xy, xy, diameter)
		}
	}

	/**
	 *    USERNAME
	 */
	canv.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`center`)
		.setTextFont(`${configProfile.checkUsernameLength(member.user.username).profiler}pt RobotoBold`) // NICKNAME
		.addText(member.user.username, startPos_x + 132, 385)

		.setColor(user.clr)
		.setTextFont(`10pt RobotoBold`)
		.addText(member.roles.find(r => r.name === `Digital`) ? `D I G I T A L   A R T I S T` :
			member.roles.find(r => r.name === `Traditional`) ? `T R A D I T I O N A L  A R T I S T` :
				member.roles.find(r => r.name === `Mixed`) ? `G E N E R A L  A R T I S T` :
					`A R T  A P P R E C I A T O R`, startPos_x + 132, 410)

	/**
	 *
	 * 	Add blue verified badge if user has received total 1,000 hearts
	 *
	 */
	const verifiedStartingPoint = canv.measureText(member.user.username).width * 2.72 + 5
	if (user.likecount >= 1000) {
		canv.addImage(await configProfile.getAsset(`verified_badge`), startPos_x + 42 + verifiedStartingPoint, 355, 30, 30)
	}

	/**
	 *    RANK TITLE
	 */
	canv.setColor(user.clr)
		.createBeveledClip(startPos_x + 270, startPos_y + 355, 250, 38, 25)
		.addRect(startPos_x + 270, startPos_y + 355, 250, 38)
		.setColor(palette.white)
		.setTextFont(`15pt RobotoBold`) // role window - role name
		.addText(configRank.ranksCheck(user.lvl).title, startPos_x + 395, startPos_y + 380)
		.restore()

	/**
	 *    PROFILE DESCRIPTION
	 */
	canv.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`left`)
	if (configProfile.checkDesc(user.des).length > 0 && configProfile.checkDesc(user.des).length < 55) {
		canv.setTextFont(`15pt Roboto`) // profile description.
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 1).first, 50, 448)
	} else if (configProfile.checkDesc(user.des).length > 55 && configProfile.checkDesc(user.des).length < 110) {
		canv.setTextFont(`14pt Roboto`) // profile description.
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 2).first, 50, 448)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 2).second, 50, 468)
	} else if (configProfile.checkDesc(user.des).length > 110 && configProfile.checkDesc(user.des).length < 165) {
		canv.setTextFont(`12pt Roboto`) // profile description.
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).first, 50, 443)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).second, 50, 458)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).third, 50, 473)
	}

	/**
         *    THREE BOXES
         *    HEART, LVL, REP
         * 
         */
		canv.setTextAlign(`center`)
		.setColor(user.clr)
		.setTextFont(`35pt RobotoMedium`)
		.addText(configFormat.formatK(user.likecount), 115, 532) // left point // rank
		.addText(user.lvl, 295, 532) // middle point // level
		.addText(configFormat.formatK(user.rep), 477, 532) // right point // AC

		.setColor(switchColor[usercolor].secondaryText)
		.setTextFont(`12pt Whitney`)
		.addText(`HEARTS`, 115, 557) // left point
		.addText(`LEVEL`, 295, 557) // middle point
		.addText(`FAME`, 477, 557) // right point

	return canv.toBuffer()


}

module.exports = profile