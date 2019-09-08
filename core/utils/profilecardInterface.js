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



	const userdata = await collection.userMetadata
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

	let canvas_x = 600
	let canvas_y = 780
	let startPos_x = 15
	let startPos_y = 15
	let baseWidth = canvas_x - 40
	let baseHeight = canvas_y - 50

	const {
		body: avatar
	} = await get(member.user.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
	const usercolor = configProfile.checkInterface(user.ui, member)
	const badgesdata = await collection.badges

	//  Remove userid from badges object.
	delete badgesdata.userId

	const key = Object.values(badgesdata).filter(e => e)
	const reservedSlot = (collection.storingValue(badgesdata)).filter(x => (x !== null)).length - 1

	let canv = new Canvas(canvas_x, canvas_y) // x y

	/*
            x = starting point from x axis (horizontal)
            y = starting point from y axis (vertical)
            x2 = second point from (x)
            y2 = second point from (y)
    */


	/**
     *    CHECKPOINTS
     * 
     */
	canv = canv.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // checkpoint

		.setColor(user.clr)
		.save() // stack 1


	/**
         *    CARD BASE
         *    600 x 750
         * 
         */
		.setShadowColor(`rgba(28, 28, 28, 1)`)
		.setShadowOffsetY(12)
		.setShadowBlur(18)
		.setColor(palette.darkmatte)
		.addRect(startPos_x + 10, startPos_y + 10, baseWidth - 20, baseHeight - 20) // (x, y, x2, y2)
		.createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
		.setColor(switchColor[usercolor].base)
		.addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
		.setShadowBlur(0)
		.setShadowOffsetY(0)
		.setColor(user.clr)
	//.addRect(startPos_x, startPos_y+215, baseWidth, 55) // badges area
		.save() // stack 2

	/**
     *    PROFILE
     *    STICKER
     *
     */
	if (user.stic) {
		canv.addImage(await configProfile.getAsset(user.stic+switchColor[usercolor].sticker), startPos_x, startPos_y + 270, baseWidth, 460) // STICKER BG
	}

	/**
         *    PROFILE
         *    HEADER COVER
         * 
         */

	if (!user.cov) {
		canv
			.addRect(startPos_x, startPos_y, baseWidth, 270)
			.setColor(switchColor[usercolor].base)
			.addImage(await configProfile.getAsset(`defaultcover1`), startPos_x, startPos_y, baseWidth, 270, 107) // COVER HEADER
	} else {
		canv.addImage(await configProfile.getAsset(user.cov), startPos_x, startPos_y, baseWidth, 270, 107) // COVER HEADER
	}

	canv.restore() // call stack 2
		.restore() // call stack 1


	/**
         *    USER
         *    AVATAR
         * 
         */
		.setColor(switchColor[usercolor].base)
		.addCircle((baseWidth / 2) + 18, 255, 95) //avatar
		.addRoundImage(avatar, 208, 165, 180, 180, 90)


	/**
         *    EXPERIENCE
         *    BAR
         * 
         */
	/*
                            .restore()
                            .setColor(switchColor[usercolor].border)
                            .createBeveledClip(startPos_x+65, 570, baseWidth-135, 20, 20) //holderclip
                            .addRect(startPos_x+65, 570, baseWidth-135, 25) // EXP BAR
                            .addRect(startPos_x+70, 571, baseWidth-141, 18) // EXP BAR layer2
                            .restore()
                            .createBeveledClip(startPos_x+65, 570, calculatedBar, 20, 20) //currentbar_clip
                            .setColor(user.clr)
                            .addRect(startPos_x+65, 570, calculatedBar, 25) // EXP BAR colored(current)
        */


	/**
         * 
         *   rank and exp window WINDOW
         * 
         */
		.restore()
	if (reservedSlot >= 0) {
		canv.createBeveledClip(startPos_x + 70, 490, 220, 40, 30) // role window
			.setColor(Color(user.clr).darken(0.3))
			.addRect(startPos_x + 70, 490, 220, 40)
			.restore()
			.createBeveledClip(startPos_x + 305, 490, 170, 40, 30) // exp window
			.setColor(switchColor[usercolor].border)
			.addRect(startPos_x + 305, 490, 170, 40)
	} else {
		canv.createBeveledClip(startPos_x + 70, 520, 220, 40, 30) // role window
			.setColor(Color(user.clr).darken(0.3))
			.addRect(startPos_x + 70, 520, 220, 40)
			.restore()
			.createBeveledClip(startPos_x + 305, 520, 170, 40, 30) // exp window
			.setColor(switchColor[usercolor].border)
			.addRect(startPos_x + 305, 520, 170, 40)
	}



	/**
     * 
     *   BADGE WINDOW
     * 
     */
	/*
                        if(reservedSlot >= 1) {
                          canv.restore()                    
                          .createBeveledClip(startPos_x+300, 0, 50, 50, 30)   // role window
                          .setColor(user.clr)
                          .addRect(startPos_x+180, 0, 380, 50)
                        }
                        console.log(reservedSlot)
    */


	/**
     * 
     *     THREE BOXES
     *     BORDER
     */
	canv.restore()
		.setColor(switchColor[usercolor].border)
		.addRect(startPos_x + 30, 617, baseWidth - 60, 2) // bottom border
	//.addRect(388, 612, 2, baseHeight-612) // right bottom border
	//.addRect(204, 612, 2, baseHeight-612) // left bottom border


	/**
     *    BADGES COLLECTION
     *    ABOVE EXP BAR
     * 
     */
	const symetric_xy = 45
	const diameter = Math.round(symetric_xy / 2)
	const y_badge = 558
	await setBadge(symetric_xy, diameter, y_badge)

	async function setBadge(xy, diameter, pos_y) {

		if (reservedSlot <= 0) {
			canv.addImage(await configProfile.checkBadges(key[0]), startPos_x + 258, pos_y, xy, xy, diameter)
		} else if (reservedSlot == 1) {
			canv.addImage(await configProfile.checkBadges(key[0]), startPos_x + 243, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[1]), startPos_x + 293, pos_y, xy, xy, diameter)
		} else if (reservedSlot == 2) {
			canv.addImage(await configProfile.checkBadges(key[0]), startPos_x + 208, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[1]), startPos_x + 258, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[2]), startPos_x + 308, pos_y, xy, xy, diameter)
		} else if (reservedSlot === 3) {
			canv.addImage(await configProfile.checkBadges(key[0]), startPos_x + 193, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[1]), startPos_x + 243, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[2]), startPos_x + 293, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[3]), startPos_x + 343, pos_y, xy, xy, diameter)
		} else if (reservedSlot === 4) {
			canv.addImage(await configProfile.checkBadges(key[0]), startPos_x + 158, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[1]), startPos_x + 208, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[2]), startPos_x + 258, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[3]), startPos_x + 308, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[4]), startPos_x + 358, pos_y, xy, xy, diameter)
		} else {
			canv.addImage(await configProfile.checkBadges(key[0]), startPos_x + 143, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[1]), startPos_x + 193, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[2]), startPos_x + 243, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[3]), startPos_x + 293, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[4]), startPos_x + 343, pos_y, xy, xy, diameter)
				.addImage(await configProfile.checkBadges(key[5]), startPos_x + 393, pos_y, xy, xy, diameter)
		}
	}



	/**
     *    PROFILE
     *    USERNAME
     * 
     */
	canv.restore() // call checkpoint
		.setColor(switchColor[usercolor].secondaryText)
		.setTextAlign(`center`)
		.setTextFont(`${configProfile.checkUsernameLength(member.user.username).profiler}pt RobotoBold`) // NICKNAME
		.addText(member.user.username, 300, 385)


		.setColor(user.clr)
		.setTextFont(`10pt RobotoBold`)
		.addText(member.roles.find(r => r.name === `Digital`) ? `D I G I T A L   A R T I S T` :
			member.roles.find(r => r.name === `Traditional`) ? `T R A D I T I O N A L  A R T I S T` :
				member.roles.find(r => r.name === `Mixed`) ? `G E N E R A L  A R T I S T` :
					`A R T  A P P R E C I A T O R`, 300, 410)

	/**
     *    RANK
     *    TITLE
     * 
     */
	if (reservedSlot >= 0) {
		canv.setColor(palette.white)
			.setTextFont(`15pt RobotoBold`) // role window - role name
			.addText(configRank.ranksCheck(user.lvl).title, 195, 517)
	} else {
		canv.setColor(palette.white)
			.setTextFont(`15pt RobotoBold`) // role window - role name
			.addText(configRank.ranksCheck(user.lvl).title, 195, 547)
	}



	/**
     *    PROFILE
     *    DESCRIPTION
     * 
     */
	canv.setColor(switchColor[usercolor].secondaryText)
	if (configProfile.checkDesc(user.des).length > 0 && configProfile.checkDesc(user.des).length < 55) {
		canv.setTextFont(`15pt Roboto`) // profile description.
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 1).first, 300, 448)
	} else if (configProfile.checkDesc(user.des).length > 55 && configProfile.checkDesc(user.des).length < 110) {
		canv.setTextFont(`14pt Roboto`) // profile description.
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 2).first, 300, 448)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 2).second, 300, 468)
	} else if (configProfile.checkDesc(user.des).length > 110 && configProfile.checkDesc(user.des).length < 165) {
		canv.setTextFont(`12pt Roboto`) // profile description.
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).first, 300, 443)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).second, 300, 458)
			.addText(configProfile.formatString(configProfile.checkDesc(user.des), 3).third, 300, 473)
	}




	/**
     *    REPUTATION
     *    POINTS
     * 
     */
	canv.setColor(palette.midgray)
		.setTextFont(`28pt RobotoBold`) // reputation
		.addText(`★`, startPos_x + 390, startPos_y + 320)
		.setTextAlign(`left`)
		.setTextFont(`23pt RobotoBold`)
		.addText(configProfile.checkRep(user.rep), startPos_x + 410, startPos_y + 319)


	/**
         *    THREE BOXES
         *    RANK, LVL, AC
         * 
         */
		.setTextAlign(`center`)
		.setColor(user.clr)
		.setTextFont(`35pt RobotoMedium`)
		.addText(user.lvl, 295, 682) // middle point // level 
		.addText(configFormat.formatK(user.ac), 477, 682) // right point // AC
		.addText(`${configFormat.ordinalSuffix(await collection.ranking + 1)}`, 115, 682) // left point // rank

		.setColor(switchColor[usercolor].secondaryText)
		.setTextFont(`12pt Whitney`)
		.addText(`LEVEL`, 295, 707) // middle point // level description
		.addText(`ARTCOINS`, 477, 707) // right point // artcoins description
		.addText(`RANK`, 115, 707) // left point // ranks description





	/**
     *    EXP PERCENTAGE, CURRENT & MAX.
     *    @TEXTS that surrounding the bar.
     * 
     */
	if (reservedSlot >= 0) {
		canv.setTextFont(`14pt RobotoBold`) // required exp to next lvl
			.setTextAlign(`center`)
			.addText(`${configFormat.threeDigitsComa(user.cur)} XP`, baseWidth - 155, 517)
	} else {
		canv.setTextFont(`14pt RobotoBold`) // required exp to next lvl
			.setTextAlign(`center`)
			.addText(`${configFormat.threeDigitsComa(user.cur)} XP`, baseWidth - 155, 547)
	}


	/**
	 * 
	 * 	Add blue verified badge if user has received total 1,000 hearts
	 * 
	 */
	const verifiedStartingPoint = canv.measureText(member.user.username).width + 300
	if (userdata.liked_counts >= 1000) {
		canv.addImage(await configProfile.getAsset(`verified_badge`), verifiedStartingPoint, 355, 30, 30, 15)
	}


	return canv.toBuffer()


}

module.exports = profile