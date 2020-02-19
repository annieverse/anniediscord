const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)
const { get } = require(`snekfetch`)
const imageUrlRegex = /\?size=2048$/g
const moment = require(`moment`)
const Theme = require(`../../ui/colors/themes`)

Canvas.registerFont(resolve(join(__dirname, `../../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

async function stat(stacks, member) {
	const { bot, commanifier } = stacks
	const rank = stacks.meta.data.rank


	/**
     * id = userid, cur = currentexp, max = maxexp,
     * crv = expcurve, lvl = userlevel, ac = userartcoins,
     * rep = userreputation, des = userdescription, ui = userinterfacemode
     * clr = hex code of user`s rank color.
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
	} = await get(member.user.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
	const getLastOnline = () => bot.users.get(member.id).presence.status != `offline` ? `Currently Active` : user.log ? moment(user.log).fromNow() : `No data retrieved.`



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

	var gradient = canv.createLinearGradient(baseWidth/2, 350, baseWidth/2-10, 0)
	gradient.addColorStop(0, rank.color)
	gradient.addColorStop(1, `transparent`)
	/**
	 *    USER
	 *    AVATAR
	 */
	canv.createBeveledClip(startPos_x, startPos_y-100, baseWidth+100, 360, 100, 1)
		.setColor(rank.color)
		.setGlobalAlpha(0.5)
		.addRect(startPos_x, startPos_y, baseWidth, 260) // (x, y, x2, y2)
		.setGlobalAlpha(0.25)
		.addImage(avatar, startPos_x, startPos_y-10, baseWidth, baseWidth)
		.setGlobalAlpha(1)
		.setColor(gradient)
		.addRect(startPos_x, startPos_y, baseWidth, 260) // (x, y, x2, y2)

		.setColor(user.theme.main)
		.setTextAlign(`Left`)
		.setTextFont(`9pt RobotoBold`)
		.addText(`Last online`, startPos_x + 23, 88)

		.setTextFont(`20pt RobotoBold`)
		.addText(getLastOnline(), startPos_x + 30, 115)

		.setTextAlign(`end`)
		.setTextFont(`9pt RobotoBold`)
		.addText(`Current experience points`, baseWidth - 13, 180)

		.setTextFont(`24pt RobotoBold`)
		.addText(commanifier(user.cur) + ` EXP`, baseWidth - 13, 210)
		.restore()

		.setColor(user.theme.text)
		.setTextAlign(`Left`)
		.setTextFont(`9pt RobotoBold`)
		.addText(`Ranking`, startPos_x + 28, 290)

		.setColor(rank.color)
		.setTextFont(`33pt RobotoBold`)
		.addText(await db.userExpRanking(member.id) + 1, startPos_x + 33, 350)

		.setColor(user.theme.text)
		.setTextFont(`9pt RobotoBold`)
		.addText(`from a total of `+commanifier(bot.users.size)+` members`, startPos_x + 38, 366)


	return canv.toBuffer()

}

module.exports = stat