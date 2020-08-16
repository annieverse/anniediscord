const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)
const Theme = require(`../../ui/colors/themes`)
const canvas = require(`canvas`)

canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-medium.ttf`)), `RobotoMedium`)
canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-black.ttf`)), `RobotoBold`)
canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-thin.ttf`)), `RobotoThin`)

async function friend(stacks, member) {
    const { bot: {db}, meta: {data} } = stacks
    const rank = stacks.meta.data.rank

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
    const relations = await db.userRelations(member.id)

    const friendrelations = relations.filter((e) => {
        if (e.theirRelation == `bestie`) return true
        if (e.theirRelation == `soulmate`) return true
        if (e.theirRelation == `senpai`) return true
        if (e.theirRelation == `kouhai`) return true
        return false
    })

    let canvas_x = 320//300
    let canvas_y = 420//400
    let startPos_x = 10
    let startPos_y = 10
    let baseWidth = canvas_x - 20
    let baseHeight = canvas_y - 20

    const avatar = await stacks.avatar(member.id, true)

    let canv = new Canvas(canvas_x, canvas_y) // x y

    /**
     *    CARD BASE
     */
    canv = canv.setShadowColor(`rgba(28, 28, 28, 1)`)
        .setShadowOffsetY(5)
        .setShadowBlur(10)
        .setColor(user.theme.main)
        .printRectangle(startPos_x + 7, startPos_y + 7, baseWidth - 14, baseHeight - 14) // (x, y, x2, y2)
        .createRoundedClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
        .printRectangle(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
        .setShadowBlur(0)
        .setShadowOffsetY(0)
        .save()

    /**
     *    USER
     *    AVATAR
     */
    canv.printCircularImage(avatar, 15, 15, 30, 30, 15)

    /**
     *    TITLE BAR
     */
        .setColor(user.theme.text)
        .setTextAlign(`left`)
        .setTextFont(`11pt RobotoBold`)
        .printText(`Friends`, 55, 35)
        .setColor(user.theme.separator)
        .printRectangle(startPos_x, 48, baseWidth, 2) // bottom border

    if (relations.length == 0) {
        return canv.toBuffer()
    }


    const listEntry = (username, avatar, relation, x, y) => {
        canv.setColor(rank.color)
            .printCircularImage(avatar, x + 4, y, 38, 38, 19)
            .setTextAlign(`left`)
            .setTextFont(`13pt RobotoBold`)
            .printText(username, x + 50, y + 20)
            .setColor(user.theme.text)
            .setTextFont(`8pt RobotoBold`)
            .printText(relation, x + 50, y + 34)
    }

    for (var i=0;i<Math.min(friendrelations.length, 9); i++) {
        var relUser = await stacks.bot.users.fetch(friendrelations[i].theirUserId)
        var userAvatar = await stacks.avatar(relUser.id, true)
        listEntry(relUser.username, userAvatar, friendrelations[i].theirRelation, 30, 70 + i*33)
    }

    canv.setTextAlign(`left`)
        .setTextFont(`10pt RobotoBold`)
        .printText(`I have a total of `+friendrelations.length+` friends ❤`, 30, 390)


    return canv.toBuffer()

}

module.exports = friend